import uuid
from sqlalchemy import Column, String, Boolean, Integer, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "usuarios"
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False, unique=True, index=True, comment="Identificador único")
    email = Column(String, nullable=False, unique=True, comment="Cifrado con pgp_sym_encrypt")
    password_hash = Column(String, nullable=False, comment="bcrypt (cost=12)")
    fecha_creacion = Column(TIMESTAMP(timezone=True), server_default=func.now())
    ultimo_login = Column(TIMESTAMP(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True)
    login_attempts = Column(Integer, default=0)