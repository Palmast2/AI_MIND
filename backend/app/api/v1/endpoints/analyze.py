from fastapi import APIRouter, Depends
from fastapi_jwt_auth import AuthJWT
from app.core.ml_models import predict_emotion
from app.schemas.emotion import EmotionResponse, AnalyzeRequest
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter()

@router.post("/analyze", response_model=EmotionResponse)
@limiter.limit("100/hour")
async def analyze_text(
    request: Request,
    request_analyze: AnalyzeRequest,
    Authorize: AuthJWT = Depends()
):
    """
    Analiza un texto y devuelve la emoción predominante.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Request Body:**
    - text (str): Texto a analizar (mínimo 3 caracteres).

    **Respuesta:**
    - emotion (str): Emoción detectada.
    - score (float): Puntaje de confianza.
    - details (dict): Detalles de todas las emociones detectadas.
    - error (str, opcional): Mensaje de error si ocurre algún problema.
    """
    # Requiere JWT
    Authorize.jwt_required()
    
    text = request_analyze.text
    
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