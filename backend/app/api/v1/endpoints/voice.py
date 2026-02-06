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

# --- Importaciones de Audio ---
from app.core.openai_audio import transcribir_con_whisper, generar_voz_tts

router = APIRouter()
logger = logging.getLogger("voice_endpoint")

@router.post("/chat/voz")
async def chat_voice(
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

    **Respuesta (Output):**
    - **Content-Type:** `audio/mpeg`
    - **Body:** Flujo de bytes del archivo MP3 (Binary Stream).
    
    **Nota de Implementación Frontend:**
    Este endpoint NO devuelve JSON. El cliente debe manejar la respuesta como un `Blob`
    y crear una URL de objeto (`URL.createObjectURL`) para reproducirlo.
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
        emocion_detectada = map_emotion(emotion_result, user_message=texto_usuario)

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
        
        # Opcional: Registrar evento crítico si se detecta en voz (Igual que en chat.py)
        if emocion_detectada in ["autoagresion", "crisis emocional / ideacion suicida"]:
             guardar_evento(
                db=db, 
                user_id=user_id, 
                message_id=message_id, 
                tipo_evento=emocion_detectada, 
                descripcion=texto_usuario, 
                nivel_alerta="alto", 
                atendido=False
            )

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
                "Content-Disposition": "inline; filename=respuesta_ia.mp3"
            }
        )

    except Exception as e:
        logger.error(f"Error en voice endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))