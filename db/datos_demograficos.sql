-- =========================================================
-- Tabla: datos_demograficos_usuario
-- Descripción: Datos demográficos opcionales del usuario
-- =========================================================

CREATE TABLE IF NOT EXISTS datos_demograficos_usuario (
    demografico_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL UNIQUE,

    birth_year INT CHECK (
        birth_year BETWEEN 1925 AND EXTRACT(YEAR FROM CURRENT_DATE)
    ),

    genero VARCHAR(30) CHECK (genero IN (
        'Mujer',
        'Hombre',
        'No binario',
        'Otro',
        'Prefiero no responder'
    )),

    sexo VARCHAR(30) CHECK (sexo IN (
        'Femenino',
        'Masculino',
        'Intersexual',
        'Prefiero no responder'
    )),

    nivel_educativo VARCHAR(50) CHECK (nivel_educativo IN (
        'Sin estudios',
        'Primaria',
        'Secundaria',
        'Bachillerato / Preparatoria',
        'Licenciatura',
        'Posgrado',
        'Prefiero no responder'
    )),

    ocupacion VARCHAR(50) CHECK (ocupacion IN (
        'Estudiante',
        'Empleado',
        'Autoempleado',
        'Profesionista independiente',
        'Ama de casa',
        'Jubilado',
        'Otro',
        'Prefiero no responder'
    )),

    estado_civil VARCHAR(30) CHECK (estado_civil IN (
        'Soltero/a',
        'Casado/a',
        'Unión libre',
        'Divorciado/a',
        'Viudo/a',
        'Prefiero no responder'
    )),

    situacion_laboral VARCHAR(30) CHECK (situacion_laboral IN (
        'Trabajando',
        'Desempleado',
        'Estudiante',
        'Incapacidad',
        'Jubilado',
        'Prefiero no responder'
    )),

    estado VARCHAR(50),

    consentimiento_estadistico BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_datos_demograficos_usuario
        FOREIGN KEY (user_id)
        REFERENCES usuarios(user_id)
        ON DELETE CASCADE
);
