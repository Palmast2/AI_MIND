# Detector de mensajes 
import difflib
from sqlalchemy.orm import Session
from app.models.riesgo import PatronRiesgo

# 1.0 = exacto, 0.6 = tolerante
SIMILARITY_THRESHOLD = 0.7


def _normalize(text: str) -> str:
    """
    Normaliza el texto para comparar:
    - Minúsculas
    - Sin espacios extra
    """
    return " ".join(text.lower().strip().split())

def evaluar_riesgo(texto_usuario: str, db: Session):
    texto = _normalize(texto_usuario)
    
    patrones_db = db.query(PatronRiesgo).all()
    
    patrones_alto = [p.patron for p in patrones_db if p.nivel == 'alto']
    patrones_medio = [p.patron for p in patrones_db if p.nivel == 'medio']
    patrones_bajo = [p.patron for p in patrones_db if p.nivel == 'bajo']

    for pattern in patrones_alto:
        norm = _normalize(pattern)
        if norm in texto or difflib.SequenceMatcher(None, texto, norm).ratio() >= SIMILARITY_THRESHOLD or all(p in texto for p in norm.split()):
            return "alto"

    for pattern in patrones_medio:
        norm = _normalize(pattern)
        if norm in texto or difflib.SequenceMatcher(None, texto, norm).ratio() >= SIMILARITY_THRESHOLD or all(p in texto for p in norm.split()):
            return "medio"

    for pattern in patrones_bajo:
        norm = _normalize(pattern)
        if norm in texto or difflib.SequenceMatcher(None, texto, norm).ratio() >= SIMILARITY_THRESHOLD or all(p in texto for p in norm.split()):
            return "bajo"

    return None