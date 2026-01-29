import os
from openai import AsyncOpenAI
# from app.core.config import settings

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def get_chat_response(input_data):
    """
    Función Universal (Híbrida):
    - Si recibe TEXTO (str) -> Viene del módulo de Voz. Lo convertimos a formato chat.
    - Si recibe LISTA (list) -> Viene del módulo de Chat. Lo usamos tal cual.
    - Devuelve siempre el objeto COMPLETO de OpenAI para no romper esquemas.
    """
    try:
        # 1. Detectamos qué nos están enviando
        if isinstance(input_data, str):
            # Caso Voz: Solo llega el texto, así que le creamos el contexto aquí.
            messages = [
                {"role": "system", "content": "Eres IA-MIND, un asistente psicológico empático, breve y útil."},
                {"role": "user", "content": input_data}
            ]
        else:
            # Caso Chat: Ya llega la lista con todo el historial.
            messages = input_data

        # 2. Llamamos a la IA 
        response = await client.chat.completions.create(
            model="gpt-4o-mini", 
            messages=messages
        )
        
        # 3. Devolvemos el objeto completo
        return response
        
    except Exception as e:
        print(f"Error en OpenAI Chat: {e}")
        raise e