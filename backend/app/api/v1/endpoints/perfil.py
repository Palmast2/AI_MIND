from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
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

class PsicologoCreate(BaseModel):
    email_psicologo: EmailStr

class ContactoCreate(BaseModel):
    nombre: str
    telefono: str = Field(..., regex=r"^[0-9]{10}$", description="Debe ser un número de 10 dígitos")
    alias: Optional[str] = None
    relacion: Optional[Literal["Familiar", "Amigo", "Pareja", "Terapeuta", "Otro"]] = "Familiar"

class ContactoResponse(ContactoCreate):
    id: int
    class Config:
            orm_mode = True        
            from_attributes = True  

class EmailGlobalUpdate(BaseModel):
    email_global: EmailStr

class RelacionCat(BaseModel):
    id: int
    relacion: str

# ==========================================
# 2. ENDPOINTS DE PSICÓLOGO
# ==========================================

@router.post("/psicologo")
def asignar_psicologo(
    datos: PsicologoCreate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Asignar Psicólogo
        Asigna un correo de psicólogo al usuario si aún no tiene uno.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Request Body (JSON):**
        - `email_psicologo` (string, requerido): Un correo electrónico válido.

        **📤 Respuesta Exitosa (200 OK):**
        ```json
        {
            "mensaje": "Correo de psicólogo asignado correctamente",
            "email_asignado": "doctor@clinica.com"
        }
        ```

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        - `404 Not Found`: El usuario no existe en la base de datos.
        - `409 Conflict`: Ya existe un psicólogo asignado.
        - `422 Unprocessable Entity`: El correo enviado no tiene un formato válido.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    usuario = db.query(User).filter(User.user_id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if usuario.email_psicologo_asignado:
        raise HTTPException(status_code=409, detail="Ya existe un psicólogo asignado")

    usuario.email_psicologo_asignado = datos.email_psicologo
    db.commit()

    return {
        "mensaje": "Correo de psicólogo asignado correctamente",
        "email_asignado": usuario.email_psicologo_asignado
    }

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
        - `relacion` (string, opcional): Vínculo con el usuario. **DEBE ser exactamente uno de estos valores:** `"Familiar"`, `"Amigo"`, `"Pareja"`, `"Terapeuta"`, `"Otro"`. Por defecto es `"Familiar"`.

        **📤 Respuesta Exitosa (200 OK):**
        Devuelve el objeto completo del contacto recién creado, incluyendo su nuevo `id`.

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        - `422 Unprocessable Entity`: Se envió una `relacion` no válida (ej. "novio" en vez de "Pareja") o faltan campos obligatorios.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    nuevo_contacto = ContactoEmergencia(
        user_id=user_id,
        nombre=contacto.nombre,
        telefono=contacto.telefono,
        alias=contacto.alias,
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
    correo_super_admin = "59f1060b-269a-4965-a8d8-8b6fc5fc9adc" # ID
    
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

# ==========================================
# 5. ENDPOINTS DE RELACIONES/CONTACTOS
# ==========================================
@router.get("/contactos/relaciones", response_model=List[RelacionCat])
def obtener_tipos_relacion():
    """
    ### Obtener Catálogo de Relaciones
    Devuelve la lista de opciones permitidas para el campo 'relacion' en los contactos.
    Formato en array de objetos (id y etiqueta) para estandarizar con el Frontend.
    """
    return [
        {"id": 1, "relacion": "Familiar"},
        {"id": 2, "relacion": "Amigo"},
        {"id": 3, "relacion": "Pareja"},
        {"id": 4, "relacion": "Terapeuta"},
        {"id": 5, "relacion": "Otro"}
    ]