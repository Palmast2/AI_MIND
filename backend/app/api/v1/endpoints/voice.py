import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session

# --- Importaciones de Base de Datos y Lógica ---
# memoria a voz
from app.database import get_db
from app.core.openai_chat import get_chat_response
from app.core.chat_history import guardar_mensaje_historial, obtener_historial_usuario
from app.core.ml_models import predict_emotion
from app.core.emotion_map import map_emotion
from app.crud.eventos import guardar_evento # Para registrar crisis si se detectan por voz

# --- Importaciones de Audio y email---
from app.core.openai_audio import transcribir_con_whisper, generar_voz_tts
from fastapi import BackgroundTasks 
from app.core.email import enviar_alerta_crisis 
from app.models.configuracion import ConfiguracionSistema
from app.core.frases_seguras import obtener_frase_segura
from app.models.user import User
from app.core.risk_detector import evaluar_riesgo 

router = APIRouter()
logger = logging.getLogger("voice_endpoint")

@router.post("/chat/voz")
async def chat_voice(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    Authorize: AuthJWT = Depends(), # <-- Agregado: Para saber QUIÉN habla
    db: Session = Depends(get_db)   # <-- Agregado: Para GUARDAR en BD
):
    """
    Endpoint de Interacción por Voz (Streaming):
    
    Recibe un archivo de audio del usuario, lo procesa y devuelve directamente
    el audio de respuesta de la IA como un flujo binario (Stream).
    
    **Flujo de Proceso:**
    1. **Escuchar:** Transcribe el audio recibido usando Whisper (Soporta .ogg, .m4a, .mp3, etc.).
    2. **Pensar:** Envía la transcripción a GPT-4o-mini para obtener una respuesta terapéutica/empática.
    3. **Hablar:** Convierte la respuesta de texto a audio (TTS - Shimmer).
    4. **Responder:** Devuelve el archivo MP3 en tiempo real.

    **Request (Input):**
    - **Content-Type:** `multipart/form-data`
    - **Body:** `file`: Archivo de audio binario.

    **Respuesta Exitosa (Output):**
    - **Content-Type:** `audio/mpeg`
    - **Body:** Flujo de bytes del archivo MP3 (Binary Stream).
    - **Headers:** Contiene el header personalizado `X-Crisis-Mode` ("true" o "false").

    ---
    **SISTEMA MULTINIVEL:**
    El sistema evalúa el riesgo del audio transcrito (Bajo, Medio, Alto) y notifica al psicólogo correspondiente por correo en segundo plano.

    🚨 **COMPORTAMIENTO DE CRISIS EXTREMA (Guía para el Frontend):** 🚨
    A diferencia del chat de texto, este endpoint NO devuelve un JSON. 
    El Frontend DEBE inspeccionar las cabeceras (Headers) de la respuesta HTTP:

    1. Leer el header `X-Crisis-Mode`.
    2. **SOLO** si `X-Crisis-Mode` === "true" (Riesgo Alto), el Frontend DEBE:
       - **Reproducir el audio:** El stream recibido YA CONTIENE a la IA dictando la frase de contención clínica segura.
       - **Bloquear el micrófono:** Deshabilitar el botón de grabar para que el usuario no envíe más audios.
       - **Mostrar Alerta Visual:** Desplegar un modal de emergencia en la pantalla.
       - **Mostrar Contactos:** Consultar la lista de números del usuario (desde el endpoint de contactos) o mostrar números por defecto (911).
    ---
    """
    try:
        # 0. Autenticación (Necesaria para guardar en el historial del usuario correcto)
        Authorize.jwt_required()
        user_id = Authorize.get_jwt_subject()

        # 1. Leer el archivo de audio recibido
        contenido = await file.read()
        
        # 2. ESCUCHAR (Whisper)
        # Pasamos el nombre del archivo para que Whisper detecte el formato (.ogg, .m4a, etc.)
        texto_usuario = await transcribir_con_whisper(contenido, file.filename)
        
        if not texto_usuario:
             raise HTTPException(status_code=400, detail="No se pudo entender el audio.")

        # --- AQUI INICIA LA MEMORIA ---

        # 3. Detectar Emoción (Para mantener coherencia con la BD y registrar eventos)
        emotion_result = predict_emotion(texto_usuario)
        emocion_detectada = map_emotion(emotion_result, user_message=texto_usuario, db=db)

        # 4. GUARDAR mensaje del usuario en BD
        # Esto permite que si luego vas al chat de texto, veas lo que dijiste por voz.
        message_id = guardar_mensaje_historial(
            db=db, 
            user_id=user_id, 
            role="user", 
            content=texto_usuario,
            emocion_detectada=emocion_detectada, 
            modelo_utilizado="whisper-1"
        )

        # --- 🚨 LÓGICA DE CRISIS PARA VOZ (HEADERS + EMAIL) ---
        es_crisis_header = "false" # Valor por defecto (String para el Header HTTP)
        frase_psicologo = None

        # Evaluar en qué nivel de riesgo estamos
        nivel_riesgo = evaluar_riesgo(texto_usuario, db=db)
        
        if nivel_riesgo:
             # 1. Guardar evento crítico en BD (con su respectivo nivel)
             guardar_evento(
                db=db, 
                user_id=user_id, 
                message_id=message_id, 
                tipo_evento=emocion_detectada, 
                descripcion=texto_usuario, 
                nivel_alerta=nivel_riesgo, 
                atendido=False
             )
        
             # 2. Lógica de Jerarquía de Correos (A prueba de errores "null")
             usuario_actual = db.query(User).filter(User.user_id == user_id).first()
             config_email = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == "EMAIL_ALERTA_CRISIS").first()
             
             email_paciente = usuario_actual.email_psicologo_asignado if usuario_actual else None
             if email_paciente and email_paciente.strip().lower() in ["null", "none", ""]:
                 email_paciente = None
                 
             email_global = config_email.valor if config_email else None
             if email_global and email_global.strip().lower() in ["null", "none", ""]:
                 email_global = "iamind.app@gmail.com"
                 
             email_destino = email_paciente if email_paciente else (email_global or "iamind.app@gmail.com")

             # 3. Mandar correo al psicólogo (Para los 3 niveles)
             background_tasks.add_task(enviar_alerta_crisis, user_id, texto_usuario, emocion_detectada, email_destino, nivel_riesgo)

             # 4. Acciones exclusivas si el riesgo es ALTO
             if nivel_riesgo == "alto":
                 es_crisis_header = "true" # Indicamos al Frontend que bloquee
                 frase_psicologo = obtener_frase_segura(db, nivel_riesgo)

        # Si es crisis alta, evitamos la llamada a GPT y usamos la frase validada
        if es_crisis_header == "true":
            texto_ia = frase_psicologo or "Para asegurar tu bienestar y que recibas una atención más especializada…"
        else:
            # 5. RECUPERAR Historial (Para que la IA recuerde de qué estaban hablando antes)
            historial = obtener_historial_usuario(db, user_id, limite=3)
            
            # Contexto simplificado para voz (Instrucción de brevedad para el TTS)
            contexto_sistema = f"""
            Eres IA-MIND. Responde de forma hablada, natural, empática y MUY BREVE (máximo 2 frases).
            Emoción detectada en el usuario: {emocion_detectada}.
            """

            messages = [{"role": "system", "content": contexto_sistema}]
            for msg in historial:
                messages.append({"role": msg["role"], "content": msg["content"]})

            # 6. PENSAR (GPT-4o) con contexto del historial
            respuesta_full = await get_chat_response(messages)
            texto_ia = respuesta_full.choices[0].message.content
                 
        # 7. GUARDAR respuesta de IA en BD
        guardar_mensaje_historial(
            db=db, 
            user_id=user_id, 
            role="assistant", 
            content=texto_ia,
            emocion_detectada=emocion_detectada, 
            modelo_utilizado="gpt-4o-mini"
        )

        # -----------------------------------------------------

        # 8. HABLAR (TTS)
        # Generamos el audio MP3 en memoria
        audio_stream = await generar_voz_tts(texto_ia)
        
        # Rebobinamos el stream al inicio para poder leerlo
        audio_stream.seek(0) 
        
        # 9. RETORNAR STREAM
        # Devolvemos el audio directo como si fuera un archivo descargable/reproducible
        return StreamingResponse(
            audio_stream, 
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=respuesta_ia.mp3",
                "X-Crisis-Mode": es_crisis_header, # Indicamos al frontend si se detectó crisis en esta interacción por voz
            }
        )

    except Exception as e:
        # Manejo especial para AuthJWT en Python < 3.10 a veces
        from fastapi_jwt_auth.exceptions import AuthJWTException
        if isinstance(e, AuthJWTException):
            raise e
            
        logger.error(f"Error en voice endpoint: {e}")
        msg = str(e) if str(e) else getattr(e, 'message', 'Error desconocido')
        raise HTTPException(status_code=500, detail=msg)