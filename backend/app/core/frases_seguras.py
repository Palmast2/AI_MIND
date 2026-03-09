from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.frases_seguras import FraseSegura

def obtener_frase_segura(db: Session, nivel_riesgo: str) -> Optional[str]:
    """Devuelve una frase aleatoria para el nivel de riesgo indicado."""
    if not nivel_riesgo:
        return None

    frase = (
        db.query(FraseSegura)
        .filter(FraseSegura.nivel_riesgo == nivel_riesgo)
        .order_by(func.random())
        .first()
    )
    return frase.frase if frase else None