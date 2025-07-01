import os
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import get_password_hash

PGP_KEY = os.getenv("PGP_KEY")
if not PGP_KEY:
    raise RuntimeError("La variable de entorno PGP_KEY no está definida.")

def get_user_by_email(db: Session, email: str):
    # Buscar usuario por email desencriptando en la consulta
    stmt = text("""
        SELECT * FROM usuarios
        WHERE pgp_sym_decrypt(email::bytea, :key) = :email
        LIMIT 1
    """)
    result = db.execute(stmt, {"key": PGP_KEY, "email": email}).fetchone()
    if result:
        db_user = db.query(User).get(result.user_id)
        # Sobrescribe el campo email con el valor descifrado
        db_user.email = get_decrypted_email(db, db_user.user_id)
        return db_user
    return None

def get_decrypted_email(db, user_id):
    stmt = text("""
        SELECT pgp_sym_decrypt(email::bytea, :key) as email
        FROM usuarios
        WHERE user_id = :user_id
    """)
    result = db.execute(stmt, {"key": PGP_KEY, "user_id": str(user_id)}).fetchone()
    return result.email if result else None


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
    db_user = db.query(User).get(user_id)
    # Sobrescribe el campo email con el valor descifrado
    db_user.email = get_decrypted_email(db, user_id)
    return db_user