from dotenv import load_dotenv
import os
from fastapi import FastAPI

from app.api.v1.endpoints import analyze
from app.api.v1.endpoints import auth
from app.core import config

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
app.include_router(
    auth.router,
    prefix="/api/v1",
    tags=["Autenticación"]
)