"""
Orchestrator: the actual agent.

This is a small explicit state machine, not one long prompt:

    understand_goal -> retrieve -> decide -> act -> verify
                                       ^                |
                                       |__ replan <______| (on failure)
                                                          |
                                                    outcome / escalate

Every node writes a CaseEvent so the full Goal -> Decision -> Action ->
Intermediate Result -> Adaptation -> Outcome trace exists in the database
and can be replayed in the UI or the demo video.

The `decide` step calls out to an LLM (Claude) when ANTHROPIC_API_KEY is
set, and falls back to a deterministic rule-based planner otherwise, so
the whole system is runnable and demoable with zero external dependency,
while still being "real" agentic reasoning when a key is present.
"""
import json
import os
from typing import Optional

from sqlalchemy.orm import Session

import models
from agent import tools

MAX_REPLANS = 3

RESOLUTION_LADDER = ["replace", "refund", "store_credit"]  # tried in order, minus what's ruled out


def _log(db: Session, case: models.Case, step: str, summary: str, detail: dict, success: bool = True):
    event = models.CaseEvent(
        case_id=case.id,
        step=step,
        summary=summary,
        detail=json.dumps(detail, default=str),
        success=success,
    )
    db.add(event)
    db.commit()
    return event


def _llm_decide(goal_text: str, evidence: dict, ruled_out: list[str]) -> Optional[dict]:
    """Ask Claude to choose a resolution given evidence. Returns None if no API key configured."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        options = [o for o in RESOLUTION_LADDER + ["cancel", "escalate"] if o not in ruled_out]
        prompt = (
            "You are a customer resolution agent. Choose exactly one resolution action "
            f"from this list: {options}. Base your choice only on the evidence given. "
            "Respond ONLY with JSON: {\"action\": \"<one of the options>\", \"reason\": \"<one sentence>\"}.\n\n"
            f"Customer goal: {goal_text}\n"
            f"Evidence: {json.dumps(evidence, default=str)}\n"
            f"Already ruled out this case: {ruled_out}"
        )
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        text = "".join(b.text for b in resp.content if b.type == "text")
        text = text.strip().strip("`").replace("json\n", "")
        return json.loads(text)
    except Exception:
        return None


def _rule_based_decide(goal_text: str, evidence: dict, ruled_out: list[str]) -> dict:
    """Deterministic fallback planner - transparent, explainable, no external dependency."""
    goal = goal_text.lower()
    order = evidence.get("order", {})
    inventory = evidence.get("inventory", {})
    policy_hit = evidence.get("policy", {}).get("matches", [])

    wants_replacement = "replace" in goal or "wrong item" in goal or "defective" in goal
    wants_refund = "refund" in goal or "money back" in goal

    candidates = []
    if wants_replacement and "replace" not in ruled_out:
        candidates.append("replace")
    if (wants_refund or not wants_replacement) and "refund" not in ruled_out:
        candidates.append("refund")
    for fallback in ["store_credit", "cancel"]:
        if fallback not in ruled_out:
            candidates.append(fallback)

    if candidates:
        action = candidates[0]
        reason = f"Selected '{action}' based on stated goal and current evidence"
        if policy_hit:
            reason += f"; consistent with policy on {policy_hit[0]['topic']}"
        return {"action": action, "reason": reason}

    return {"action": "escalate", "reason": "No safe automated resolution path remains"}


def run_case(db: Session, case: models.Case) -> models.Case:
    case.status = models.CaseStatus.in_progress
    db.commit()

    _log(db, case, "goal", "Understood customer goal", {"goal_text": case.goal_text})

    # --- Retrieve ---
    customer_res = tools.get_customer(db, case.customer_id)
    order_res = tools.get_order(db, case.order_id)
    _log(db, case, "retrieve", "Retrieved customer and order records",
         {"customer": customer_res.data, "order": order_res.data},
         success=customer_res.ok and order_res.ok)

    if not order_res.ok:
        case.status = models.CaseStatus.escalated
        db.commit()
        _log(db, case, "escalate", "Escalated: order record missing", {}, success=False)
        return case

    inventory_res = tools.get_inventory(db, order_res.data["sku"])
    policy_res = tools.search_policy(db, ["refund", "replacement", case.goal_text.split()[0]])
    _log(db, case, "retrieve", "Retrieved inventory and policy context",
         {"inventory": inventory_res.data, "policy": policy_res.data})

    evidence = {
        "customer": customer_res.data,
        "order": order_res.data,
        "inventory": inventory_res.data,
        "policy": policy_res.data,
    }

    ruled_out: list[str] = []
    order_row = db.query(models.Order).filter(models.Order.id == case.order_id).first()

    for attempt in range(1, MAX_REPLANS + 2):
        # --- Decide ---
        decision = _llm_decide(case.goal_text, evidence, ruled_out) or _rule_based_decide(
            case.goal_text, evidence, ruled_out
        )
        action = decision.get("action", "escalate")
        _log(db, case, "decide", f"Decided on action: {action}", decision)

        if action == "escalate":
            case.status = models.CaseStatus.escalated
            case.resolution_action = "escalate"
            db.commit()
            _log(db, case, "escalate", decision.get("reason", "Escalated to human"), decision, success=False)
            return case

        # --- Act ---
        expected_status = {
            "refund": "refunded", "replace": "replaced",
            "store_credit": "store_credit_issued", "cancel": "cancelled",
        }[action]
        exec_fn = {
            "refund": tools.execute_refund, "replace": tools.execute_replacement,
            "store_credit": tools.execute_store_credit, "cancel": tools.execute_cancellation,
        }[action]
        act_res = exec_fn(db, order_row)
        _log(db, case, "act", act_res.message, act_res.data, success=act_res.ok)

        if not act_res.ok:
            ruled_out.append(action)
            _log(db, case, "adapt", f"'{action}' blocked ({act_res.message}); replanning",
                 {"ruled_out": ruled_out}, success=False)
            continue

        # --- Verify ---
        verify_res = tools.verify_state(db, case.order_id, expected_status)
        _log(db, case, "verify", verify_res.message, verify_res.data, success=verify_res.ok)

        if verify_res.ok:
            case.status = models.CaseStatus.resolved
            case.resolution_action = action
            db.commit()
            _log(db, case, "outcome", f"Case resolved via '{action}'", {"action": action})
            return case
        else:
            ruled_out.append(action)
            _log(db, case, "adapt", f"Verification failed for '{action}'; replanning",
                 {"ruled_out": ruled_out}, success=False)

    case.status = models.CaseStatus.escalated
    db.commit()
    _log(db, case, "escalate", "Escalated after exhausting safe automated options", {}, success=False)
    return case
