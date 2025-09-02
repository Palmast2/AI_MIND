from dotenv import load_dotenv
import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler

from fastapi_jwt_auth.exceptions import AuthJWTException, JWTDecodeError

from app.api.v1.endpoints import analyze, auth, chat, reportes
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

# Exception handlers para autenticación JWT
@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(request: Request, exc: AuthJWTException):
    # 401 para problemas de autenticación (incluye expiración)
    return JSONResponse(
        status_code=exc.status_code if exc.status_code in [401, 422] else 401,
        content={"detail": exc.message}
    )

@app.exception_handler(JWTDecodeError)
def jwtdecode_exception_handler(request: Request, exc: JWTDecodeError):
    # 401 para token expirado o inválido
    return JSONResponse(
        status_code=401,
        content={"detail": exc.message}
    )

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        #"http://localhost:3000",  # Para desarrollo
        #"https://tudominio.com"   # Para producción
        "https://api.aimind.portablelab.work"
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

# Nuevo enrutador para reportes
app.include_router(
    reportes.router, 
    prefix="/api/v1", 
    tags=["Reportes"]
)
