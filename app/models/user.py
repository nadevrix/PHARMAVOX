from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from typing import List

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    
    # Roles soportados: admin, pharmacist
    role: Mapped[str] = mapped_column(String(50), default="pharmacist", nullable=False)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC", nullable=False)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones del ORM
    scan_history: Mapped[List["ScanHistory"]] = relationship("ScanHistory", back_populates="user", cascade="all, delete-orphan")
    dose_reminders: Mapped[List["DoseReminder"]] = relationship("DoseReminder", back_populates="user", cascade="all, delete-orphan")
