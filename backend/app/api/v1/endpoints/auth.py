import os
from fastapi import APIRouter, HTTPException, Depends, Response
from datetime import timedelta
from fastapi_jwt_auth import AuthJWT
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
from fastapi import Request
from google.auth.exceptions import GoogleAuthError
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.schemas.auth import AccessResponse, GoogleTokenRequest
from app.crud.user import get_user_by_email, create_user
from app.core.security import verify_password
from app.database import get_db
from slowapi.util import get_remote_address
from app.core.rate_limit import limiter

router = APIRouter()

# Configuración de la ruta para autenticación con Google
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

@router.post("/auth/google", response_model=AccessResponse)
@limiter.limit("5/minute", key_func=get_remote_address)
def auth_google(data: GoogleTokenRequest, request: Request, Authorize: AuthJWT = Depends()):
    """
    Autenticación de usuario mediante Google OAuth2.

    **Rate limiting:** 5 solicitudes por minuto por IP.

    **Request Body:**
    - token (str): Token de Google obtenido tras el login en el frontend.

    **Respuesta:**
    - msg (str): Mensaje de éxito.
    - Setea cookies: `access_token_cookie`, `refresh_token_cookie`, `csrf_access_token`, `csrf_refresh_token`.

    **Notas:**
    - No requiere autenticación previa.
    - Si el token de Google es inválido, devuelve 401.
    - Para endpoints protegidos POST/PUT/DELETE, debes enviar el header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.
    - Para endpoints protegidos GET, solo necesitas las cookies de acceso.
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

    access_token = Authorize.create_access_token(subject=user_email, expires_time=900)
    refresh_token = Authorize.create_refresh_token(subject=user_email, expires_time=86400)
    response = JSONResponse(content={"msg": "Login con Google exitoso"})
    response.set_cookie(
        key="access_token_cookie",
        value=access_token,
        httponly=True,
        secure=True, # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="refresh_token_cookie",
        value=refresh_token,
        httponly=True,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_access_token",
        value=Authorize._get_csrf_token(access_token),
        httponly=False,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_refresh_token",
        value=Authorize._get_csrf_token(refresh_token),
        httponly=False,
        secure=True, # Cambia a True en producción
        samesite="strict"
    )
    return response

@router.post("/register", response_model=AccessResponse)
@limiter.limit("3/minute", key_func=get_remote_address)
def register(user: UserCreate, request: Request, Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    """
    Registro de usuario con email y contraseña.

    **Request Body:**
    - email (str): Correo electrónico del usuario.
    - password (str): Contraseña del usuario.

    **Respuesta:**
    - Datos del usuario registrado.
    - Setea cookies: `access_token_cookie`, `refresh_token_cookie`, `csrf_access_token`, `csrf_refresh_token`.

    **Errores:**
    - 400: El usuario ya existe.
    """
    db_user = get_user_by_email(db, user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="El usuario ya existe")
    new_user = create_user(db, user)

    # Generar tokens y setear cookies igual que en login
    access_token = Authorize.create_access_token(subject=str(new_user.user_id), expires_time=900)
    refresh_token = Authorize.create_refresh_token(subject=str(new_user.user_id), expires_time=86400)
    response = JSONResponse(content={"msg": "Registro exitoso"})
    response.set_cookie(
        key="access_token_cookie",
        value=access_token,
        httponly=True,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="refresh_token_cookie",
        value=refresh_token,
        httponly=True,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_access_token",
        value=Authorize._get_csrf_token(access_token),
        httponly=False,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_refresh_token",
        value=Authorize._get_csrf_token(refresh_token),
        httponly=False,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    return response

@router.post("/login", response_model=AccessResponse)
@limiter.limit("5/minute", key_func=get_remote_address)
def login(
    user: UserLogin,
    request: Request,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
    ):
    """
    Login de usuario con email y contraseña.

    **Request Body:**
    - email (str): Correo electrónico del usuario.
    - password (str): Contraseña del usuario.

    **Respuesta:**
    - msg (str): Mensaje de éxito.
    - Setea cookies: `access_token_cookie`, `refresh_token_cookie`, `csrf_access_token`, `csrf_refresh_token`.

    **Errores:**
    - 401: Credenciales inválidas.

    **Notas:**
    - Para endpoints protegidos POST/PUT/DELETE, debes enviar el header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.
    - Para endpoints protegidos GET, solo necesitas las cookies de acceso.
    """

    db_user = get_user_by_email(db, user.email)
    if not db_user or not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    access_token = Authorize.create_access_token(subject=str(db_user.user_id), expires_time=900)  # 15 minutos
    refresh_token = Authorize.create_refresh_token(subject=str(db_user.user_id), expires_time=86400)  # 1 día
    response = JSONResponse(content={"msg": "Login exitoso"})
    response.set_cookie(
        key="access_token_cookie",
        value=access_token,
        httponly=True,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="refresh_token_cookie",
        value=refresh_token,
        httponly=True,  # Cambia a True en producción
        secure=True,
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_access_token",
        value=Authorize._get_csrf_token(access_token),
        httponly=False,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_refresh_token",
        value=Authorize._get_csrf_token(refresh_token),
        httponly=False,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    return response

@router.post("/refresh", response_model=AccessResponse)
@limiter.limit("10/hour")
def refresh(request: Request, Authorize: AuthJWT = Depends()):
    """
    Renueva el access token usando el refresh token (en cookie).

    **Requiere:**
    - Cookie `refresh_token_cookie` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_refresh_token`.

    **Rate limiting:** 10 solicitudes por hora por usuario.

    **Respuesta:**
    - msg (str): Mensaje de éxito.
    - Setea nuevas cookies: `access_token_cookie`, `csrf_access_token`.

    **Errores:**
    - 401: Token inválido o expirado.

    **Notas:**
    - No debes enviar el JWT en el header Authorization.
    """

    Authorize.jwt_refresh_token_required()
    current_user = Authorize.get_jwt_subject()
    new_access_token = Authorize.create_access_token(subject=current_user, expires_time=900)
    response = JSONResponse(content={"msg": "Token renovado"})
    response.set_cookie(
        key="access_token_cookie",
        value=new_access_token,
        httponly=True,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    response.set_cookie(
        key="csrf_access_token",
        value=Authorize._get_csrf_token(new_access_token),
        httponly=False,
        secure=True,  # Cambia a True en producción
        samesite="strict"
    )
    return response

@router.post("/logout")
@limiter.limit("10/hour")
def logout(request: Request, response: Response):
    """
    Cierra la sesión del usuario.

    **Requiere:**
    - Cookies de autenticación válidas.

    **Respuesta:**
    - msg (str): Mensaje de éxito.

    **Notas:**
    - Elimina las cookies de autenticación (`access_token_cookie`, `refresh_token_cookie`, `csrf_access_token`, `csrf_refresh_token`).
    - El usuario debe volver a autenticarse para acceder a endpoints protegidos.
    """

    response.delete_cookie("access_token_cookie")
    response.delete_cookie("refresh_token_cookie")
    response.delete_cookie("csrf_access_token")
    response.delete_cookie("csrf_refresh_token")
    return {"msg": "Sesión cerrada"}
