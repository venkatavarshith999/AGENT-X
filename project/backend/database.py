"""
Database engine & session management.

Single responsibility: own the SQLAlchemy engine/session lifecycle so the
rest of the app never talks to sqlite3 directly. Swapping SQLite for
Postgres later is a one-line change (DATABASE_URL) with no code changes
elsewhere - that's the point of isolating this here.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resolution_agent.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a session, always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
