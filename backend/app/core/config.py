import os
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel

class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("AUTHJWT_SECRET_KEY")
    authjwt_token_location: set = {"cookies"}
    authjwt_cookie_csrf_protect: bool = True

@AuthJWT.load_config
def get_config():
    return Settings()