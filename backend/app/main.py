from dotenv import load_dotenv
import os
from fastapi import FastAPI
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from app.api.v1.endpoints import analyze
from app.api.v1.endpoints import auth
from app.api.v1.endpoints import chat
from app.core import config
from app.core.rate_limit import limiter

# Cargar variables de entorno desde un archivo .env
load_dotenv()

# Configuración de la aplicación FastAPI
app = FastAPI(
    title="AI_MIND",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

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

app.include_router(
    chat.router,
    prefix="/api/v1",
    tags=["Chat"]
)