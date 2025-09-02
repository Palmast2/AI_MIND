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

@lru_cache(maxsize=1)  # Cache para cargar el modelo solo una vez
def get_emotion_model():
    return pipeline(
        task="text-classification",
        model="pysentimiento/robertuito-emotion-analysis",
        return_all_scores=True
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
    
    # Encontrar la emoción con mayor puntuación
    dominant_emotion = max(processed_results, key=lambda x: x['score'])
    
    return {
        "emotion": dominant_emotion['label'],
        "score": dominant_emotion['score'],
        "all_emotions": processed_results
    }