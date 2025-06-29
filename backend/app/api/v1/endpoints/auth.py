import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests
from google.auth.exceptions import GoogleAuthError
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.user import UserOut
from app.crud.user import get_user_by_email, create_user
from app.core.security import verify_password
from app.database import get_db

router = APIRouter()

# Configuración de la ruta para autenticación con Google
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

class GoogleTokenRequest(BaseModel):
    token: str

class TokenResponse(BaseModel):
    access_token: str

@router.post("/auth/google", response_model=TokenResponse)
def auth_google(data: GoogleTokenRequest, Authorize: AuthJWT = None):
    """
    Autenticación con Google OAuth2.

    Este endpoint recibe un token de Google enviado por el frontend, valida su autenticidad y,
    si es válido, genera un JWT propio para la API. El JWT devuelto debe ser usado en los endpoints protegidos.

    - **token**: Token de Google obtenido tras el login en el frontend.
    - **returns**: access_token (JWT propio de la API)
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            data.token,
            requests.Request(),
            audience=GOOGLE_CLIENT_ID
        )
        user_email = idinfo["email"]
    except ValueError:
        raise HTTPException(status_code=401, detail="Token de Google inválido o expirado")
    except GoogleAuthError:
        raise HTTPException(status_code=401, detail="Error de autenticación con Google")
    except Exception:
        raise HTTPException(status_code=500, detail="Error interno al verificar el token de Google")

    access_token = Authorize.create_access_token(subject=user_email)
    return {"access_token": access_token}

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Registro de usuario con email y contraseña.

    - **email**: Correo electrónico del usuario.
    - **password**: Contraseña del usuario.
    - **returns**: Datos del usuario registrado.
    """
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    return create_user(db, user)

@router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    """
    Login de usuario con email y contraseña.

    - **email**: Correo electrónico del usuario.
    - **password**: Contraseña del usuario.
    - **returns**: access_token (JWT propio de la API)
    """
    db_user = get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    access_token = Authorize.create_access_token(subject=user.email)
    return {"access_token": access_token}