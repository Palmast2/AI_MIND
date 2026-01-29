from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import Response 
from app.core.openai_audio import transcribir_con_gpt4o, generar_voz_tts
from app.core.openai_chat import get_chat_response 
import base64

router = APIRouter()

@router.post("/chat/voz")
async def chat_voice(file: UploadFile = File(...)
    ):
    """
        Recibe un audio de voz del usuario, lo procesa y devuelve una respuesta estructurada (JSON).
        Incluye la transcripción, la respuesta en texto y el audio de la IA listo para reproducir.

        **Flujo de Proceso:**
        1. **Escuchar:** Transcribe el audio recibido (Gpt-4o-transcribe).
        2. **Pensar:** Envía el texto transcrito al cerebro (GPT-4o-mini) para obtener respuesta empática.
        3. **Hablar:** Convierte la respuesta de texto a audio (TTS - Shimmer).

        **Request (Input):**
        - **Content-Type:** `multipart/form-data`
        - **Body:** `file`: Archivo de audio binario (Soporta: `.mp3`, `.wav`).
        *Nota: El modelo actual NO soporta .ogg (WhatsApp directos).*

        **Respuesta (Output):**
        - **Content-Type:** `application/json`
        - **Body (JSON):**
        {
            "status": "success",
            "user_transcription": "Texto que dijo el usuario (para su burbuja)",
            "text_response": "Texto que responde la IA (para su burbuja)",
            "audio_content": "SUQzBAAAAAAAI1RTU0..." // (Audio codificado en Base64)
        }

        **⚠️ NOTA PARA FRONTEND (Implementación):**
        Este endpoint devuelve un JSON, NO un archivo binario directo.
        1. Muestra `text_response` en el chat inmediatamente.
        2. Reproduce el audio inyectando el Base64 así:
        `const audio = new Audio("data:audio/mp3;base64," + response.audio_content);`
        `audio.play();`

        **Errores Comunes:**
        - **400:** Si envías un formato no soportado (ej. .ogg).
        - **500:** Error interno del servidor.
        """
    try:
            # 1. Leer el archivo de audio
            contenido = await file.read()
            ext = file.filename.split(".")[-1] if "." in file.filename else "mp3"
            
            # 2. ESCUCHAR 
            # Transcribe lo que dijo el usuario
            texto_usuario = await transcribir_con_gpt4o(contenido, format=ext) 
            
            # 3. PENSAR (GPT-4o)
            # Obtiene la respuesta inteligente
            respuesta_full = await get_chat_response(texto_usuario)
            texto_ia = respuesta_full.choices[0].message.content
            
            # 4. HABLAR (TTS)
            # Genera el audio de la respuesta
            audio_stream = await generar_voz_tts(texto_ia)
            
            # Convertimos los bytes del audio a Base64
            # Esto permite enviar el audio DENTRO del JSON
            audio_base64 = base64.b64encode(audio_stream.getvalue()).decode('utf-8')
            
            # 5. RETORNAR EL PAQUETE COMPLETO
            return {
                "status": "success",
                "user_transcription": texto_usuario, # Lo que el usuario dijo (para mostrar en su burbuja)
                "text_response": texto_ia,           # La respuesta de la IA (para mostrar en la burbuja del bot)
                "audio_content": audio_base64,       # El audio listo para reproducir
                "content_type": "audio/mpeg"
            }

    except Exception as e:
        print(f"Error en voice endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))