from dotenv import load_dotenv
import os
from fastapi import FastAPI
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from fastapi.middleware.cors import CORSMiddleware

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
# Configuración de rate limit
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Para desarrollo
        "https://tudominio.com"   # Para producción
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de enrutador
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