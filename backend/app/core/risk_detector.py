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

def evaluar_riesgo(texto_usuario: str, db: Session, emotion_result: dict = None):
    texto = _normalize(texto_usuario)
    
    patrones_db = db.query(PatronRiesgo).all()
    
    patrones_alto = [p.patron for p in patrones_db if p.nivel == 'alto']
    patrones_medio = [p.patron for p in patrones_db if p.nivel == 'medio']
    patrones_bajo = [p.patron for p in patrones_db if p.nivel == 'bajo']

    # 1. Extraer scores de emociones del modelo ML
    score_positivo = 0.0
    score_negativo = 0.0 # Suma de tristeza, miedo y enojo

    if emotion_result and "all_emotions" in emotion_result:
        for em in emotion_result["all_emotions"]:
            label = em["label"].lower()
            if label in ["alegría", "alegria", "joy"]:
                score_positivo += em["score"]
            elif label in ["sorpresa", "surprise"]:
                score_positivo += (em["score"] * 0.5) # La sorpresa mitiga los falsos positivos
            elif label in ["tristeza", "miedo", "enojo", "sadness", "fear", "anger"]:
                score_negativo += em["score"]

    # 2. Función interna para buscar el tipo de coincidencia
    def buscar_patrones(patrones):
        for pattern in patrones:
            norm = _normalize(pattern)
            if norm in texto: 
                return "exacto" 
            if difflib.SequenceMatcher(None, texto, norm).ratio() >= SIMILARITY_THRESHOLD:
                return "difuso"
        return None

    # 3. Evaluar ALTO Riesgo
    match_alto = buscar_patrones(patrones_alto)
    if match_alto:
        if match_alto == "exacto":
            return "alto" # 🚨 Nunca ignoramos un match exacto crítico (ej. "quiero suicidarme")
        else:
            # Si es difuso (ej. "me muero" de risa) pero el score de alegría es alto, lo bajamos a medio por precaución
            if score_positivo > 0.6 and score_negativo < 0.3:
                return "medio" 
            return "alto"

    # 4. Evaluar MEDIO Riesgo
    match_medio = buscar_patrones(patrones_medio)
    if match_medio:
        if score_positivo > 0.6: 
            return None # Cancelamos la alerta por completo
        if score_negativo > 0.8:
            return "alto" # El texto dice medio, pero emocionalmente está MUY mal. Lo subimos a Alto.
        return "medio"

    # 5. Evaluar BAJO Riesgo
    match_bajo = buscar_patrones(patrones_bajo)
    if match_bajo:
        if score_positivo > 0.5:
            return None # Está feliz, cancelamos la alerta por estrés/ansiedad leve
        if score_negativo > 0.98:
            return "medio" # Siente mucha tristeza/miedo, lo subimos a Medio
        return "bajo"

    # 6. Salvavidas oculto: Si no detectó texto peligroso, pero la IA percibe emociones extremas negativas
    if score_negativo >= 0.85 and score_positivo < 0.20:
         return "medio"

    return None