# Registro unificado de modelos SQLAlchemy ORM
from app.db.session import Base
from app.models.user import User
from app.models.medication import Medication
from app.models.scan_history import ScanHistory
from app.models.dose_reminder import DoseReminder
from app.models.leaflet_pdf import LeafletPDF

# Para facilitar importaciones globales
__all__ = [
    "Base",
    "User",
    "Medication",
    "ScanHistory",
    "DoseReminder",
    "LeafletPDF"
]
