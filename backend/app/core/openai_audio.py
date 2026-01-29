import base64
import io
from openai import AsyncOpenAI
from app.core.config import settings 

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribir_con_gpt4o(file_bytes: bytes, format: str = "mp3") -> str:
    """
    Opción Premium ($0.006/min): Usa la inteligencia de GPT-4o para escuchar.
    Ideal para entender contexto, jerga o audios difíciles.
    """
    # 1. Codificar el audio a Base64 (Requisito para GPT-4o Audio)
    audio_b64 = base64.b64encode(file_bytes).decode('utf-8')

    # 2. Llamada al modelo "Smart" (Chat Completions con Audio)
    response = await client.chat.completions.create(
        model="gpt-4o-audio-preview", # Este es el nombre técnico del modelo "gpt-4o-transcribe"
        modalities=["text"], # Le pedimos que solo responda con texto (la transcripción)
        messages=[
            {
                "role": "user",
                "content": [
                    { 
                        "type": "text", 
                        "text": "Transcribe el siguiente audio exactamente palabra por palabra. No añadidas descripciones, solo el texto hablado." 
                    },
                    {
                        "type": "input_audio", 
                        "input_audio": {
                            "data": audio_b64, 
                            "format": format # "wav" o "mp3"
                        }
                    }
                ]
            }
        ]
    )
    
    return response.choices[0].message.content

async def generar_voz_tts(texto: str) -> io.BytesIO:
    """
    Opción Estándar ($0.015/1k chars): Tu voz 'Shimmer'
    """
    response = await client.audio.speech.create(
        model="tts-1",
        voice="shimmer",
        input=texto,
        speed=1.1
    )
    return io.BytesIO(response.content)