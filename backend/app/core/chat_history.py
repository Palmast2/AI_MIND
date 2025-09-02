import os
from app.crud.message import guardar_mensaje
from sqlalchemy import text
from sqlalchemy.orm import Session

MAX_HISTORY = 3  # cantidad máxima de pares usuario-IA

def obtener_historial_usuario(db: Session, user_id: str, limite: int = MAX_HISTORY):
    """
    Obtiene los últimos 'limite' pares de mensajes (usuario + IA) de la base de datos.
    """
    stmt = text("""
        SELECT role, pgp_sym_decrypt(contenido, :key) AS contenido
        FROM mensajes
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        LIMIT :limite
    """)
    resultados = db.execute(stmt, {
        "user_id": user_id,
        "key": os.getenv("PGP_KEY"),
        "limite": limite * 2  # trae pares usuario-IA
    }).mappings().all()

    # Solo devolver pares alternados para que no se repita un mismo rol
    pares = []
    ultimo_role = None
    for r in reversed(resultados):
        if r["role"] != ultimo_role:
            pares.append({"role": r["role"], "content": r["contenido"]})
            ultimo_role = r["role"]
    return pares

def guardar_mensaje_historial(db: Session, user_id: str, role: str, content: str,
                               emocion_detectada: str, modelo_utilizado: str, consentimiento=True):
    """
    Guarda un mensaje en la base de datos.
    """
    guardar_mensaje(
        db=db,
        user_id=user_id,
        contenido=content,
        emocion_detectada=emocion_detectada,
        modelo_utilizado=modelo_utilizado,
        consentimiento=consentimiento
    )


def build_prompt(db: Session, user_id: str, emocion: str, tecnicas: str, advertencias: str) -> str:
    """
    Construye el prompt concatenando mensajes del historial de la BD más el contexto emocional.
    """
    history = obtener_historial_usuario(db, user_id, MAX_HISTORY)
    conversation = ""
    for msg in history:
        if msg["role"] == "user":
            conversation += f"Usuario: {msg['content']}\n"
        else:
            conversation += f"Asistente: {msg['content']}\n"
    
    prompt = f"""
{conversation}

Contexto emocional detectado:
- Emoción principal: {emocion}
- Técnicas recomendadas: {tecnicas}
- Advertencias: {advertencias}

Responde como psicólogo profesional, de forma empática y breve, considerando el contexto anterior.
"""
    return prompt
