from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID 
from sqlalchemy.orm import relationship
from app.database import Base

class ContactoEmergencia(Base):
    __tablename__ = "contactos_emergencia"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.user_id"), nullable=False)
    
    nombre = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    relacion = Column(String, nullable=True)
    alias = Column(String(50), nullable=True)