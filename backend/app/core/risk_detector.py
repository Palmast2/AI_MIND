# Detector de mensajes críticos (autoagresión, ideación suicida, crisis emocional)
import difflib

# Lista base de frases y palabras críticas
CRITICAL_PATTERNS = [
    "me quiero morir",
    "me quiero suicidar",
    "me quiero matar",
    "me quiero autodesvivir",
    "me quiero hacer daño",
    "ya no quiero vivir",
    "no vale la pena vivir",
    "quiero acabar con todo",
    "suicidarme",
    "matarme",
    "morirme",
    "quitarme la vida",
    "hacerme daño",
    "autoagresión",
    "no quiero seguir",
    "quiero lastimarme",
    "siento que no hay salida",
    "no puedo más",
    "no quiero estar aquí",
    "quiero terminar con todo",
    "no quiero continuar",
    "quiero hacerme daño físico",
    "no puedo soportarlo más",
    "quiero morir",
    "quiero suicidarme",
]

# 1.0 = exacto, 0.6 = tolerante
SIMILARITY_THRESHOLD = 0.7


def _normalize(text: str) -> str:
    """
    Normaliza el texto para comparar:
    - Minúsculas
    - Sin espacios extra
    """
    return " ".join(text.lower().strip().split())


def detectar_crisis(texto_usuario: str) -> bool:
    """
    Detecta si un mensaje del usuario contiene una posible crisis emocional.
    Retorna True si detecta riesgo, False en caso contrario.
    """
    texto = _normalize(texto_usuario)

    for pattern in CRITICAL_PATTERNS:
        pattern_norm = _normalize(pattern)

        # 1. Coincidencia exacta rápida
        if pattern_norm in texto:
            return True

        # 2. Coincidencia difusa (fuzzy matching)
        similarity = difflib.SequenceMatcher(None, texto, pattern_norm).ratio()
        if similarity >= SIMILARITY_THRESHOLD:
            return True

        # 3. Coincidencia parcial palabra a palabra
        palabras_pattern = pattern_norm.split()
        if all(p in texto for p in palabras_pattern):
            return True

    return False