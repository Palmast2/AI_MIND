from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.reporte_service import generar_reporte_pdf, obtener_meses_disponibles
from fastapi import HTTPException
from fastapi_jwt_auth import AuthJWT

router = APIRouter()

@router.get("/pdf/{year}/{month}")
def generar_pdf_por_mes( 
    year: int, 
    month: int, 
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
    ):
    """
    Genera un reporte en PDF del historial de un usuario en un mes específico.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Parámetros de ruta:**
    - year (int): Año del reporte (ej. 2025).
    - month (int): Mes del reporte (1-12).

    **Respuesta:**
    - Archivo PDF con el historial de mensajes, emociones predominantes y posibles riesgos detectados.

    **Errores:**
    - 404: No hay historial de mensajes para el usuario en ese mes.
    """
    # Verifica JWT
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    file_path = generar_reporte_pdf(db, user_id, year=year, month=month)
    if not file_path:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario en ese mes")
    return FileResponse(file_path, media_type="application/pdf", filename=file_path.split("/")[-1])

@router.get("/meses")
def meses_disponibles(
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
    ):
    """
    Obtiene los meses disponibles con historial de un usuario.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Respuesta:**
    ```json
    {
      "user_id": "uuid-del-usuario",
      "meses_disponibles": [
        {"year": 2025, "month": 8},
        {"year": 2025, "month": 9}
      ]
    }
    ```

    **Errores:**
    - 404: No hay historial de mensajes para este usuario.
    """
    # Verifica JWT
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    meses = obtener_meses_disponibles(db, user_id)
    if not meses:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario")
    return {"user_id": user_id, "meses_disponibles": meses}