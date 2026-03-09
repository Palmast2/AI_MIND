CREATE TABLE IF NOT EXISTS frases_seguras (
    id SERIAL PRIMARY KEY,
    frase TEXT NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO frases_seguras (frase, activa) VALUES
('Para asegurar tu bienestar y que recibas una atención más especializada…', TRUE),
('Si te sientes en peligro inmediato te sugiero que llames a la persona que mas confianza le tengas.', TRUE),
('Tu vida es importante para muchas personas aunque ahora no lo veas así, te sugiero que llames a una persona de confianza…', TRUE),
('Lo que sientes es totalmente válido, en estos momentos mereces apoyo real y cercano…', TRUE);