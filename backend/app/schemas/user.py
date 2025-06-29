from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    user_id: UUID
    email: EmailStr
    fecha_creacion: datetime
    ultimo_login: Optional[datetime]
    is_active: bool
    login_attempts: int

    class Config:
        orm_mode = True