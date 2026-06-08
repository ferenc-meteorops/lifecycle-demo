import os

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5432/lifecycle_demo",
)

engine = create_engine(DATABASE_URL)
Base = declarative_base()
