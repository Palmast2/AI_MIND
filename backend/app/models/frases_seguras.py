from sqlalchemy import Boolean, Column, Integer, Text, TIMESTAMP
from sqlalchemy.sql import func

from app.database import Base

class FraseSegura(Base):
    __tablename__ = "frases_seguras"

    id = Column(Integer, primary_key=True, index=True)
    frase = Column(Text, nullable=False)
    activa = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
