import os
from app.crud.message import guardar_mensaje
from sqlalchemy import text
from sqlalchemy.orm import Session

MAX_HISTORY = 3  # Queremos 3 pares de conversación (Usuario-IA)

def obtener_historial_usuario(db: Session, user_id: str, limite: int = MAX_HISTORY):
    """
    Obtiene los últimos mensajes.
    IMPORTANTE: Multiplica el límite por 2 para traer PARES completos.
    """
    
    limit_sql = limite * 2  
    # Si pides 3, esto lo convierte en 6 (para traer 3 idas y vueltas)

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
        "limite": limit_sql # Usamos el límite multiplicado
    }).mappings().all()

    pares = []
    
    for r in reversed(resultados):
        pares.append({"role": r["role"], "content": r["contenido"]})
            
    return pares

def guardar_mensaje_historial(db: Session, user_id: str, role: str, content: str,
                               emocion_detectada: str, modelo_utilizado: str, consentimiento=True):
    """
    Guarda un mensaje en la base de datos, normalizando emociones desconocidas.
    """
    if emocion_detectada in ["otros", "others"]:
        emocion_detectada = "tranquilidad"

    return guardar_mensaje(
        db=db,
        user_id=user_id,
        role=role,
        contenido=content,
        emocion_detectada=emocion_detectada,
        modelo_utilizado=modelo_utilizado,
        consentimiento=consentimiento
    )

def build_prompt(db: Session, user_id: str, emocion: str, tecnicas: str, advertencias: str) -> str:
    # Este usa MAX_HISTORY (3), que gracias a la función de arriba se convierte en 6.
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