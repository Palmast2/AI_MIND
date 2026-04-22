from pydantic import BaseModel, EmailStr
from typing import Optional
from app.schemas.demograficos import DemograficoBase

class GoogleTokenRequest(BaseModel):
    access_token: str

class AccessResponse(BaseModel):
    msg: str


class LoginUserContext(BaseModel):
    datos_demograficos: Optional[DemograficoBase] = None


class LoginResponse(BaseModel):
    msg: str
    user: LoginUserContext

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str