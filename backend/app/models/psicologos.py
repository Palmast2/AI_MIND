from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class PsicologoUsuario(Base):
    __tablename__ = "psicologos_usuario"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.user_id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=True)
    alias = Column(String(50), nullable=False)
    email = Column(String(255), nullable=False)