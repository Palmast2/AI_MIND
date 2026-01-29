import os
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel
from dotenv import load_dotenv

# Cargar variables del .env
load_dotenv()

class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("AUTHJWT_SECRET_KEY")
    authjwt_token_location: set = {"cookies"}
    authjwt_cookie_csrf_protect: bool = True
    
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")

# Creamos la variable 'settings' para que otros archivos la puedan importar
settings = Settings()

@AuthJWT.load_config
def get_config():
    return settings