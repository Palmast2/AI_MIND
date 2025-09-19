from transformers import pipeline
from functools import lru_cache

EMOTION_LABELS = {
    "LABEL_0": "enojo",
    "LABEL_1": "asco",
    "LABEL_2": "miedo",
    "LABEL_3": "alegría",
    "LABEL_4": "tristeza",
    "LABEL_5": "sorpresa"
}

BASIC_EMOTIONS = {"enojo", "asco", "miedo", "alegría", "tristeza", "sorpresa"}

ML_LABEL_TRANSLATION = {
    "anger": "enojo",
    "disgust": "asco",
    "fear": "miedo",
    "joy": "alegría",
    "sadness": "tristeza",
    "surprise": "sorpresa",
    "others": "otros"
}

EMOTION_PET_MAP = {
    "enojo": "calma",
    "asco": "calma",
    "miedo": "seguridad",
    "alegría": "alegría",
    "tristeza": "comprensión",
    "sorpresa": "curiosidad"
}

@lru_cache(maxsize=1)  # Cache para cargar el modelo solo una vez
def get_emotion_model():
    return pipeline(
        task="text-classification",
        model="pysentimiento/robertuito-emotion-analysis",
        top_k=None
    )

def predict_emotion(text: str):
    # 1. Obtener el modelo (se carga solo en la primera llamada)
    classifier = get_emotion_model()
    
    # 2. Realizar predicción
    results = classifier(text)
    
    # 3. Procesar resultados
    if not results or not results[0]:
        return None
    
    # 4. Normalizar etiquetas de emociones
    processed_results = []
    for emotion in results[0]:
        label = EMOTION_LABELS.get(emotion['label'], emotion['label'])
        processed_results.append({
            "label": label,
            "score": emotion['score']
        })
    
    # 5. Ordenamos de mayor a menor score
    sorted_results = sorted(processed_results, key=lambda x: x["score"], reverse=True)

    # 6. Emoción dominante    
    dominant_emotion = sorted_results[0]["label"] if sorted_results else "otros"
    dominant_score = sorted_results[0]["score"] if sorted_results else 0.0

    
    return {
        "emotion": dominant_emotion,
        "score": dominant_score,
        "all_emotions": sorted_results
    }

def map_emotion_for_pet(emotion_detected: str) -> str:
    return EMOTION_PET_MAP.get(emotion_detected, "calma")

def get_basic_emotion(emotion_result):
    emotions = emotion_result.get("all_emotions", [])
    emotions = sorted(emotions, key=lambda e: e.get("score", 0), reverse=True)
    for e in emotions:
        label_es = ML_LABEL_TRANSLATION.get(e["label"], e["label"])
        if label_es in BASIC_EMOTIONS:
            return label_es
    return "calma"