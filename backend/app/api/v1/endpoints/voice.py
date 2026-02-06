from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from app.core.openai_audio import transcribir_con_whisper, generar_voz_tts
from app.core.openai_chat import get_chat_response 

router = APIRouter()

@router.post("/chat/voz")
async def chat_voice(file: UploadFile = File(...)):
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
        # 1. Leer el archivo de audio recibido
        contenido = await file.read()
        
        # 2. ESCUCHAR (Whisper)
        # Pasamos el nombre del archivo para que Whisper detecte el formato (.ogg, .m4a, etc.)
        texto_usuario = await transcribir_con_whisper(contenido, file.filename)
        
        # 3. PENSAR (GPT-4o)
        # Obtenemos la respuesta inteligente del asistente
        respuesta_full = await get_chat_response(texto_usuario)
        texto_ia = respuesta_full.choices[0].message.content
        
        # 4. HABLAR (TTS)
        # Generamos el audio MP3 en memoria
        audio_stream = await generar_voz_tts(texto_ia)
        
        # Rebobinamos el stream al inicio para poder leerlo
        audio_stream.seek(0) 
        
        # 5. RETORNAR STREAM
        # Devolvemos el audio directo como si fuera un archivo descargable/reproducible
        return StreamingResponse(
            audio_stream, 
            media_type="audio/mpeg",
            headers={
                "Content-Disposition": "inline; filename=respuesta_ia.mp3"
            }
        )

    except Exception as e:
        print(f"Error en voice endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))