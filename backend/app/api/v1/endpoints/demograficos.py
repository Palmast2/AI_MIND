from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi_jwt_auth import AuthJWT
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.rate_limit import limiter
from app.crud.demograficos import (
    get_demografico_by_user_id,
    create_demografico,
    update_demografico,
    delete_demografico,
)
from app.schemas.demograficos import (
    DemograficoCreate,
    DemograficoUpdate,
    DemograficoOut,
    get_demograficos_catalogo,
)

router = APIRouter()


@router.get("/demograficos/opciones")
@limiter.limit("60/hour")
def obtener_catalogo_demograficos(request: Request):
    return get_demograficos_catalogo()


@router.get("/demograficos/me", response_model=DemograficoOut)
@limiter.limit("30/hour")
def obtener_mis_datos_demograficos(
    request: Request,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    db_obj = get_demografico_by_user_id(db, user_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Datos demograficos no encontrados")
    return db_obj


@router.post("/demograficos/me", response_model=DemograficoOut, status_code=201)
@limiter.limit("10/hour")
def crear_mis_datos_demograficos(
    data: DemograficoCreate,
    request: Request,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    existing = get_demografico_by_user_id(db, user_id)
    if existing:
        raise HTTPException(status_code=409, detail="Ya existe un registro demografico")

    return create_demografico(db, user_id=user_id, data=data)


@router.put("/demograficos/me", response_model=DemograficoOut)
@limiter.limit("30/hour")
def actualizar_mis_datos_demograficos(
    data: DemograficoUpdate,
    request: Request,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    db_obj = get_demografico_by_user_id(db, user_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Datos demograficos no encontrados")

    return update_demografico(db, db_obj=db_obj, data=data)


@router.delete("/demograficos/me", status_code=204)
@limiter.limit("10/hour")
def eliminar_mis_datos_demograficos(
    request: Request,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    db_obj = get_demografico_by_user_id(db, user_id)
    if not db_obj:
        raise HTTPException(status_code=404, detail="Datos demograficos no encontrados")

    delete_demografico(db, db_obj=db_obj)
    return None
