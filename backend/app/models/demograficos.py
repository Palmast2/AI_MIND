import uuid
from sqlalchemy import Column, String, Boolean, Integer, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base


class DatosDemograficosUsuario(Base):
    __tablename__ = "datos_demograficos_usuario"

    demografico_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("usuarios.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    birth_year = Column(Integer, nullable=True)
    genero = Column(String(30), nullable=True)
    sexo = Column(String(30), nullable=True)
    nivel_educativo = Column(String(50), nullable=True)
    ocupacion = Column(String(50), nullable=True)
    estado_civil = Column(String(30), nullable=True)
    situacion_laboral = Column(String(30), nullable=True)
    estado = Column(String(50), nullable=True)
    consentimiento_estadistico = Column(Boolean, default=False, nullable=False)

    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)
