import os
from fastapi import FastAPI
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel
from dotenv import load_dotenv

from app.api.v1.endpoints import analyze

# Cargar variables de entorno desde un archivo .env
load_dotenv()
# Configuración de la aplicación FastAPI
app = FastAPI(
    title="AI_MIND",
    version="1.0.0",
)

app.include_router(
    analyze.router,
    prefix="/api/v1",
    tags=["Análisis"]
)

class Settings(BaseModel):
    authjwt_secret_key: str = os.getenv("AUTHJWT_SECRET_KEY")

@AuthJWT.load_config
def get_config():
    return Settings()