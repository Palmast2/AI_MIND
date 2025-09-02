from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.core.reporte_service import generar_reporte_pdf
from fastapi import HTTPException

router = APIRouter()

@router.get("/pdf/{user_id}")
def generar_pdf(user_id: str, db: Session = Depends(get_db)):
    file_path = generar_reporte_pdf(db, user_id)
    if not file_path:
        raise HTTPException(status_code=404, detail="No hay historial de mensajes para este usuario")
    return FileResponse(file_path, media_type="application/pdf", filename=file_path.split("/")[-1])
