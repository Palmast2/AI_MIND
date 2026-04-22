from sqlalchemy import Column, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from app.database import Base

class ConfiguracionSistema(Base):
    __tablename__ = "configuracion_sistema"

    clave = Column(String, primary_key=True, index=True)
    valor = Column(Text, nullable=False)
    descripcion = Column(Text, nullable=True)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())