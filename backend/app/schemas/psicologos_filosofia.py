from pydantic import BaseModel, EmailStr
from typing import Optional
from dataclasses import Field

# --- ESQUEMAS PSICÓLOGOS ---
class PsicologoCreate(BaseModel):
    nombre: Optional[str] = None
    alias: str = Field(..., description="Alias para identificarlo rápido (ej. 'Doc Principal')")
    email: EmailStr

class PsicologoUpdate(BaseModel):
    nombre: Optional[str] = None
    alias: Optional[str] = None
    email: Optional[EmailStr] = None

class PsicologoResponse(PsicologoCreate):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

# --- ESQUEMAS CORRIENTES FILOSÓFICAS ---
class CorrienteCreate(BaseModel):
    nombre: str

class CorrienteResponse(CorrienteCreate):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True