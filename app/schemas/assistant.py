from pydantic import BaseModel, Field
from typing import List, Optional

class VisualLayout(BaseModel):
    display_mode: str = "card"
    card_type: str = "info"
    title: str
    content_bullets: List[str]
    highlight_color: Optional[str] = "#3B82F6"

class AskRequest(BaseModel):
    medication_context: str
    question: str
    conversation_history: Optional[List[str]] = Field(default_factory=list)

class AskResponse(BaseModel):
    text_response: str
    voice_response: str
    visual_layout: VisualLayout
    audio_chunks: Optional[List[str]] = Field(default_factory=list)
