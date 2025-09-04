from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.reporte_service import generar_reporte_pdf, obtener_meses_disponibles
from fastapi import HTTPException

router = APIRouter()

@router.get("/pdf/{user_id}/{year}/{month}")
def generar_pdf_por_mes(user_id: str, year: int, month: int, db: Session = Depends(get_db)):
    """
    Genera un reporte en PDF del historial de un usuario en un mes específico.

    **Parámetros de ruta:**
    - user_id (str): Identificador único del usuario.
    - year (int): Año del reporte (ej. 2025).
    - month (int): Mes del reporte (1-12).

    **Respuesta:**
    - Archivo PDF con el historial de mensajes, emociones predominantes y posibles riesgos detectados.

    **Errores:**
    - 404: No hay historial de mensajes para el usuario en ese mes.
    """
    file_path = generar_reporte_pdf(db, user_id, year=year, month=month)
    if not file_path:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario en ese mes")
    return FileResponse(file_path, media_type="application/pdf", filename=file_path.split("/")[-1])

@router.get("/meses/{user_id}")
def meses_disponibles(user_id: str, db: Session = Depends(get_db)):
    """
    Obtiene los meses disponibles con historial de un usuario.

    **Parámetros de ruta:**
    - user_id (str): Identificador único del usuario.

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
    meses = obtener_meses_disponibles(db, user_id)
    if not meses:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario")
    return {"user_id": user_id, "meses_disponibles": meses}