from pydantic import BaseModel
from typing import List

class SimplifiedSection(BaseModel):
    title: str
    description: str
    icon: str

class SimplifyRequest(BaseModel):
    raw_text: str

class SimplifyResponse(BaseModel):
    simplified_title: str
    sections: List[SimplifiedSection]
