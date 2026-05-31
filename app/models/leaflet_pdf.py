from datetime import datetime
from sqlalchemy import String, Integer, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class LeafletPDF(Base):
    __tablename__ = "leaflet_pdfs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), unique=True, nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Datos interpretados por la IA
    raw_text: Mapped[str] = mapped_column(Text, nullable=True)
    parsed_json: Mapped[str] = mapped_column(Text, nullable=True)
    
    # Control de procesamiento por la IA
    is_processed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
