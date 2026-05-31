from pydantic import BaseModel, computed_field
from datetime import datetime
from typing import Optional

class LeafletPDFOut(BaseModel):
    id: int
    filename: str
    file_path: str
    file_size: int
    is_processed: bool
    uploaded_at: datetime
    raw_text: Optional[str] = None
    parsed_json: Optional[str] = None

    @computed_field
    def download_url(self) -> str:
        return f"/api/v1/pdfs/{self.id}/download"

    class Config:
        from_attributes = True

class LeafletPDFUpdate(BaseModel):
    filename: Optional[str] = None
    is_processed: Optional[bool] = None

