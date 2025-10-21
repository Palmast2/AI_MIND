from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta
from fastapi_jwt_auth import AuthJWT
from app.database import get_db
import os

# Tomar la llave PGP del .env
PGP_KEY = os.getenv("PGP_KEY")

# Prefijo general para todas las rutas de emociones
router = APIRouter(tags=["Emociones"])

def contar_emociones(db: Session, user_id: str, start_date: datetime):
    """Función auxiliar para contar emociones desde una fecha determinada."""
    stmt = text("""
        SELECT emocion_detectada, COUNT(*) AS total
        FROM mensajes
        WHERE role = 'user' AND user_id = :user_id AND created_at >= :start_date
        GROUP BY emocion_detectada
    """)
    result = db.execute(stmt, {"user_id": user_id, "start_date": start_date}).mappings().all()
    return {row["emocion_detectada"] or "otros": row["total"] for row in result}


@router.get("/semanales")
def emociones_semanales(
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    """
    Obtiene un resumen semanal de emociones detectadas para el usuario autenticado.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Respuesta:**
    ```json
    {
      "user_id": "uuid-del-usuario",
      "weekly_emotions": {
        "alegría": 4,
        "tristeza": 2,
        "tranquilidad": 1
      }
    }
    ```

    **Errores:**
    - 401: Token inválido o expirado.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    today = datetime.now()
    start_of_week = today - timedelta(days=today.weekday())
    start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)

    counts = contar_emociones(db, user_id, start_of_week)
    return {"user_id": user_id, "weekly_emotions": counts}


@router.get("/mensuales")
def emociones_mensuales(
    db: Session = Depends(get_db),
    Authorize: AuthJWT = Depends()
):
    """
    Obtiene un resumen mensual de emociones detectadas para el usuario autenticado.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Respuesta:**
    ```json
    {
      "user_id": "uuid-del-usuario",
      "monthly_emotions": {
        "tranquilidad": 10,
        "enojo": 3,
        "miedo": 2
      }
    }
    ```

    **Errores:**
    - 401: Token inválido o expirado.
    """    
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    today = datetime.now()
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    counts = contar_emociones(db, user_id, start_of_month)
    return {"user_id": user_id, "monthly_emotions": counts}
