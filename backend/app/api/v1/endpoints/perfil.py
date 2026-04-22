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
from app.models.psicologos import PsicologoUsuario # Importa tu nuevo modelo
from app.models.corrientes import CorrienteFilosofica # Importa el modelo de corrientes
router = APIRouter()

# ==========================================
# 1. ESQUEMAS DE VALIDACIÓN (Pydantic)
# ==========================================

# --- Esquemas Psicólogos ---
class PsicologoCreate(BaseModel):
    nombre: Optional[str] = None
    alias: str = Field(..., description="Alias para identificarlo rápido (ej. 'Doc Principal')")
    email: EmailStr

class PsicologoUpdate(BaseModel):
    nombre: Optional[str] = None
    alias: Optional[str] = None
    email: Optional[EmailStr] = None

class PsicologoResponse(PsicologoCreate):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True

# --- Esquemas Contactos ---
class ContactoCreate(BaseModel):
    nombre: str
    telefono: str = Field(..., regex=r"^[0-9]{10}$", description="Debe ser un número de 10 dígitos")
    alias: Optional[str] = None
    relacion: Optional[Literal["Familiar", "Amigo", "Pareja", "Otro"]] = "Familiar"

class ContactoUpdate(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = Field(None, regex=r"^[0-9]{10}$", description="Debe ser un número de 10 dígitos")
    alias: Optional[str] = None
    relacion: Optional[Literal["Familiar", "Amigo", "Pareja", "Otro"]] = None

class ContactoResponse(ContactoCreate):
    id: int
    class Config:
            orm_mode = True        
            from_attributes = True  

# --- Esquemas Configuración y Relaciones ---
class EmailGlobalUpdate(BaseModel):
    email_global: EmailStr

class RelacionCat(BaseModel):
    id: int
    relacion: str

# --- Esquemas Corrientes Filosóficas ---
class CorrienteCreate(BaseModel):
    nombre: str

class CorrienteResponse(CorrienteCreate):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True
# ==========================================
# 2. ENDPOINTS DE PSICÓLOGO
# ==========================================

@router.post("/psicologos", response_model=PsicologoResponse)
def agregar_psicologo(
    datos: PsicologoCreate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Agregar Psicólogo
        Añade un nuevo psicólogo a la red del usuario. Permite tener múltiples terapeutas registrados.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Request Body (JSON):**
        - `nombre` (string, opcional): Nombre completo del especialista.
        - `alias` (string, requerido): Un apodo para identificarlo en la app (Ej. "Doc Principal", "Terapeuta Pareja").
        - `email` (string, requerido): Correo al que se enviarán las alertas de crisis.

        **📤 Respuesta Exitosa (200 OK):**
        Devuelve el objeto completo del psicólogo recién creado, incluyendo su nuevo `id` de base de datos.

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        - `422 Unprocessable Entity`: Formato de correo inválido o falta el alias.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    nuevo_psicologo = PsicologoUsuario(
        user_id=user_id,
        nombre=datos.nombre,
        alias=datos.alias,
        email=datos.email
    )
    db.add(nuevo_psicologo)
    db.commit()
    db.refresh(nuevo_psicologo)
    return nuevo_psicologo


@router.get("/psicologos", response_model=List[PsicologoResponse])
def listar_psicologos(
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Listar Psicólogos
        Devuelve la lista de todos los psicólogos registrados por el usuario actual. 
        En caso de una crisis, el sistema enviará correos de alerta a **todos** los psicólogos de esta lista.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` (No requiere CSRF por ser petición GET).

        **📤 Respuesta Exitosa (200 OK):**
        Un array de objetos con los psicólogos. Si no tiene ninguno registrado, devuelve un array vacío `[]`.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    return db.query(PsicologoUsuario).filter(PsicologoUsuario.user_id == user_id).all()


@router.get("/psicologos/{psicologo_id}", response_model=PsicologoResponse)
def obtener_psicologo_por_id(
    psicologo_id: int,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Obtener Psicólogo por ID
        Devuelve los detalles de un psicólogo específico asociado al usuario.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` (No requiere CSRF).

        **📤 Respuesta Exitosa (200 OK):**
        El objeto JSON con los detalles del psicólogo.

        **❌ Posibles Errores:**
        - `404 Not Found`: Si el psicólogo no existe o no le pertenece al usuario autenticado.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    psicologo = db.query(PsicologoUsuario).filter(
        PsicologoUsuario.id == psicologo_id, 
        PsicologoUsuario.user_id == user_id
    ).first()
    
    if not psicologo:
        raise HTTPException(status_code=404, detail="Psicólogo no encontrado")
    return psicologo


@router.put("/psicologos/{psicologo_id}", response_model=PsicologoResponse)
def actualizar_psicologo(
    psicologo_id: int,
    datos: PsicologoUpdate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Actualizar Psicólogo
        Modifica los datos (nombre, alias, correo) de un psicólogo existente. Solo se actualizarán los campos enviados en la petición.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Path Parameter:**
        - `psicologo_id` (integer): ID del psicólogo a editar.

        **📤 Respuesta Exitosa (200 OK):**
        Devuelve el objeto actualizado.
        
        **❌ Posibles Errores:**
        - `404 Not Found`: Si el psicólogo no existe.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    psicologo = db.query(PsicologoUsuario).filter(
        PsicologoUsuario.id == psicologo_id, 
        PsicologoUsuario.user_id == user_id
    ).first()
    
    if not psicologo:
        raise HTTPException(status_code=404, detail="Psicólogo no encontrado")

    update_data = datos.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(psicologo, key, value)

    db.commit()
    db.refresh(psicologo)
    return psicologo


@router.delete("/psicologos/{psicologo_id}")
def eliminar_psicologo(
    psicologo_id: int,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Eliminar Psicólogo
        Borra a un psicólogo de la cuenta del usuario. Si se borran todos, las alertas futuras se enviarán al correo global del sistema.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📤 Respuesta Exitosa (200 OK):**
        ```json
        { "mensaje": "Psicólogo eliminado exitosamente" }
        ```
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()
    
    psicologo = db.query(PsicologoUsuario).filter(
        PsicologoUsuario.id == psicologo_id, 
        PsicologoUsuario.user_id == user_id
    ).first()
    
    if not psicologo:
        raise HTTPException(status_code=404, detail="Psicólogo no encontrado")

    db.delete(psicologo)
    db.commit()
    return {"mensaje": "Psicólogo eliminado exitosamente"}

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
        ### Obtener Red de Apoyo (Contactos Personales + Sistema)
        Devuelve la lista de contactos de emergencia registrados por el usuario, 
        e inyecta automáticamente la línea de ayuda nacional por defecto al final de la lista.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` (No requiere CSRF por ser petición GET).

        **📤 Respuesta Exitosa (200 OK):**
        Una lista (Array) de objetos de contactos. 
        *(Nota: Aunque el usuario no tenga contactos propios registrados, el array siempre devolverá al menos los contactos fijos del sistema).*

        **⚠️ NOTA IMPORTANTE PARA FRONTEND:**
        Los contactos de sistema (ej. Línea de la Vida) siempre tendrán un **`id` negativo (ej. `-1`)**. 
        El Frontend DEBE evaluar si `id < 0` para ocultar o deshabilitar los botones de "Editar" y "Eliminar" en la interfaz.

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    contactos = db.query(ContactoEmergencia).filter(ContactoEmergencia.user_id == user_id).all()
    # 2. Convertimos los objetos de BD a diccionarios
    lista_final = []
    for c in contactos:
        lista_final.append({
            "id": c.id,
            "nombre": c.nombre,
            "telefono": c.telefono,
            "alias": c.alias,
            "relacion": c.relacion
        })
    # 3. Inyectamos los contactos de sistema (con IDs negativos para diferenciarlos)
    lista_final.append({
        "id": -1,
        "nombre": "Línea de la Vida (Nacional)",
        "telefono": "8009112000",
        "alias": "Ayuda Psicológica",
        "relacion": "Otro"
    })
    return lista_final

@router.put("/contactos/{contacto_id}", response_model=ContactoResponse)
def actualizar_contacto(
    contacto_id: int,
    contacto: ContactoUpdate,
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Actualizar Contacto de Emergencia
        Actualiza un contacto específico de la red de apoyo del usuario.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Path Parameter:**
        - `contacto_id` (integer, requerido): El ID único del contacto a actualizar.

        **📥 Request Body (JSON):**
        - Campos opcionales: `nombre`, `telefono`, `alias`, `relacion`.

        **📤 Respuesta Exitosa (200 OK):**
        Devuelve el objeto completo del contacto actualizado.

        **❌ Posibles Errores:**
        - `401 Unauthorized`: Token faltante o expirado.
        - `404 Not Found`: El contacto no existe o no pertenece al usuario autenticado.
        - `422 Unprocessable Entity`: Datos con formato invalido.
        """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    contacto_db = db.query(ContactoEmergencia).filter(
        ContactoEmergencia.id == contacto_id,
        ContactoEmergencia.user_id == user_id
    ).first()

    if not contacto_db:
        raise HTTPException(status_code=404, detail="Contacto no encontrado")

    datos = contacto.dict(exclude_unset=True)
    for campo, valor in datos.items():
        setattr(contacto_db, campo, valor)

    db.commit()
    db.refresh(contacto_db)

    return contacto_db


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
        {"id": 4, "relacion": "Otro"}
    ]


# ==========================================
# 6. ENDPOINTS DE CORRIENTES FILOSÓFICAS
# ==========================================

@router.post("/corrientes", response_model=CorrienteResponse)
def crear_corriente(
    datos: CorrienteCreate, 
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Crear Corriente Filosófica
        Añade una corriente filosófica a las preferencias del usuario actual.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.

        **📥 Request Body:**
        - `nombre` (string, requerido): Nombre de la corriente (Ej. "Estoicismo", "Existencialismo").
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    from app.models.corrientes import CorrienteFilosofica
    nueva_corriente = CorrienteFilosofica(user_id=user_id, nombre=datos.nombre)
    db.add(nueva_corriente)
    db.commit()
    db.refresh(nueva_corriente)
    return nueva_corriente


@router.get("/corrientes", response_model=List[CorrienteResponse])
def listar_corrientes(
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Listar Corrientes Filosóficas del Usuario
        Devuelve la lista de corrientes filosóficas preferidas por el usuario actual.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie`
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    from app.models.corrientes import CorrienteFilosofica
    return db.query(CorrienteFilosofica).filter(CorrienteFilosofica.user_id == user_id).all()


@router.put("/corrientes/{corriente_id}", response_model=CorrienteResponse)
def actualizar_corriente(
    corriente_id: int, 
    datos: CorrienteCreate, 
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Actualizar Corriente Filosófica
        Modifica el nombre de una corriente en la lista del usuario.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    from app.models.corrientes import CorrienteFilosofica
    corriente = db.query(CorrienteFilosofica).filter(
        CorrienteFilosofica.id == corriente_id,
        CorrienteFilosofica.user_id == user_id
    ).first()
    
    if not corriente:
        raise HTTPException(status_code=404, detail="Corriente no encontrada o no pertenece al usuario")
    
    corriente.nombre = datos.nombre
    db.commit()
    db.refresh(corriente)
    return corriente


@router.delete("/corrientes/{corriente_id}")
def eliminar_corriente(
    corriente_id: int, 
    Authorize: AuthJWT = Depends(),
    db: Session = Depends(get_db)
):
    """
        ### Eliminar Corriente Filosófica
        Borra una corriente de las preferencias del usuario.

        **🔒 Requiere Autenticación:**
        - Cookie `access_token_cookie` y Header `X-CSRF-TOKEN`.
    """
    Authorize.jwt_required()
    user_id = Authorize.get_jwt_subject()

    from app.models.corrientes import CorrienteFilosofica
    corriente = db.query(CorrienteFilosofica).filter(
        CorrienteFilosofica.id == corriente_id,
        CorrienteFilosofica.user_id == user_id
    ).first()
    
    if not corriente:
        raise HTTPException(status_code=404, detail="Corriente no encontrada o no pertenece al usuario")
    
    db.delete(corriente)
    db.commit()
    return {"mensaje": "Corriente eliminada exitosamente"}