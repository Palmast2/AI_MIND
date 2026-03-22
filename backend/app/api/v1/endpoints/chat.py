import logging, json
from fastapi import APIRouter, Depends, Request, HTTPException, BackgroundTasks
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session
from fastapi.concurrency import run_in_threadpool

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
from app.core.email import enviar_alerta_crisis
from app.models.contactos import ContactoEmergencia 
from app.core.frases_seguras import obtener_frase_segura 
from app.models.configuracion import ConfiguracionSistema 
import random
from app.models.user import User 
from app.core.risk_detector import evaluar_riesgo

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
    background_tasks: BackgroundTasks,
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
    - is_crisis (bool): Indica si se detectó una crisis de riesgo alto.
    - recursos_apoyo (list): Lista de contactos de apoyo si se detecta crisis.
    - frase_validada (str): Frase de contención validada para crisis.
    - error (str, opcional): Mensaje de error si ocurre algún problema.
    
    ---
    🧠 **SISTEMA MULTINIVEL (Nuevo):**
    El sistema evalúa automáticamente el mensaje en 3 niveles de riesgo (Bajo, Medio, Alto).
    Si se detecta **cualquier** nivel de riesgo, se enviará un correo de alerta en segundo plano al psicólogo asignado al paciente (o al global), sin interrumpir la experiencia del usuario.

    🚨 **COMPORTAMIENTO DE CRISIS EXTREMA (Guía para el Frontend):** 🚨
    **SOLO** si el nivel de riesgo es **ALTO**, la respuesta devolverá `"is_crisis": true`.
    En ese caso, el Frontend DEBE:
    1. **Bloquear el input:** Deshabilitar la caja de texto para evitar que el usuario siga escribiendo.
    2. **Mostrar Modal/Alerta:** Desplegar inmediatamente una ventana emergente o sección destacada (preferiblemente roja/naranja).
    3. **Renderizar Contactos:** Iterar sobre el array `recursos_apoyo` y mostrar los nombres y teléfonos para que el usuario pueda llamar con un clic.
    4. **Mostrar el mensaje de seguridad:** Mostrar el texto que viene en `frase_validada`.
    ---
    """

    # Verifica JWT y obtiene ID del usuario autenticado
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    # 1️⃣ Detectar emoción principal
    user_message = chat_request.user_message
    emotion_result = await run_in_threadpool(predict_emotion, user_message)

    emocion_detectada = map_emotion(emotion_result, user_message=user_message, db=db)

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

    # --- 🚨 LÓGICA DE CRISIS ---
    is_crisis = False
    frase_psicologo = None
    recursos_apoyo = []
    
    # Recuperar Contactos de Emergencia (Lógica Híbrida)
    # Buscamos en la BD los contactos de ESTE usuario
    contactos_db = db.query(ContactoEmergencia).filter(ContactoEmergencia.user_id == user_id).all()
    
    if contactos_db:
        # Si tiene contactos personalizados, los usamos
        for contacto in contactos_db:
            recursos_apoyo.append({
                "nombre": f"{contacto.nombre} ({contacto.relacion or 'Contacto'})",
                "telefono": contacto.telefono
            })
    else:
        # Si NO tiene (o la lista está vacía), ponemos los default
        recursos_apoyo = [
            {"nombre": "Línea de la Vida", "telefono": "800-911-2000"},
            {"nombre": "Emergencias", "telefono": "911"}
        ]
    
    instruccion_crisis = "" # Por defecto vacía
    nivel_riesgo = evaluar_riesgo(user_message, db=db, emotion_result=emotion_result)

    if nivel_riesgo: 
        guardar_evento(
            db=db, user_id=user_id, message_id=message_id, tipo_evento=emocion_detectada,
            descripcion=user_message, nivel_alerta=nivel_riesgo, atendido=False
        )

        usuario_actual = db.query(User).filter(User.user_id == user_id).first()
        config_email = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == "EMAIL_ALERTA_CRISIS").first()
        
        email_paciente = usuario_actual.email_psicologo_asignado if usuario_actual else None
        if email_paciente and email_paciente.strip().lower() in ["null", "none", ""]: 
            email_paciente = None
            
        email_global = config_email.valor if config_email else None
        if email_global and email_global.strip().lower() in ["null", "none", ""]: 
            email_global = "iamind.app@gmail.com"
            
        email_destino = email_paciente if email_paciente else (email_global or "iamind.app@gmail.com")

        background_tasks.add_task(enviar_alerta_crisis, user_id, user_message, emocion_detectada, email_destino, nivel_riesgo)
        
        if nivel_riesgo == "alto":
            is_crisis = True
            frase_psicologo = obtener_frase_segura(db, nivel_riesgo)
            

    try:
        # 4️⃣ Construir prompt y mensajes solo si NO es crisis alta
        if is_crisis:
            prompt = None
            gpt_response = None
            assistant_content = frase_psicologo or ""
        else:
            prompt = build_prompt(db, user_id, emocion_detectada, tecnicas_str, advertencias_str)
            historial = obtener_historial_usuario(db, user_id, limite=3)

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
            messages = [{"role": "system", "content": contexto_sistema}]

            for msg in historial:
                messages.append({"role": msg["role"], "content": msg["content"]})

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
            "response": gpt_response.model_dump() if gpt_response else None,
            "emocion_pet": emocion_pet,
            "is_crisis": is_crisis,
            "recursos_apoyo": recursos_apoyo,
            "frase_validada": frase_psicologo if is_crisis else None
        }

    except Exception as e:
        logger.error(f"Error en /chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")
