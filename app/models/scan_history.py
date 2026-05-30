from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.session import Base

class ScanHistory(Base):
    __tablename__ = "scan_histories"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id", ondelete="SET NULL"), nullable=True)
    
    # Ruta de almacenamiento de la imagen o del PDF subido
    file_url: Mapped[str] = mapped_column(String(512), nullable=True)
    
    # Registro de éxito en la lectura por la IA
    ocr_success: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    scanned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relaciones del ORM
    user: Mapped["User"] = relationship("User", back_populates="scan_history")
    medication: Mapped["Medication"] = relationship("Medication", back_populates="scan_history")
