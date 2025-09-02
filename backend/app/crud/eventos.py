from sqlalchemy import text
from sqlalchemy.orm import Session
import uuid

def guardar_evento(db: Session, user_id: str, message_id: str, tipo_evento: str,
                   descripcion: str, nivel_alerta: str = "alto", atendido: bool = False):
    stmt = text("""
        INSERT INTO eventos_criticos (
            evento_id, user_id, message_id, tipo_evento, descripcion, nivel_alerta, atendido
        )
        VALUES (
            :evento_id, :user_id, :message_id, :tipo_evento, :descripcion, :nivel_alerta, :atendido
        )
    """)
    evento_id = uuid.uuid4()
    db.execute(stmt, {
        "evento_id": evento_id,
        "user_id": user_id,
        "message_id": message_id,
        "tipo_evento": tipo_evento,
        "descripcion": descripcion,
        "nivel_alerta": nivel_alerta,
        "atendido": atendido
    })
    db.commit()
    return evento_id
