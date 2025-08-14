-- db/chat.sql 
-- This file contains SQL commands to create and modify the 'mensajes' table
ALTER TABLE mensajes
ADD COLUMN role VARCHAR(20) CHECK (role IN ('user', 'assistant')) NOT NULL DEFAULT 'user';
ALTER TABLE mensajes
ADD COLUMN created_at TIMESTAMP DEFAULT NOW();


-- Nota importante:
-- Reemplazar 'TU_CLAVE_AQUI' por la clave real de cifrado al ejecutar este script.

SELECT 
    
    user_id,
    role,
    pgp_sym_decrypt(contenido, 'TU_CLAVE_AQUI') AS contenido,
    emocion_detectada,
    modelo_utilizado,
    created_at
FROM mensajes
ORDER BY created_at DESC
LIMIT 50;