from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi_jwt_auth import AuthJWT
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.contactos import ContactoEmergencia
from app.schemas.demograficos import DemograficoCreate, DemograficoUpdate, DemograficoOut
from app.crud.demograficos import get_demografico_by_user_id, create_demografico, update_demografico

router = APIRouter()


class ContactoCreate(BaseModel):
    nombre: str
    telefono: str
    relacion: Optional[str] = "Familiar/Amigo"


class ContactoResponse(ContactoCreate):
    id: int

    class Config:
        orm_mode = True
        from_attributes = True


class ConfiguracionUsuarioUpdate(BaseModel):
    demograficos: Optional[DemograficoUpdate] = None
    email_psicologo: Optional[EmailStr] = None
    contactos: Optional[List[ContactoCreate]] = None


class ConfiguracionUsuarioOut(BaseModel):
    demograficos: Optional[DemograficoOut] = None
    email_psicologo: Optional[EmailStr] = None
    contactos: List[ContactoResponse] = Field(default_factory=list)


def _get_usuario_or_404(db: Session, user_id: str) -> User:
    usuario = db.query(User).filter(User.user_id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return usuario


@router.get("", response_model=ConfiguracionUsuarioOut)
def obtener_configuracion_usuario(
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    """
    ### Obtener configuracion del usuario
    Devuelve en una sola respuesta los datos demograficos, contactos de emergencia
    y el correo de psicologo asignado.

    **Requiere autenticacion:**
    - Cookie `access_token_cookie` valida.
    - No requiere CSRF por ser GET.

    **Respuesta exitosa (200 OK):**
    - `demograficos`: objeto o `null` si no existe.
    - `email_psicologo`: string o `null`.
    - `contactos`: lista (puede ser vacia).

    **Posibles errores:**
    - `401 Unauthorized`: Token faltante o expirado.
    - `404 Not Found`: Usuario no existe.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    usuario = _get_usuario_or_404(db, user_id)
    demograficos = get_demografico_by_user_id(db, user_id)
    contactos = (
        db.query(ContactoEmergencia)
        .filter(ContactoEmergencia.user_id == user_id)
        .all()
    )

    return {
        "demograficos": demograficos,
        "email_psicologo": usuario.email_psicologo_asignado,
        "contactos": contactos,
    }


@router.put("", response_model=ConfiguracionUsuarioOut)
def actualizar_configuracion_usuario(
    data: ConfiguracionUsuarioUpdate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    """
    ### Actualizar configuracion del usuario
    Actualiza cualquier subconjunto de la configuracion (parcial). Los campos
    no enviados no se modifican.

    **Requiere autenticacion y CSRF:**
    - Cookie `access_token_cookie` valida.
    - Cookie `csrf_access_token` valida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Request Body (JSON):**
    - `email_psicologo` (string o null): actualiza o elimina el psicologo asignado.
    - `demograficos` (objeto o null):
        - objeto: crea o actualiza datos demograficos.
        - null: elimina el registro demografico si existe.
    - `contactos` (lista): reemplaza toda la red de apoyo.
        - lista vacia o null: elimina todos los contactos.

    **Respuesta exitosa (200 OK):**
    Misma estructura que `GET /configuracion-usuario`.

    **Posibles errores:**
    - `401 Unauthorized`: Token faltante o expirado.
    - `404 Not Found`: Usuario no existe.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    usuario = _get_usuario_or_404(db, user_id)
    fields_set = data.__fields_set__
    needs_commit = False

    if "email_psicologo" in fields_set:
        usuario.email_psicologo_asignado = data.email_psicologo
        needs_commit = True

    if "demograficos" in fields_set:
        if data.demograficos is None:
            db_obj = get_demografico_by_user_id(db, user_id)
            if db_obj:
                db.delete(db_obj)
                needs_commit = True
        else:
            db_obj = get_demografico_by_user_id(db, user_id)
            if db_obj:
                update_demografico(db, db_obj=db_obj, data=data.demograficos)
            else:
                payload = data.demograficos.dict(exclude_unset=True)
                create_demografico(db, user_id=user_id, data=DemograficoCreate(**payload))

    if "contactos" in fields_set:
        (
            db.query(ContactoEmergencia)
            .filter(ContactoEmergencia.user_id == user_id)
            .delete(synchronize_session=False)
        )
        nuevos = [
            ContactoEmergencia(
                user_id=user_id,
                nombre=contacto.nombre,
                telefono=contacto.telefono,
                relacion=contacto.relacion,
            )
            for contacto in (data.contactos or [])
        ]
        if nuevos:
            db.add_all(nuevos)
        needs_commit = True

    if needs_commit:
        db.commit()
        db.refresh(usuario)

    demograficos = get_demografico_by_user_id(db, user_id)
    contactos = (
        db.query(ContactoEmergencia)
        .filter(ContactoEmergencia.user_id == user_id)
        .all()
    )

    return {
        "demograficos": demograficos,
        "email_psicologo": usuario.email_psicologo_asignado,
        "contactos": contactos,
    }


@router.delete("")
def eliminar_configuracion_usuario(
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db),
):
    """
    ### Eliminar configuracion del usuario
    Elimina demograficos, contactos y desasigna el psicologo en una sola operacion.

    **Requiere autenticacion y CSRF:**
    - Cookie `access_token_cookie` valida.
    - Cookie `csrf_access_token` valida.
    - Header `X-CSRF-TOKEN` con el valor de la cookie `csrf_access_token`.

    **Respuesta exitosa (200 OK):**
    - Mensaje de confirmacion.

    **Posibles errores:**
    - `401 Unauthorized`: Token faltante o expirado.
    - `404 Not Found`: Usuario no existe.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    usuario = _get_usuario_or_404(db, user_id)
    db_obj = get_demografico_by_user_id(db, user_id)
    if db_obj:
        db.delete(db_obj)

    (
        db.query(ContactoEmergencia)
        .filter(ContactoEmergencia.user_id == user_id)
        .delete(synchronize_session=False)
    )

    usuario.email_psicologo_asignado = None
    db.commit()

    return {"mensaje": "Configuracion eliminada correctamente"}
