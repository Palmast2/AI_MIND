from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from fastapi_jwt_auth import AuthJWT

# Importaciones de tu proyecto
from app.database import get_db
from app.models.user import User
from app.models.contactos import ContactoEmergencia
from app.models.configuracion import ConfiguracionSistema
router = APIRouter()

# ==========================================
# 1. ESQUEMAS DE VALIDACIÓN (Pydantic)
# ==========================================

class PsicologoUpdate(BaseModel):
    # Permite que sea un correo válido o nulo (por si quiere quitarlo)
    email_psicologo: Optional[EmailStr] = None

class ContactoCreate(BaseModel):
    nombre: str
    telefono: str
    relacion: Optional[str] = "Familiar/Amigo"

class ContactoResponse(ContactoCreate):
    id: int
    class Config:
            orm_mode = True        
            from_attributes = True  

class EmailGlobalUpdate(BaseModel):
    email_global: EmailStr

# ==========================================
# 2. ENDPOINTS DE PSICÓLOGO
# ==========================================

@router.put("/psicologo")
def actualizar_psicologo(
    datos: PsicologoUpdate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Actualizar Psicólogo Asignado
        Actualiza o elimina el correo del psicólogo personal del usuario. Este correo 
        tendrá prioridad para recibir las Alertas de Crisis.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Request Body (JSON):**
        - `email_psicologo` (string, opcional): Un correo electrónico válido. 
        *Nota Frontend:* Si el usuario quiere desvincular a su psicólogo, enviar `null`.

        **📤 Respuesta Exitosa (200 OK):**
        ```json
        {
            "mensaje": "Correo de psicólogo actualizado correctamente",
            "email_asignado": "doctor@clinica.com"
        }
        ```

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        - `404 Not Found`: El usuario no existe en la base de datos.
        - `422 Unprocessable Entity`: El correo enviado no tiene un formato válido.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    usuario = db.query(User).filter(User.user_id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.email_psicologo_asignado = datos.email_psicologo
    db.commit()
    
    return {
        "mensaje": "Correo de psicólogo actualizado correctamente", 
        "email_asignado": usuario.email_psicologo_asignado
    }


# ==========================================
# 3. ENDPOINTS DE CONTACTOS DE EMERGENCIA
# ==========================================

@router.post("/contactos", response_model=ContactoResponse)
def agregar_contacto(
    contacto: ContactoCreate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Agregar Contacto de Emergencia
        Añade un nuevo contacto a la red de apoyo del usuario. Estos contactos se 
        mostrarán en pantalla durante un evento de crisis.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Request Body (JSON):**
        - `nombre` (string, requerido): Nombre del contacto (Ej. "María").
        - `telefono` (string, requerido): Número de teléfono (Ej. "5512345678").
        - `relacion` (string, opcional): Parentesco o relación (Ej. "Madre"). Por defecto es "Familiar/Amigo".

        **📤 Respuesta Exitosa (200 OK):**
        Devuelve el objeto completo del contacto recién creado, incluyendo su nuevo `id`.

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    nuevo_contacto = ContactoEmergencia(
        user_id=user_id,
        nombre=contacto.nombre,
        telefono=contacto.telefono,
        relacion=contacto.relacion
    )
    
    db.add(nuevo_contacto)
    db.commit()
    db.refresh(nuevo_contacto) # Refresca para obtener el ID autogenerado
    
    return nuevo_contacto


@router.get("/contactos", response_model=List[ContactoResponse])
def listar_contactos(
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Obtener Red de Apoyo (Contactos)
        Devuelve la lista completa de contactos de emergencia registrados por el usuario.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` (No requiere CSRF por ser petición GET).

        **📤 Respuesta Exitosa (200 OK):**
        Una lista (Array) de objetos de contactos. Si no tiene contactos, devuelve un Array vacío `[]`.

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    contactos = db.query(ContactoEmergencia).filter(ContactoEmergencia.user_id == user_id).all()
    return contactos


@router.delete("/contactos/{contacto_id}")
def eliminar_contacto(
    contacto_id: int,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Eliminar Contacto de Emergencia
        Borra un contacto específico de la red de apoyo del usuario.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Path Parameter:**
        - `contacto_id` (integer, requerido): El ID único del contacto a eliminar.

        **📤 Respuesta Exitosa (200 OK):**
        ```json
        {
            "mensaje": "Contacto eliminado exitosamente"
        }
        ```

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        - `404 Not Found`: El contacto no existe o no pertenece al usuario autenticado.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    # Buscamos el contacto asegurándonos que pertenezca a este usuario (por seguridad)
    contacto = db.query(ContactoEmergencia).filter(
        ContactoEmergencia.id == contacto_id, 
        ContactoEmergencia.user_id == user_id
    ).first()
    
    if not contacto:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")

    db.delete(contacto)
    db.commit()
    
    return {"mensaje": "Contacto eliminado exitosamente"}


# ==========================================
# 4. ENDPOINTS DE ADMINISTRACIÓN (SOLO JEFE/PSICÓLOGO)
# ==========================================

@router.put("/admin/email-global")
def actualizar_email_global(
    datos: EmailGlobalUpdate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
    ### 🛡️ [ADMIN] Actualizar Correo Global de Emergencia
    Cambia el correo general (ConfiguracionSistema) al que llegan las crisis de los 
    usuarios que no tienen un psicólogo asignado.

    **🔒 Requiere Autenticación y Privilegios de Administrador.**
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    # 1. Buscar al usuario
    usuario = db.query(User).filter(User.user_id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # ---------------------------------------------------------
    # 🚨 CANDADO DE SEGURIDAD (EJEMPLO PARA EL FUTURO) 🚨
    # Para habilitar esto bien, a futuro le agregaremos una columna 
    # 'rol' o 'is_admin' a tu tabla de usuarios. 
    # Por ahora, podemos protegerlo validando que SOLO un id pueda hacerlo:
    # ---------------------------------------------------------
    correo_super_admin = "b815a74c-4b3c-4d8a-b38e-fe89584cfc83" # ID
    
    if str(usuario.user_id) != correo_super_admin:
        raise HTTPException(
            status_code=403, 
            detail="Acceso denegado: Solo el administrador puede cambiar el correo global."
            #detail=f"Acceso denegado. Tu correo en BD es '{usuario.email}' y el sistema pide '{correo_super_admin}'"
        )

    # 2. Buscar y actualizar la configuración
    config_email = db.query(ConfiguracionSistema).filter(ConfiguracionSistema.clave == "EMAIL_ALERTA_CRISIS").first()

    if not config_email:
        # Si por alguna razón la tabla estaba vacía, lo insertamos
        config_email = ConfiguracionSistema(clave="EMAIL_ALERTA_CRISIS", valor=datos.email_global, descripcion="Correo global de respaldo")
        db.add(config_email)
    else:
        # Si ya existe, lo actualizamos
        config_email.valor = datos.email_global

    db.commit()
    
    return {
        "mensaje": "Correo global de respaldo actualizado correctamente", 
        "nuevo_email_global": config_email.valor
    }