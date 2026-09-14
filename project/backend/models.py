"""
Data model layer.

Entities:
  User        - authenticated support operator (viewer of the agent's work)
  Customer    - end customer the agent resolves cases for
  Order       - purchase record, source of truth for eligibility
  InventoryItem - stock levels, referenced when the agent tries a replacement
  Policy      - short text rules the agent must respect (retrieved via
                simple keyword search, standing in for a policy RAG)
  Case        - one support ticket / the agent's unit of work
  CaseEvent   - append-only log of every step the agent takes on a case.
                This table IS the "Goal -> Decision -> Action -> Verify ->
                Adapt -> Outcome" trace the rubric asks the demo to show.
"""
import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, ForeignKey, Enum, Text, Boolean
)
from sqlalchemy.orm import relationship

from database import Base


def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:10]}"


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: gen_id("usr"))
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="agent_operator")  # agent_operator | admin
    created_at = Column(DateTime, default=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"
    id = Column(String, primary_key=True, default=lambda: gen_id("cust"))
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    tier = Column(String, default="standard")  # standard | premium
    signup_date = Column(DateTime, default=datetime.utcnow)
    orders = relationship("Order", back_populates="customer")


class Order(Base):
    __tablename__ = "orders"
    id = Column(String, primary_key=True, default=lambda: gen_id("ord"))
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    sku = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    purchase_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="delivered")  # delivered | refunded | replaced | cancelled
    customer = relationship("Customer", back_populates="orders")


class InventoryItem(Base):
    __tablename__ = "inventory"
    sku = Column(String, primary_key=True)
    product_name = Column(String, nullable=False)
    stock_count = Column(Integer, default=0)


class Policy(Base):
    __tablename__ = "policies"
    id = Column(String, primary_key=True, default=lambda: gen_id("pol"))
    topic = Column(String, nullable=False)      # e.g. "refund_window", "replacement_eligibility"
    text = Column(Text, nullable=False)
    keywords = Column(String, nullable=False)   # comma-separated, used for retrieval


class CaseStatus(str, enum.Enum):
    open = "open"
    in_progress = "in_progress"
    resolved = "resolved"
    escalated = "escalated"


class Case(Base):
    __tablename__ = "cases"
    id = Column(String, primary_key=True, default=lambda: gen_id("case"))
    customer_id = Column(String, ForeignKey("customers.id"), nullable=False)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    goal_text = Column(Text, nullable=False)          # customer's stated request
    status = Column(Enum(CaseStatus), default=CaseStatus.open)
    resolution_action = Column(String, nullable=True)  # refund | replace | store_credit | cancel | escalate
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)


class CaseEvent(Base):
    __tablename__ = "case_events"
    id = Column(String, primary_key=True, default=lambda: gen_id("evt"))
    case_id = Column(String, ForeignKey("cases.id"), nullable=False)
    step = Column(String, nullable=False)   # goal | retrieve | decide | act | verify | adapt | escalate | outcome
    summary = Column(Text, nullable=False)
    detail = Column(Text, nullable=True)    # JSON-encoded payload for the UI trace
    success = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
