# Resolve — Autonomous Customer Resolution Agent

Built for **Tech Zephyr 4.0, Agentic AI Hackathon (IIT Bhubaneswar)** — Track 3 / Problem Statement 5.

An agent that actually resolves a customer's ticket — inspects real order/inventory/policy
state, executes a state-changing action, verifies it took effect, and replans when
blocked — instead of just classifying or replying to it.

---

## 1. Architecture

```
frontend/index.html   Premium single-page UI: auth + case dashboard + live agent trace
backend/main.py        FastAPI HTTP layer (auth, cases, resolve trigger)
backend/auth.py        JWT auth, bcrypt password hashing
backend/models.py      SQLAlchemy schema: users, customers, orders, inventory, policies, cases, case_events
backend/schemas.py     Pydantic request/response contracts
backend/agent/tools.py       Simulated enterprise systems (customer DB, order API, inventory
                              API, refund/replace/store-credit/cancel endpoints, verify endpoint)
backend/agent/orchestrator.py  The agent itself — the plan/act/verify/replan state machine
backend/seed_data.py   Demo data (3 customers/orders, one deliberately out-of-stock SKU
                        to force a visible adaptation)
```

**Separation of concerns**: HTTP routing, business logic (the agent), data persistence,
and API contracts each live in their own module. The agent (`agent/orchestrator.py`) has
no FastAPI import — it takes a DB session and a `Case` row and returns a resolved one, so
it's directly unit-testable and could be called from a CLI, a queue worker, or a test
harness with no changes.

### The agent loop

```
understand_goal → retrieve → decide → act → verify
                                 ↑                │
                                 └──── adapt ──────┤ (on blocked action or failed verify)
                                                    │
                                          outcome  /  escalate
```

Every node writes an append-only `CaseEvent` row. That table **is** the
Goal → Decision → Action → Intermediate Result → Adaptation → Outcome trace the
rulebook asks the demo video to show — nothing in the UI is scripted separately from
what the agent actually did.

`decide` calls Claude (`ANTHROPIC_API_KEY` env var) when available, and falls back to a
transparent rule-based planner otherwise — so the system runs and demos with zero
external dependency, while still supporting real LLM reasoning.

### Why this isn't a "one-shot LLM answer"
- Retrieval, decision, action, and verification are **separate function calls**, each logged
  independently — a judge can point at any one step and ask "why."
- The out-of-stock demo case (`ord_101`, SKU `SKU-CAM-01`, seeded with 0 stock) makes the
  agent actually attempt `replace`, actually get blocked by the inventory tool, and actually
  replan to `store_credit` — this isn't hardcoded branching, it's the loop reacting to a real
  tool failure.
- Escalation only fires when every action in the ladder (`replace → refund → store_credit →
  cancel`) has been ruled out.

---

## 2. Running it

### Backend
```bash
cd backend
pip install -r requirements.txt
python seed_data.py          # creates resolution_agent.db with demo data
uvicorn main:app --reload    # http://localhost:8000
```
Demo login: `demo@resolveai.app` / `Demo1234!`

Optional — enable real LLM reasoning in `decide`:
```bash
export ANTHROPIC_API_KEY=sk-...
```

Try it end-to-end:
```bash
curl -X POST localhost:8000/auth/login -H "Content-Type: application/json" \
  -d '{"email":"demo@resolveai.app","password":"Demo1234!"}'
# -> copy access_token
curl -X POST localhost:8000/cases -H "Authorization: Bearer <token>" -H "Content-Type: application/json" \
  -d '{"customer_id":"cust_001","order_id":"ord_101","goal_text":"The camera I received is defective, please replace it"}'
# -> copy case id, then:
curl -X POST localhost:8000/cases/<case_id>/resolve -H "Authorization: Bearer <token>"
```

### Frontend
`frontend/index.html` is a fully self-contained page (React via CDN, no build step) —
just open it in a browser once the backend is running. It talks to the **real API**:
register or log in, list customers, create a case, run the agent, and watch the trace
come back from `GET /cases/{id}` — nothing is mocked. The backend URL is editable from
the login screen (click "Backend: http://localhost:8000") in case you deploy it
somewhere other than localhost. The auth token lives only in React state for the
session (no browser storage), so refreshing the page signs you out — swap in an
httpOnly cookie if you deploy this for real.

---

## 3. Design system

Palette (as specified), used deliberately by role rather than decoratively:

| Token | Hex | Role |
|---|---|---|
| White | `#FFFFFF` | Dominant background |
| Soft Lavender | `#F3EEFF` | Section backgrounds (sidebar, hero panel) — never text |
| Light Purple | `#E5D9FF` | Borders, dividers — never text |
| Primary Purple | `#7C5CFC` | Icons, focus rings, large/graphical active-state indicators |
| Deep Purple | `#5B3FC4` | Button fills, links, hover/pressed states |
| Dark Text | `#18151F` | Primary text |
| Gray | `#6F6A7A` | Secondary/meta text |

**A note on Primary Purple vs. Deep Purple**: measured against this exact palette,
white text on Primary Purple `#7C5CFC` is **4.38:1** — just under the 4.5:1 AA
threshold for normal text. Deep Purple `#5B3FC4` measures **7.11:1**. So button
fills and text links use Deep Purple (still purple, fully AA-safe), and Primary
Purple is reserved for icons, focus rings, and graphical active-state marks (borders,
dots), where the 3:1 non-text-contrast rule applies and is comfortably met. This keeps
every stated rule satisfied at once rather than picking one and quietly breaking another.

Status is never color-only: every badge pairs an icon + text label (✓ Resolved,
⚠ Escalated, ↻ In progress, ⏱ Open), and a blocked step in the trace shows both a
red-tinted icon and a "Blocked" text chip.

Type: Manrope for headings (distinct geometric personality), Inter for body/UI
(dense-dashboard legibility) — two clearly distinct sans families rather than one
neutral system font throughout.

---

## 4. Mapping to the evaluation rubric

| Criterion | How it's addressed |
|---|---|
| Agentic workflow & autonomy (25%) | Explicit plan→act→verify→replan state machine, not a single prompt |
| Tool/environment interaction (15%) | 8 discrete tool functions (`agent/tools.py`) called individually and logged |
| Adaptation & failure recovery (15%) | Seeded out-of-stock SKU forces a real blocked action → replan → new action |
| Technical implementation (15%) | Layered FastAPI + SQLAlchemy backend, JWT auth, typed Pydantic contracts |
| Problem relevance & innovation (10%) | Directly targets PS5's required workflow line-by-line |
| Prototype functionality & UX (10%) | Working auth, case creation, live trace UI, accessible design system |
| Evaluation, verification & robustness (10%) | Dedicated `verify_state` tool re-queries truth after every action |

---

## 5. Suggested demo script (for the 3–5 min video)

1. **Happy path** — refund case on `ord_102`: goal → decide → act → verify → resolved. Fast, clean.
2. **Adaptation** — replacement case on `ord_101` (0 stock seeded): decide `replace` → act fails
   ("No stock available") → adapt → decide `store_credit` → act → verify → resolved. This is the
   moment that proves autonomy, not scripting.
3. **Escalation** (optional) — an order in a terminal status with no valid action left, to show the
   agent stopping safely rather than guessing.
