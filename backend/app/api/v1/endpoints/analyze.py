from fastapi import APIRouter
from app.core.ml_models import predict_emotion
from app.schemas.emotion import EmotionResponse, AnalyzeRequest

router = APIRouter()

@router.post("/analyze", response_model=EmotionResponse)
async def analyze_text(request: AnalyzeRequest):
    """
    Analiza un texto y devuelve la emoción predominante
    
    - **text**: Texto a analizar (mínimo 3 caracteres)
    """
    text = request.text # Accede al texto desde el objeto request
    
    if len(text) < 3:
        return {"error": "El texto es demasiado corto"}
    
    result = predict_emotion(text)
    
    if not result:
        return {"error": "No se pudo analizar el texto"}
    
    return {
        "emotion": result["emotion"],
        "score": result["score"],
        "details": {"all_emotions": result["all_emotions"]}
    }