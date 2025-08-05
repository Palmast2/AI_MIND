from requests import Session
from app.database import get_db
from fastapi import APIRouter, Depends
from fastapi_jwt_auth import AuthJWT
from app.core.openai_chat import chat_with_gpt
from app.crud.directrices import obtener_tecnicas, obtener_advertencias
from app.core.ml_models import predict_emotion
from app.core.emotion_map import map_emotion
from app.schemas.chat import ChatRequest
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter()

@router.post("/chat")
@limiter.limit("100/hour")
async def chat_gpt(
    request: Request,
    chat_request: ChatRequest,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    Authorize.jwt_required()

    # 1. Detectar emoción principal
    user_message = chat_request.user_message
    emotion_result = predict_emotion(user_message)
    emocion_detectada = map_emotion(emotion_result)

    # 2. Consultar técnicas y advertencias en la base de datos
    tecnicas_recomendadas = obtener_tecnicas(emocion_detectada, db)  # Debes implementar esta función
    advertencias = obtener_advertencias(emocion_detectada, db)       # Debes implementar esta función

    # 3. Construir el prompt
    prompt = f"""
Usuario: {user_message}

Contexto emocional detectado:
- Emoción principal: {emocion_detectada}
- Técnicas recomendadas: {tecnicas_recomendadas}
- Advertencias: {advertencias}

Responde como psicólogo profesional, de forma empática y breve, considerando el contexto anterior.
"""

    messages = [
        {"role": "system", "content": "Eres un asistente psicológico empático."},
        {"role": "user", "content": prompt}
    ]

    try:
        gpt_response = chat_with_gpt(messages)
        return {
            "prompt": prompt,           # El prompt enviado a OpenAI
            "response": gpt_response    # La respuesta completa de OpenAI
        }
    except Exception as e:
        return {"error": str(e)}