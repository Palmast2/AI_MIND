from fastapi import FastAPI
from app.api.v1.endpoints import analyze

app = FastAPI(
    title="AI_MIND",
    version="1.0.0",
)

app.include_router(
    analyze.router,
    prefix="/api/v1",
    tags=["Análisis"]
)