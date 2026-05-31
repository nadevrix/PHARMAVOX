from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = Field(default="pharmacist", description="Roles: admin, pharmacist")
    timezone: str = "UTC"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, description="Contraseña del usuario")

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    timezone: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6, description="Nueva contraseña del usuario")

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
