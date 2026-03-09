from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.frases_seguras import FraseSegura

def obtener_frase_segura(db: Session) -> Optional[str]:
    """Devuelve una frase aleatoria validada para crisis desde BD."""
    frase = (
        db.query(FraseSegura)
        .filter(FraseSegura.activa.is_(True))
        .order_by(func.random())
        .first()
    )
    return frase.frase if frase else None