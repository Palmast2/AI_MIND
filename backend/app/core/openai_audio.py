import io
from openai import AsyncOpenAI
from app.core.config import settings 

client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def transcribir_con_whisper(file_bytes: bytes, filename: str) -> str:
    """
    Opción Estándar (Whisper-1): El mejor para transcripción pura.
    Soporta: mp3, mp4, mpeg, mpga, m4a, wav, webm, y OGG (WhatsApp).
    """
    # 1. Crear un objeto de archivo en memoria
    audio_file = io.BytesIO(file_bytes)
    
    # 2. Asignar el nombre con extensión (Vital para que Whisper detecte el formato)
    audio_file.name = filename 

    # 3. Llamada a Whisper
    transcription = await client.audio.transcriptions.create(
        model="whisper-1", 
        file=audio_file,
        language="es" # Forzar español mejora la precisión
    )
    
    return transcription.text

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