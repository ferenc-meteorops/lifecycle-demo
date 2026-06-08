from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.config import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=True, server_default="medium")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
