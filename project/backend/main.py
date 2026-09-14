"""
API entrypoint.

Layering:
  main.py       -> HTTP boundary only (routing, status codes, auth deps)
  schemas.py    -> request/response contracts
  models.py     -> persistence
  agent/*       -> business logic (the actual agent)
This keeps the agent testable and runnable outside of HTTP (see agent/orchestrator.run_case).
"""
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, engine, get_db
import models
import schemas
from auth import (
    hash_password, verify_password, create_access_token, get_current_user
)
from agent.orchestrator import run_case

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Autonomous Customer Resolution Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your deployed frontend origin in production
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------- Auth ----------------
@app.post("/auth/register", response_model=schemas.Token, status_code=201)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    user = models.User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    token = create_access_token(user.id)
    return schemas.Token(access_token=token, user=user)


@app.post("/auth/login", response_model=schemas.Token)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    token = create_access_token(user.id)
    return schemas.Token(access_token=token, user=user)


@app.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)):
    return current_user


# ---------------- Reference data ----------------
@app.get("/customers", response_model=list[schemas.CustomerOut])
def list_customers(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Customer).all()


@app.get("/customers/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(customer_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.get("/customers/{customer_id}/orders", response_model=list[schemas.OrderOut])
def customer_orders(customer_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Order).filter(models.Order.customer_id == customer_id).all()


@app.get("/orders/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


# ---------------- Cases ----------------
@app.post("/cases", response_model=schemas.CaseOut, status_code=201)
def create_case(payload: schemas.CaseCreate, db: Session = Depends(get_db),
                 _=Depends(get_current_user)):
    if not db.query(models.Customer).filter(models.Customer.id == payload.customer_id).first():
        raise HTTPException(status_code=404, detail="Customer not found")
    if not db.query(models.Order).filter(models.Order.id == payload.order_id).first():
        raise HTTPException(status_code=404, detail="Order not found")
    case = models.Case(**payload.model_dump())
    db.add(case)
    db.commit()
    return case


@app.get("/cases", response_model=list[schemas.CaseOut])
def list_cases(db: Session = Depends(get_db), _=Depends(get_current_user)):
    return db.query(models.Case).order_by(models.Case.created_at.desc()).all()


@app.get("/cases/{case_id}", response_model=schemas.CaseWithTrace)
def get_case(case_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    events = db.query(models.CaseEvent).filter(
        models.CaseEvent.case_id == case_id
    ).order_by(models.CaseEvent.created_at.asc()).all()
    result = schemas.CaseWithTrace.model_validate(case)
    result.events = [schemas.CaseEventOut.model_validate(e) for e in events]
    return result


@app.post("/cases/{case_id}/resolve", response_model=schemas.CaseWithTrace)
def resolve_case(case_id: str, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Triggers the autonomous agent loop on this case."""
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    case = run_case(db, case)
    events = db.query(models.CaseEvent).filter(
        models.CaseEvent.case_id == case_id
    ).order_by(models.CaseEvent.created_at.asc()).all()
    result = schemas.CaseWithTrace.model_validate(case)
    result.events = [schemas.CaseEventOut.model_validate(e) for e in events]
    return result


@app.get("/health")
def health():
    return {"status": "ok"}
