from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class CorrienteFilosofica(Base):
    __tablename__ = "corrientes_filosoficas"
    
    id = Column(Integer, primary_key=True, index=True)
    # Atamos la corriente al usuario específico
    user_id = Column(UUID(as_uuid=True), ForeignKey("usuarios.user_id", ondelete="CASCADE"), nullable=False)
    nombre = Column(String(100), nullable=False)