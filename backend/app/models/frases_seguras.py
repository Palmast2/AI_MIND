from sqlalchemy import Column, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func

from app.database import Base

class FraseSegura(Base):
    __tablename__ = "frases_seguras"

    id = Column(Integer, primary_key=True, index=True)
    frase = Column(Text, nullable=False)
    nivel_riesgo = Column(String(10), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
