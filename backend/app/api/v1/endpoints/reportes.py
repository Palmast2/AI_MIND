from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.reporte_service import generar_reporte_pdf, obtener_meses_disponibles
from fastapi import HTTPException

router = APIRouter()

@router.get("/pdf/{user_id}/{year}/{month}")
def generar_pdf_por_mes(user_id: str, year: int, month: int, db: Session = Depends(get_db)):
    file_path = generar_reporte_pdf(db, user_id, year=year, month=month)
    if not file_path:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario en ese mes")
    return FileResponse(file_path, media_type="application/pdf", filename=file_path.split("/")[-1])

@router.get("/meses/{user_id}")
def meses_disponibles(user_id: str, db: Session = Depends(get_db)):
    meses = obtener_meses_disponibles(db, user_id)
    if not meses:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario")
    return {"user_id": user_id, "meses_disponibles": meses}