from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.models.demograficos import DatosDemograficosUsuario
from app.schemas.demograficos import DemograficoCreate, DemograficoUpdate


def get_demografico_by_user_id(db: Session, user_id):
    return (
        db.query(DatosDemograficosUsuario)
        .filter(DatosDemograficosUsuario.user_id == user_id)
        .first()
    )


def create_demografico(db: Session, user_id, data: DemograficoCreate):
    payload = data.dict(exclude_unset=True)
    if payload.get("consentimiento_estadistico") is None:
        payload["consentimiento_estadistico"] = False
    db_obj = DatosDemograficosUsuario(user_id=user_id, **payload)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def update_demografico(db: Session, db_obj: DatosDemograficosUsuario, data: DemograficoUpdate):
    payload = data.dict(exclude_unset=True)
    for field, value in payload.items():
        setattr(db_obj, field, value)
    db_obj.updated_at = func.now()
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_demografico(db: Session, db_obj: DatosDemograficosUsuario):
    db.delete(db_obj)
    db.commit()
