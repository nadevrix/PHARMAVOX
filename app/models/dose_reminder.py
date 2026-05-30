from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Boolean, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class DoseReminder(Base):
    __tablename__ = "dose_reminders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id", ondelete="CASCADE"), nullable=False)
    
    # Parámetros del cronograma
    time_of_day: Mapped[str] = mapped_column(String(10), nullable=False)  # Formato "HH:MM"
    voice_reminder_text: Mapped[str] = mapped_column(String(512), nullable=False) # Texto fonético amigable
    
    interval_hours: Mapped[int] = mapped_column(Integer, default=8, nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones del ORM
    user: Mapped["User"] = relationship("User", back_populates="dose_reminders")
    medication: Mapped["Medication"] = relationship("Medication", back_populates="dose_reminders")
