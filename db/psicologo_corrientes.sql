-- 1. Tabla para los Psicólogos del Usuario (Relación 1 a Muchos)
CREATE TABLE psicologos_usuario (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    nombre VARCHAR(100),
    alias VARCHAR(50) NOT NULL, -- Obligatorio para identificarlos rápido
    email VARCHAR(255) NOT NULL,
    CONSTRAINT fk_usuario_psicologo 
        FOREIGN KEY (user_id) 
        REFERENCES usuarios(user_id)
        ON DELETE CASCADE
);

-- 2. Tabla para el CRUD de Corrientes Filosóficas (Catálogo)
CREATE TABLE corrientes_filosoficas (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    CONSTRAINT fk_usuario_corriente
        FOREIGN KEY (user_id) 
        REFERENCES usuarios(user_id)
        ON DELETE CASCADE
);