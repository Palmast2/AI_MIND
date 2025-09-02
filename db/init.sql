CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE usuarios (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email BYTEA NOT NULL, -- cifrado con pgp_sym_encrypt
  password_hash TEXT NOT NULL, -- bcrypt
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_login TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  login_attempts INT DEFAULT 0
);

CREATE TABLE sesiones (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(user_id),
  token TEXT NOT NULL,
  expira_en TIMESTAMP,
  dispositivo TEXT
);

CREATE TABLE mensajes (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(user_id),
  anonymous_id UUID,
  contenido BYTEA,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  emocion_detectada TEXT,
  modelo_utilizado TEXT,
  consentimiento_usuario BOOLEAN
);

CREATE TABLE analisis_ia (
  analisis_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES mensajes(message_id),
  tipo_modelo TEXT,
  resultado JSON,
  fecha_procesamiento TIMESTAMP
);

CREATE TABLE preferencias_usuario (
  preferencia_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(user_id),
  tipo TEXT,
  valor TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE historial_emociones (
  registro_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(user_id),
  emocion TEXT,
  score FLOAT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE backups (
  backup_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  checksum TEXT
);

CREATE TABLE eventos_criticos (
  evento_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES usuarios(user_id),
  message_id UUID REFERENCES mensajes(message_id),
  tipo_evento TEXT,
  descripcion TEXT,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nivel_alerta TEXT,
  atendido BOOLEAN
);
