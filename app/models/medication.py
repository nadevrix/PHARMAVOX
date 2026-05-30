from datetime import datetime
from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base
from typing import List

class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    active_ingredient: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    concentration: Mapped[str] = mapped_column(String(100), nullable=False)
    presentation: Mapped[str] = mapped_column(String(255), nullable=False)
    manufacturer: Mapped[str] = mapped_column(String(255), nullable=True)
    
    # Textos extensos e interpretados de prospectos
    raw_leaflet_text: Mapped[str] = mapped_column(Text, nullable=True)
    simplified_summary: Mapped[str] = mapped_column(Text, nullable=True)
    
    cached_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones del ORM
    scan_history: Mapped[List["ScanHistory"]] = relationship("ScanHistory", back_populates="medication")
    dose_reminders: Mapped[List["DoseReminder"]] = relationship("DoseReminder", back_populates="medication")
