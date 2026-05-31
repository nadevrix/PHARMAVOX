"""
Schemas del Asistente FarmaVox — PharmaVox
==========================================
Define los modelos Pydantic para el endpoint POST /api/v1/ask.
El asistente ahora es stateless y no utiliza historial conversacional;
toda su información la extrae en tiempo real de los PDFs en la base de datos.
"""

from pydantic import BaseModel, Field
from typing import List, Optional


class VisualLayout(BaseModel):
    """
    Información de layout para el frontend (modo de pantalla, colores, bullets).
    Permite que el backend sugiera cómo presentar la respuesta visualmente.
    """
    display_mode: str = "card"
    card_type: str = "info"         # "info" | "warning" | "success" | "error"
    title: str
    content_bullets: List[str]
    highlight_color: Optional[str] = "#3B82F6"


class AskRequest(BaseModel):
    """
    Request del endpoint POST /api/v1/ask.
    El cliente únicamente envía la pregunta actual del usuario y el historial.
    """
    question: str
    medication_context: str = ""    # Campo opcional para contexto manual adicional
    conversation_history: Optional[List[str]] = None


class AskResponse(BaseModel):
    """
    Respuesta del endpoint POST /api/v1/ask.
    Incluye la respuesta textual, el layout visual y el audio TTS directamente codificado en Base64.
    """
    text_response: str
    voice_response: str             # Versión concisa para TTS
    visual_layout: VisualLayout
    audio_chunks: Optional[List[str]] = Field(default_factory=list)
    audio_base64: Optional[str] = Field(default=None, description="Audio en formato MP3 codificado en Base64 para reproducción inmediata")
