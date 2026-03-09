CREATE TABLE IF NOT EXISTS frases_seguras (
    id SERIAL PRIMARY KEY,
    frase TEXT NOT NULL,
    nivel_riesgo VARCHAR(10) NOT NULL CHECK (nivel_riesgo IN ('alto', 'medio', 'bajo')),
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO frases_seguras (frase, nivel_riesgo) VALUES
('Para asegurar tu bienestar y que recibas una atención más especializada…', 'alto'),
('Si te sientes en peligro inmediato te sugiero que llames a la persona que mas confianza le tengas.', 'alto'),
('Tu vida es importante para muchas personas aunque ahora no lo veas así, te sugiero que llames a una persona de confianza…', 'alto'),
('Lo que sientes es totalmente válido, en estos momentos mereces apoyo real y cercano…', 'alto'),
('No tienes por que atravesar esto tú solo…', 'medio'),
('Lo que estás compartiendo sugiere que estás pasando por una situación delicada…', 'medio'),
('Estoy notando que esto que te está pasando es muy difícil para ti…', 'bajo'),
('Tu bienestar es muy importante, y queremos asegurarnos de que recibas el apoyo adecuado…', 'bajo');