from sqlalchemy import text
from sqlalchemy.orm import Session
import uuid
import os

PGP_KEY = os.getenv("PGP_KEY")

def guardar_mensaje(db: Session, user_id, role, contenido, emocion_detectada=None, modelo_utilizado=None, consentimiento=True):
    stmt = text("""
        INSERT INTO mensajes (
            message_id, user_id, role, contenido, emocion_detectada, modelo_utilizado, consentimiento_usuario
        )
        VALUES (
            :message_id, :user_id, :role, pgp_sym_encrypt(:contenido, :key),
            :emocion_detectada, :modelo_utilizado, :consentimiento_usuario
        )
    """)
    message_id = uuid.uuid4()
    db.execute(stmt, {
        "message_id": message_id,
        "user_id": user_id,
        "role": role,
        "contenido": contenido,
        "emocion_detectada": emocion_detectada,
        "modelo_utilizado": modelo_utilizado,
        "consentimiento_usuario": consentimiento,
        "key": PGP_KEY
    })
    db.commit()
    return message_id

def obtener_historial_usuario(db: Session, user_id, limite=10):
    stmt = text("""
        SELECT role,
               pgp_sym_decrypt(contenido::bytea, :key) AS contenido
        FROM mensajes
        WHERE user_id = :user_id
        ORDER BY created_at DESC
        LIMIT :limite
    """)
    result = db.execute(stmt, {
        "user_id": user_id,
        "key": PGP_KEY,
        "limite": limite
    }).fetchall()

    # Lo devolvemos en orden cronológico (más antiguo primero)
    historial = [{"role": row.role, "content": row.contenido} for row in reversed(result)]
    return historial
