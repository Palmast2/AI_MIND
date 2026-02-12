from typing import Optional, Literal, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field, validator
from uuid import UUID

GeneroLiteral = Literal[
    "Mujer",
    "Hombre",
    "No binario",
    "Otro",
    "Prefiero no responder",
]

SexoLiteral = Literal[
    "Femenino",
    "Masculino",
    "Intersexual",
    "Prefiero no responder",
]

NivelEducativoLiteral = Literal[
    "Sin estudios",
    "Primaria",
    "Secundaria",
    "Bachillerato / Preparatoria",
    "Licenciatura",
    "Posgrado",
    "Prefiero no responder",
]

OcupacionLiteral = Literal[
    "Estudiante",
    "Empleado",
    "Autoempleado",
    "Profesionista independiente",
    "Ama de casa",
    "Jubilado",
    "Otro",
    "Prefiero no responder",
]

EstadoCivilLiteral = Literal[
    "Soltero/a",
    "Casado/a",
    "Unión libre",
    "Divorciado/a",
    "Viudo/a",
    "Prefiero no responder",
]

SituacionLaboralLiteral = Literal[
    "Trabajando",
    "Desempleado",
    "Estudiante",
    "Incapacidad",
    "Jubilado",
    "Prefiero no responder",
]

EstadoMexicoLiteral = Literal[
    "Aguascalientes",
    "Baja California",
    "Baja California Sur",
    "Campeche",
    "Chiapas",
    "Chihuahua",
    "Ciudad de México",
    "Coahuila",
    "Colima",
    "Durango",
    "Estado de México",
    "Guanajuato",
    "Guerrero",
    "Hidalgo",
    "Jalisco",
    "Michoacán",
    "Morelos",
    "Nayarit",
    "Nuevo León",
    "Oaxaca",
    "Puebla",
    "Querétaro",
    "Quintana Roo",
    "San Luis Potosí",
    "Sinaloa",
    "Sonora",
    "Tabasco",
    "Tamaulipas",
    "Tlaxcala",
    "Veracruz",
    "Yucatán",
    "Zacatecas",
]


class DemograficoBase(BaseModel):
    birth_year: Optional[int] = Field(default=None, ge=1925)
    genero: Optional[GeneroLiteral] = None
    sexo: Optional[SexoLiteral] = None
    nivel_educativo: Optional[NivelEducativoLiteral] = None
    ocupacion: Optional[OcupacionLiteral] = None
    estado_civil: Optional[EstadoCivilLiteral] = None
    situacion_laboral: Optional[SituacionLaboralLiteral] = None
    estado: Optional[EstadoMexicoLiteral] = None
    consentimiento_estadistico: Optional[bool] = None

    @validator("birth_year")
    def validate_birth_year(cls, value):
        if value is None:
            return value
        current_year = datetime.now(timezone.utc).year
        if value > current_year:
            raise ValueError("birth_year no puede ser mayor al anio actual")
        return value


class DemograficoCreate(DemograficoBase):
    consentimiento_estadistico: Optional[bool] = False


class DemograficoUpdate(DemograficoBase):
    pass


class DemograficoOut(DemograficoBase):
    demografico_id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class CatalogOption(BaseModel):
    id: int
    label: str


class DemograficoCatalogo(BaseModel):
    preguntas: List[CatalogOption]
    sexo: List[CatalogOption]
    genero: List[CatalogOption]
    nivel_educativo: List[CatalogOption]
    ocupacion: List[CatalogOption]
    estado_civil: List[CatalogOption]
    situacion_laboral: List[CatalogOption]
    estado: List[CatalogOption]


PREGUNTAS_DEMOGRAFICOS = [
    {"id": 1, "label": "Año de nacimiento"},
    {"id": 2, "label": "Género"},
    {"id": 3, "label": "Sexo"},
    {"id": 4, "label": "Nivel educativo"},
    {"id": 5, "label": "Ocupación"},
    {"id": 6, "label": "Estado civil"},
    {"id": 7, "label": "Situación laboral"},
    {"id": 8, "label": "Estado de residencia"},
]


def _literal_to_list(literal_values):
    return [
        {"id": index, "label": value}
        for index, value in enumerate(literal_values)
    ]


def get_demograficos_catalogo():
    return {
        "preguntas": PREGUNTAS_DEMOGRAFICOS,
        "sexo": _literal_to_list(SexoLiteral.__args__),
        "genero": _literal_to_list(GeneroLiteral.__args__),
        "nivel_educativo": _literal_to_list(NivelEducativoLiteral.__args__),
        "ocupacion": _literal_to_list(OcupacionLiteral.__args__),
        "estado_civil": _literal_to_list(EstadoCivilLiteral.__args__),
        "situacion_laboral": _literal_to_list(SituacionLaboralLiteral.__args__),
        "estado": _literal_to_list(EstadoMexicoLiteral.__args__),
    }
