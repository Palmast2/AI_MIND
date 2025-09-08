from pydantic import BaseModel, EmailStr

class GoogleTokenRequest(BaseModel):
    access_token: str

class AccessResponse(BaseModel):
    msg: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str