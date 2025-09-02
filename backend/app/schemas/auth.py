from pydantic import BaseModel

class GoogleTokenRequest(BaseModel):
    access_token: str

class AccessResponse(BaseModel):
    msg: str