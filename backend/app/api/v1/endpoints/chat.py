from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.openai_chat import chat_with_gpt
from app.crud.directrices import obtener_tecnicas, obtener_advertencias
from app.core.ml_models import predict_emotion
from app.core.emotion_map import map_emotion
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.rate_limit import limiter
from app.crud.message import guardar_mensaje, obtener_historial_usuario
from app.core.chat_history import build_prompt
from app.crud.eventos import guardar_evento 

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
    Guarda todo el historial en base de datos y lo reconstruye en cada petición.

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

    # Verifica JWT y obtiene ID del usuario autenticado
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    # 1️⃣ Detectar emoción principal
    user_message = chat_request.user_message
    emotion_result = predict_emotion(user_message)
    emocion_detectada = map_emotion(emotion_result, user_message=user_message)

    # 2️⃣ Consultar técnicas y advertencias en base de datos
    tecnicas_recomendadas = obtener_tecnicas(emocion_detectada, db)
    advertencias = obtener_advertencias(emocion_detectada, db)

    # 3️⃣ Guardar mensaje del usuario en DB
    message_id = guardar_mensaje(
        db=db,
        user_id=user_id,
        role="user",
        contenido=user_message,
        emocion_detectada=emocion_detectada,
        modelo_utilizado="usuario"
    )

    # 🚨 3 Si emoción es crítica -> guardar también en eventos_criticos
    if emocion_detectada in ["autoagresion", "crisis emocional / ideacion suicida"]:
        guardar_evento(
            db=db,
            user_id=user_id,
            message_id=message_id,
            tipo_evento=emocion_detectada,
            descripcion=user_message,
            nivel_alerta="alto",
            atendido=False
        )

    # 4️⃣ Construir prompt con historial y contexto emocional
    prompt = build_prompt(db, user_id, emocion_detectada, tecnicas_recomendadas, advertencias)

    # 5️⃣ Obtener historial completo desde DB para enviar al modelo
    historial = obtener_historial_usuario(db, user_id, limite=3)

    # 6️⃣ Preparar mensajes para el modelo
    messages = [{"role": "system", "content": "Eres un asistente psicológico empático."}]
    for msg in historial:
        messages.append({"role": msg["role"], "content": msg["content"]})
    messages.append({"role": "user", "content": user_message})

    try:
        # 7️⃣ Llamar a GPT
        gpt_response = chat_with_gpt(messages)
        assistant_content = gpt_response["choices"][0]["message"]["content"]

        # 8️⃣ Guardar respuesta de la IA en DB
        guardar_mensaje(
            db=db,
            user_id=user_id,
            role="assistant",
            contenido=assistant_content,
            emocion_detectada=emocion_detectada,
            modelo_utilizado="gpt-4"
        )

        return {
            "prompt": prompt,
            "response": gpt_response
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
