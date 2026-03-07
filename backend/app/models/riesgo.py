from sqlalchemy import Column, Integer, String, Text
from app.database import Base

class PatronRiesgo(Base):
    __tablename__ = "patrones_riesgo"
    id = Column(Integer, primary_key=True, index=True)
    patron = Column(Text, nullable=False)
    nivel = Column(String(10), nullable=False) # alto, medio, bajo
