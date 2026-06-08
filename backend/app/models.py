from sqlalchemy import Column, DateTime, Integer, String, Text, func

from app.config import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), server_default="active", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
