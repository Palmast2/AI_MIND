CREATE TABLE IF NOT EXISTS contactos_emergencia (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, 
    nombre VARCHAR(100) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    relacion VARCHAR(50),
    CONSTRAINT fk_usuario 
        FOREIGN KEY (user_id) 
        REFERENCES usuarios(user_id)
        ON DELETE CASCADE
);


-- 1. Crear la tabla de configuraciones
CREATE TABLE configuracion_sistema (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL,
    descripcion TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);