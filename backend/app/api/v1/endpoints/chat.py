import logging, json
from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.openai_chat import get_chat_response
from app.crud.directrices import obtener_tecnicas, obtener_advertencias
from app.core.ml_models import predict_emotion, map_emotion_for_pet, get_basic_emotion
from app.core.emotion_map import map_emotion
from app.schemas.chat import ChatRequest, ChatResponse
from app.core.rate_limit import limiter
#from app.crud.message import obtener_historial_usuario
from app.core.chat_history import build_prompt, guardar_mensaje_historial, obtener_historial_usuario
from app.crud.eventos import guardar_evento 

router = APIRouter()
logger = logging.getLogger("chat_endpoint")

def formatear_lista_a_texto(data, default="Ninguna"):
    """
    Convierte listas, objetos, bytes o memoryviews a un string limpio.
    Soluciona el error '<memory at 0x...>' decodificando los bytes.
    """
    if not data:
        return default

    def limpiar_item(item):
        # 1. Si es memoryview, lo pasamos a bytes y luego a texto
        if isinstance(item, memoryview):
            return item.tobytes().decode('utf-8', errors='ignore')
        
        # 2. Si son bytes directos, decodificamos
        if isinstance(item, bytes):
            return item.decode('utf-8', errors='ignore')
        
        # 3. Si es un objeto SQLAlchemy (Row), intentamos sacar el primer valor
        if hasattr(item, '_mapping'): # Detecta filas de SQLAlchemy
             # A veces viene como tupla (valor, )
            val = list(item._mapping.values())[0]
            if isinstance(val, (bytes, memoryview)):
                return limpiar_item(val) # Recursividad por si acaso
            return str(val)

        # 4. Si ya es texto o número
        return str(item)
    
    # Si es una lista, procesamos cada elemento
    if isinstance(data, list):
        items = [limpiar_item(item) for item in data if item]
        return ", ".join(items) if items else default
    
    # Si es un solo elemento
    return limpiar_item(data)

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
    Devuelve la emoción que debe mostrar la mascota virtual.
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
    - emocion_pet (str): Emoción básica mapeada para la mascota virtual.
    - error (str, opcional): Mensaje de error si ocurre algún problema.
    
    """

    # Verifica JWT y obtiene ID del usuario autenticado
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    # 1️⃣ Detectar emoción principal
    user_message = chat_request.user_message
    emotion_result = predict_emotion(user_message)

    emocion_detectada = map_emotion(emotion_result, user_message=user_message)

    emocion_detectada_pet = get_basic_emotion(emotion_result)

    emocion_pet = map_emotion_for_pet(emocion_detectada_pet)

    # 2️⃣ Consultar técnicas y advertencias en base de datos
    raw_tecnicas = obtener_tecnicas(emocion_detectada, db)
    raw_advertencias = obtener_advertencias(emocion_detectada, db)
# --- 🛠️ FIX DE MEMORIA: Convertimos a texto limpio ---
    tecnicas_str = formatear_lista_a_texto(raw_tecnicas, default="No hay técnicas recomendadas.")
    advertencias_str = formatear_lista_a_texto(raw_advertencias, default="No hay advertencias registradas.")
    # -----------------------------------------------------
    # 3️⃣ Guardar mensaje del usuario en DB
    message_id = guardar_mensaje_historial(
        db=db,
        user_id=user_id,
        role="user",
        content=user_message,
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
    prompt = build_prompt(db, user_id, emocion_detectada, tecnicas_str, advertencias_str)
    # 5️⃣ Obtener historial completo desde DB para enviar al modelo
    historial = obtener_historial_usuario(db, user_id, limite=3)

    # 6️⃣ Preparar mensajes para el modelo
    # Creamos un contexto rico para que la IA sepa qué hacer
    contexto_sistema = f"""
    Eres IA-MIND, un asistente psicológico profesional y empático.
    
    CONTEXTO DEL USUARIO ACTUAL:
    - Emoción detectada: {emocion_detectada}
    - Advertencias clínicas: {advertencias_str}
    - Técnicas recomendadas: {tecnicas_str}

    INSTRUCCIONES:
    1. Usa las técnicas recomendadas si aplica.
    2. Ten MUCHO cuidado con las advertencias.
    3. Responde de forma breve y cálida.
    """

    # el primer mensaje lleva toda la inteligencia
    messages = [{"role": "system", "content": contexto_sistema}]
    
    # Agregamos el historial (que ya trae el mensaje del usuario al final)
    for msg in historial:
        messages.append({"role": msg["role"], "content": msg["content"]})

    try:
        # 7️⃣ Llamar a GPT
        gpt_response = await get_chat_response(messages)
        assistant_content = gpt_response.choices[0].message.content

        # 8️⃣ Guardar respuesta de la IA en DB
        guardar_mensaje_historial(
            db=db,
            user_id=user_id,
            role="assistant",
            content=assistant_content,
            emocion_detectada=emocion_detectada,
            modelo_utilizado="gpt-4"
        )

        return {
            "prompt": prompt,
            "response": gpt_response.model_dump(),
            "emocion_pet": emocion_pet,
        }

    except Exception as e:
        logger.error(f"Error en /chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
