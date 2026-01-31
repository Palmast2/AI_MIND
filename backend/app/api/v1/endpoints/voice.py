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
        Recibe un audio de voz del usuario, lo procesa y devuelve una respuesta en audio de la IA.
        Ideal para interacción directa por voz sin texto intermedio.

        **Flujo de Proceso:**
        1. **Escuchar:** Transcribe el audio recibido (Gpt-4o-transcribe).
        2. **Pensar:** Envía el texto transcrito al cerebro (GPT-4o-mini) para obtener respuesta empática.
        3. **Hablar:** Convierte la respuesta de texto a audio (TTS - Shimmer).

        **Request (Input):**
        - **Content-Type:** `multipart/form-data`
        - **Body:** - `file`: Archivo de audio binario (Soporta: `.mp3`, `.wav`).
        *Nota: El modelo actual NO soporta .ogg (WhatsApp directos).*

        **Respuesta (Output):**
        - **Content-Type:** `audio/mpeg`
        - **Body:** Archivo binario (Blob) listo para reproducirse.
        - ⚠️ **NOTA IMPORTANTE:** Este endpoint NO devuelve JSON. Devuelve el stream de audio directo.
        El Frontend debe recibirlo como `blob()` y crear un `URL.createObjectURL(blob)` para el reproductor.

        **Errores Comunes:**
        - **400:** Si envías un formato no soportado (ej. .ogg) o el audio está corrupto.
        - **500:** Error interno del servidor.
        """
    try:
        # 1. Leer el archivo en memoria
        contenido = await file.read()
        
        # 2: Detectamos la extensión real
        ext = file.filename.split(".")[-1] if "." in file.filename else "mp3"
        
        # Le pasamos la extensión correcta
        texto_transcrito = await transcribir_con_gpt4o(contenido, format=ext) 
        
        # 3. PENSAR
        respuesta_full_object = await get_chat_response(texto_transcrito)
        
        # Extraemos solo el texto para poder convertirlo a voz
        texto_para_hablar = respuesta_full_object.choices[0].message.content
        
        # 4. HABLAR (TTS)
        # Le pasamos el texto limpio a la función de voz
        audio_stream = await generar_voz_tts(texto_para_hablar)
        
        # Convertimos el stream en bytes sólidos. 
        # Esto le permite al navegador saber cuánto dura el audio.
        audio_bytes = audio_stream.getvalue()
        
        return Response(content=audio_bytes, media_type="audio/mpeg")

    except Exception as e:
        print(f"Error en voice endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))