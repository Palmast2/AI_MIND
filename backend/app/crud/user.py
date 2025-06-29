import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

PGP_KEY = os.getenv("PGP_KEY")  # Usa una variable de entorno segura

def get_user_by_email(db: Session, email: str):
    # Buscar usuario por email desencriptando en la consulta
    stmt = text("""
        SELECT * FROM usuarios
        WHERE pgp_sym_decrypt(email::bytea, :key) = :email
        LIMIT 1
    """)
    result = db.execute(stmt, {"key": PGP_KEY, "email": email}).fetchone()
    if result:
        # Mapear resultado a modelo User
        return db.query(User).get(result.user_id)
    return None

def create_user(db: Session, user: UserCreate):
    # Insertar usuario cifrando el email
    stmt = text("""
        INSERT INTO usuarios (user_id, email, password_hash, fecha_creacion, is_active, login_attempts)
        VALUES (:user_id, pgp_sym_encrypt(:email, :key), :password_hash, now(), true, 0)
        RETURNING user_id
    """)
    import uuid
    user_id = uuid.uuid4()
    db.execute(stmt, {
        "user_id": user_id,
        "email": user.email,
        "key": PGP_KEY,
        "password_hash": get_password_hash(user.password)
    })
    db.commit()
    return db.query(User).get(user_id)