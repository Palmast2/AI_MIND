from pydantic import BaseModel

class EmotionResponse(BaseModel):
    emotion: str
    score: float
    details: dict = None  # Para información adicional

class AnalyzeRequest(BaseModel):
    text: str