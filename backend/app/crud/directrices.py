from sqlalchemy.orm import Session
from sqlalchemy import text
import os

PGP_KEY = os.getenv("PGP_KEY")
if not PGP_KEY:
    raise RuntimeError("La variable de entorno PGP_KEY no está definida.")

def obtener_tecnicas(emocion: str, db: Session) -> str:
    stmt = text("""
        SELECT actividades_practicas
        FROM directrices_terapeuticas
        WHERE emocion = :emocion
        LIMIT 1
    """)
    result = db.execute(stmt, {"emocion": emocion}).fetchone()
    return result.actividades_practicas if result and result.actividades_practicas else "No hay técnicas recomendadas."

def obtener_advertencias(emocion: str, db: Session) -> str:
    stmt = text("""
        SELECT pgp_sym_decrypt(advertencias, :key) AS advertencias
        FROM directrices_terapeuticas
        WHERE emocion = :emocion
        LIMIT 1
    """)
    result = db.execute(stmt, {"emocion": emocion, "key": PGP_KEY}).fetchone()
    if result and result.advertencias:
        if isinstance(result.advertencias, bytes):
            return result.advertencias.decode()
        return result.advertencias
    return "No hay advertencias registradas."