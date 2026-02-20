from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

from config import get_settings

settings = get_settings()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

db_url = settings.DATABASE_URL
# Railway public PostgreSQL requires SSL
if db_url.startswith("postgresql") and "sslmode" not in db_url:
    separator = "&" if "?" in db_url else "?"
    db_url = f"{db_url}{separator}sslmode=require"

engine = create_engine(db_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
