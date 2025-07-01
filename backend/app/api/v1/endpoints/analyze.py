from fastapi import APIRouter, Depends
from fastapi_jwt_auth import AuthJWT
from app.core.ml_models import predict_emotion
from app.schemas.emotion import EmotionResponse, AnalyzeRequest

router = APIRouter()

@router.post("/analyze", response_model=EmotionResponse)
async def analyze_text(
    request: AnalyzeRequest,
    Authorize: AuthJWT = Depends()
):
    """
    Analiza un texto y devuelve la emoción predominante.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    - **text**: Texto a analizar (mínimo 3 caracteres)
    - **returns**: La emoción detectada, el score y detalles de todas las emociones.
    """
    # Requiere JWT
    Authorize.jwt_required()
    
    text = request.text
    
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