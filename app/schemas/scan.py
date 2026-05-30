from pydantic import BaseModel
from typing import List, Optional

class MedicationScanInfo(BaseModel):
    name: str
    active_ingredient: str
    concentration: str
    presentation: str
    manufacturer: Optional[str] = None

class ScanResponse(BaseModel):
    success: bool
    medication: MedicationScanInfo
    quick_summary: str
    critical_warnings: List[str]
