import os
from fastapi import APIRouter, HTTPException, Depends, Response
from datetime import timedelta
from fastapi_jwt_auth import AuthJWT
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from google.auth.exceptions import GoogleAuthError
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.auth import TokenResponse, GoogleTokenRequest
from app.crud.user import get_user_by_email, create_user
from app.core.security import verify_password
from app.database import get_db

router = APIRouter()

# Configuración de la ruta para autenticación con Google
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/auth/google", response_model=TokenResponse)
def auth_google(data: GoogleTokenRequest, Authorize: AuthJWT = Depends()):
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

    **Autenticación por cookies:**
    - Al hacer login exitoso, se setean automáticamente las siguientes cookies:
        - `access_token_cookie`: JWT de acceso (HTTPOnly)
        - `refresh_token_cookie`: JWT de refresh (HTTPOnly)
        - `csrf_access_token`: Token CSRF para access (NO HTTPOnly)
        - `csrf_refresh_token`: Token CSRF para refresh (NO HTTPOnly)

    **Uso posterior:**
    - Para endpoints protegidos POST/PUT/DELETE, debes enviar el header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.
    - Para endpoints protegidos GET, solo necesitas las cookies de acceso.
    """
    db_user = get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    access_token = Authorize.create_access_token(subject=str(db_user.user_id), expires_time=900)  # 15 minutos
    refresh_token = Authorize.create_refresh_token(subject=str(db_user.user_id), expires_time=86400)  # 1 día
    response = JSONResponse(content={"access_token": access_token}) #Reemplazar el token con un mensaje en produccion
    response.set_cookie(
        key="access_token_cookie",
        value=access_token,
        httponly=True,
        secure=False,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="refresh_token_cookie",
        value=refresh_token,
        httponly=True,  # Cambia a True en producción
        secure=False,
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_access_token",
        value=Authorize._get_csrf_token(access_token),
        httponly=False,
        secure=False,
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_refresh_token",
        value=Authorize._get_csrf_token(refresh_token),
        httponly=False,
        secure=False,
        samesite="strict"
    )
    return response

@router.post("/refresh", response_model=TokenResponse)
def refresh(Authorize: AuthJWT = Depends()):
    """
    Renueva el access token usando el refresh token (en cookie).

    **Requiere:**
    - Cookie `refresh_token_cookie` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_refresh_token`.

    **Respuesta:**
    - Setea nuevas cookies:
        - `access_token_cookie`
        - `csrf_access_token`
        - `csrf_refresh_token`
    - El body contiene el nuevo access token, esto se quitara para produccion.

    **Nota:** No debes enviar el JWT en el header Authorization.
    """
    Authorize.jwt_refresh_token_required()
    current_user = Authorize.get_jwt_subject()
    new_access_token = Authorize.create_access_token(subject=current_user, expires_time=900)
    response = JSONResponse(content={"access_token": new_access_token}) #Reemplazar el token con un mensaje en produccion
    response.set_cookie(
        key="access_token_cookie",
        value=new_access_token,
        httponly=True,
        secure=False,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_access_token",
        value=Authorize._get_csrf_token(new_access_token),
        httponly=False,
        secure=False,
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_refresh_token",
        value=Authorize._get_csrf_token(Authorize._token_from_cookies("refresh")),
        httponly=False,
        secure=False,
        samesite="strict"
    )
    return response

@router.post("/logout")
def logout(response: Response):
    """
    Cierra la sesión del usuario.

    - Elimina las cookies de autenticación (`access_token_cookie`, `refresh_token_cookie`).
    - El usuario debe volver a autenticarse para acceder a endpoints protegidos.
    """
    response.delete_cookie("access_token_cookie")
    response.delete_cookie("refresh_token_cookie")
    response.delete_cookie("csrf_access_token")
    response.delete_cookie("csrf_refresh_token")
    return {"msg": "Sesión cerrada"}

@router.get("/protected") # Endpoint protegido para verificar el acceso con JWT se borrara en produccion
def protected(Authorize: AuthJWT = Depends()):
    """
    Endpoint protegido de prueba.

    **Requiere:**
    - Cookie `access_token_cookie` válida.

    **No requiere header CSRF.**
    """
    Authorize.jwt_required()
    return {"msg": "¡Acceso permitido con cookie JWT!"}