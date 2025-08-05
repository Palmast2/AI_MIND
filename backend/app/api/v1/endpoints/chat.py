from requests import Session
from app.database import get_db
from fastapi import APIRouter, Depends
from fastapi_jwt_auth import AuthJWT
from app.core.openai_chat import chat_with_gpt
from app.crud.directrices import obtener_tecnicas, obtener_advertencias
from app.core.ml_models import predict_emotion
from app.core.emotion_map import map_emotion
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
@limiter.limit("100/hour")
async def chat_gpt(
    request: Request,
    chat_request: ChatRequest,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
    Genera una respuesta empática basada en el mensaje del usuario y su emoción detectada.

    **Requiere autenticación por cookies y protección CSRF:**
    - Cookie `access_token_cookie` válida.
    - Cookie `csrf_access_token` válida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Request Body:**
    - user_message (str): Mensaje enviado por el usuario.

    **Respuesta:**
    - prompt (str): Prompt generado para el modelo.
    - response (dict): Respuesta generada por el modelo.
    - error (str, opcional): Mensaje de error si ocurre algún problema.
    """

    Authorize.jwt_required()

    # 1. Detectar emoción principal
    user_message = chat_request.user_message
    emotion_result = predict_emotion(user_message)
    emocion_detectada = map_emotion(emotion_result)

    # 2. Consultar técnicas y advertencias en la base de datos
    tecnicas_recomendadas = obtener_tecnicas(emocion_detectada, db)
    advertencias = obtener_advertencias(emocion_detectada, db)

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
            "prompt": prompt,
            "response": gpt_response
        }
    except Exception as e:
        return {"error": str(e)}