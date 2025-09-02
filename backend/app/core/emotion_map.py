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
    "mindfulness": ["alegria", "sorpresa"],  # mindfulness no es emoción, pero puedes mapearla a emociones positivas
    # ...agrega más si tu DB crece
}

def map_emotion(emotion_result, user_message=None):
    from .emotion_map import EMOTION_MAP, EXTENDED_MAP

    # 0. Si el mensaje contiene indicadores de crisis
    if user_message and detectar_crisis(user_message):
        return "crisis emocional / ideacion suicida"
        
    # 1. Si la emoción principal está en EMOTION_MAP, úsala
    main_emotion = emotion_result.get("emotion")
    if main_emotion in EMOTION_MAP:
        return EMOTION_MAP[main_emotion]

    # 2. Busca las dos emociones con mayor score (excepto "others")
    all_emotions = emotion_result.get("details", {}).get("all_emotions", [])
    filtered = [e for e in all_emotions if e["label"] != "others"]
    sorted_emotions = sorted(filtered, key=lambda x: x["score"], reverse=True)

    if len(sorted_emotions) >= 2:
        key = (sorted_emotions[0]["label"], sorted_emotions[1]["label"])
        # Busca combinación directa en EXTENDED_MAP
        for db_emotion, combo in EXTENDED_MAP.items():
            if set(combo) == set(key):
                return db_emotion

    # 3. Si no hay combinación, usa la emoción con mayor score (excepto "others")
    if sorted_emotions:
        top_emotion = sorted_emotions[0]["label"]
        return EMOTION_MAP.get(top_emotion, "otros")

    # 4. Si nada coincide, usa "otros"
    return "otros"