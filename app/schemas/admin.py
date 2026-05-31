from pydantic import BaseModel, Field
from typing import List, Optional

# ============================================================
# Módulo 5.1 — Gestión CRUD de Usuarios
# ============================================================

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str  # "pharmacist" | "admin"
    is_active: bool

class CreateUserRequest(BaseModel):
    email: str
    full_name: str
    role: str = "pharmacist"
    password: str

class CreateUserResponse(BaseModel):
    success: bool
    user_id: int
    message: str

class DeleteResponse(BaseModel):
    success: bool
    message: str

# ============================================================
# Módulo 5.2 — CRUD de PDFs de Prospectos
# ============================================================

class PDFListItem(BaseModel):
    id: int
    medication_name: str
    file_name: str
    upload_date: str

class PDFUploadResponse(BaseModel):
    success: bool
    pdf_id: int
    file_path: str
    message: str

# ============================================================
# Módulo 5.3 — Asistente sobre PDFs (Ask-PDF)
# ============================================================

class AskPDFRequest(BaseModel):
    pdf_id: int
    question: str
    conversation_history: Optional[List[str]] = Field(default_factory=list)

class AskPDFSource(BaseModel):
    pdf_id: int
    document_name: str
    page_number: int
    section_title: str
    matched_text: str

class AskPDFResponse(BaseModel):
    text_response: str
    voice_response: str
    visual_layout: dict
    sources: List[AskPDFSource]
