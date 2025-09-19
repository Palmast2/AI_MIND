from .risk_detector import detectar_crisis

EMOTION_MAP = {
    "anger": "enojo",
    "disgust": "asco",
    "fear": "miedo",
    "joy": "alegria",
    "sadness": "tristeza",
    "surprise": "sorpresa",
}

# Mapeo extendido para emociones de la DB que no están en el modelo
EXTENDED_MAP = {
    "ansiedad": ["miedo"],
    "ira": ["enojo", "asco"],
    "culpa": ["tristeza", "miedo"],
    "soledad": ["tristeza"],
    "frustracion": ["enojo", "tristeza"],
    "confusion": ["miedo", "sorpresa"],
    "agotamiento": ["tristeza", "asco"],
    "desesperanza": ["tristeza", "miedo"],
    "verguenza": ["miedo", "tristeza"],
    "euforia": ["alegria"],
    "apatia": ["tristeza", "asco"],
    "duelo": ["tristeza"],
    "autoagresion": ["tristeza", "enojo"],
    "depresion leve": ["tristeza"],
    "crisis emocional / ideacion suicida": ["tristeza", "miedo"],
    "pensamientos negativos": ["tristeza", "enojo"],
    "tolerancia al distress": ["miedo", "tristeza"],
    "mindfulness": ["alegria", "sorpresa"],  
}

# Palabras clave positivas y negativas
POSITIVE_KEYWORDS = ["bien", "feliz", "genial", "contento", "alegre", "maravilloso"]
NEGATIVE_KEYWORDS = ["mal", "triste", "desesperado", "harto", "deprimido",]

def map_emotion(emotion_result, user_message=None):
    from .emotion_map import EMOTION_MAP, EXTENDED_MAP

    # 0. Detectar crisis primero
    if user_message and detectar_crisis(user_message):
        return "crisis emocional / ideacion suicida"

    all_emotions = emotion_result.get("all_emotions", [])
    # Filtrar 'otros' / 'others'
    filtered = [e for e in all_emotions if e["label"] not in ["otros", "others"]]
    sorted_emotions = sorted(filtered, key=lambda x: x["score"], reverse=True)

    # 1. Detección por palabras clave (sobrescribe modelo)
    if user_message:
        lower_msg = user_message.lower()
        for kw in POSITIVE_KEYWORDS:
            if kw in lower_msg:
                return "alegria"
        for kw in NEGATIVE_KEYWORDS:
            if kw in lower_msg:
                return "tristeza"

    # 2. Score mínimo para la emoción dominante
    if sorted_emotions:
        top_emotion = sorted_emotions[0]
        if top_emotion["score"] >= 0.3:
            return EMOTION_MAP.get(top_emotion["label"], top_emotion["label"])
        else:
            return "tranquilidad"

    # 3. Intentar combinación de top 2 emociones
    if len(sorted_emotions) >= 2:
        key = (sorted_emotions[0]["label"], sorted_emotions[1]["label"])
        for db_emotion, combo in EXTENDED_MAP.items():
            if set(combo) == set(key):
                return db_emotion

    # 4. Fallback final
    return "tranquilidad"