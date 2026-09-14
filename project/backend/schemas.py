"""
Pydantic schemas — the contract between backend and frontend.
Keeping these separate from the SQLAlchemy models means the API's public
shape can evolve independently of storage (a core separation-of-concerns
principle).
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class UserRegister(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Domain ----------
class CustomerOut(BaseModel):
    id: str
    name: str
    email: str
    tier: str

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: str
    sku: str
    product_name: str
    price: float
    status: str

    class Config:
        from_attributes = True


class CaseCreate(BaseModel):
    customer_id: str
    order_id: str
    goal_text: str = Field(min_length=3)


class CaseOut(BaseModel):
    id: str
    customer_id: str
    order_id: str
    goal_text: str
    status: str
    resolution_action: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CaseEventOut(BaseModel):
    id: str
    step: str
    summary: str
    detail: Optional[str] = None
    success: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CaseWithTrace(CaseOut):
    events: List[CaseEventOut] = []
