-- Requiere extensión pgcrypto para cifrado
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Crear tabla
CREATE TABLE directrices_terapeuticas (
  directriz_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emocion TEXT NOT NULL,
  directriz TEXT NOT NULL,
  actividades_practicas TEXT,
  acciones_urgentes TEXT,
  palabras_clave BYTEA NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- IMPORTANTE:
-- Ingresar manualmente la clave de cifrado al ejecutar el script.
-- Reemplazar 'TU_CLAVE_AQUI' por la clave real.

INSERT INTO directrices_terapeuticas (
  emocion, directriz, actividades_practicas, acciones_urgentes, palabras_clave
)
VALUES
('tristeza', 'Ofrece grounding, valida la emoción y sugiere reconectar con otros.',
 'Pasear al aire libre, escribir en un diario, escuchar música emocionalmente significativa.',
 NULL,
 pgp_sym_encrypt('{"suicidio", "desesperanza", "tristeza"}', 'TU_CLAVE_AQUI')),

('ansiedad', 'Aplica respiración 4-7-8, técnicas sensoriales y evita frases alarmistas como "deberías".',
 'Respiración 4-7-8, uso de objetos sensoriales, duchas frías o cálidas.',
 NULL,
 pgp_sym_encrypt('{"pánico", "miedo", "estrés"}', 'TU_CLAVE_AQUI')),

('ira', 'Invita a la respiración consciente y redirección emocional hacia actividades seguras.',
 'Golpear una almohada, escribir sin censura, salir a correr.',
 NULL,
 pgp_sym_encrypt('{"odio", "violencia"}', 'TU_CLAVE_AQUI')),

('culpa', 'Valida sin juzgar, fomenta el autocuidado y el perdón personal.',
 'Escribir una carta de auto-perdón, practicar afirmaciones positivas, autocuidado.',
 NULL,
 pgp_sym_encrypt('{"fallé", "todo es mi culpa"}', 'TU_CLAVE_AQUI')),

('soledad', 'Sugiere actividades sociales leves, validación emocional y compañía simbólica.',
 'Unirse a comunidades en línea, hablar con un ser querido, interactuar con mascota virtual.',
 NULL,
 pgp_sym_encrypt('{"nadie", "abandonado"}', 'TU_CLAVE_AQUI')),

('frustración', 'Fomenta aceptación, reformulación cognitiva y pausas activas.',
 'Romper una hoja de papel, escuchar música, hacer estiramientos.',
 NULL,
 pgp_sym_encrypt('{"nada sirve", "ya no puedo"}', 'TU_CLAVE_AQUI')),

('miedo', 'Invita a racionalizar, centrarse en el presente y acompañamiento.',
 'Describir lo que ves a tu alrededor, ejercicios de grounding, respiración.',
 NULL,
 pgp_sym_encrypt('{"no salgas", "te van a hacer daño"}', 'TU_CLAVE_AQUI')),

('confusión', 'Ofrece validación emocional, clarificación y acompañamiento paso a paso.',
 'Hacer una lista de ideas, hablar con alguien de confianza, escribir dudas.',
 NULL,
 pgp_sym_encrypt('{"no entiendo", "estoy perdido"}', 'TU_CLAVE_AQUI')),

('agotamiento', 'Sugiere pausas, descanso, auto-compasión y validación.',
 'Tomar una siesta, beber agua, escuchar audios relajantes.',
 NULL,
 pgp_sym_encrypt('{"no puedo más", "cansado"}', 'TU_CLAVE_AQUI')),

('desesperanza', 'Refuerza logros pasados, conexión social y sentido de propósito.',
 'Recordar momentos difíciles superados, mirar fotos significativas.',
 NULL,
 pgp_sym_encrypt('{"nunca mejora", "sin salida"}', 'TU_CLAVE_AQUI')),

('vergüenza', 'Fomenta autoaceptación, apoyo social y reducción del juicio.',
 'Escribir sobre logros, hablar con alguien de confianza, mirar al espejo con afirmaciones.',
 NULL,
 pgp_sym_encrypt('{"soy un error", "no valgo"}', 'TU_CLAVE_AQUI')),

('euforia', 'Valida emoción positiva manteniendo equilibrio y enfoque realista.',
 'Respirar profundo, planificar actividades, escribir metas.',
 NULL,
 pgp_sym_encrypt('{"soy invencible", "todo es perfecto"}', 'TU_CLAVE_AQUI')),

('apatía', 'Promueve activación conductual con tareas simples y significativas.',
 'Levantarse de la cama, tomar agua, vestirse, poner música suave.',
 NULL,
 pgp_sym_encrypt('{"me da igual", "nada importa", "no quiero hacer nada"}', 'TU_CLAVE_AQUI')),

('duelo', 'Valida el proceso, sugiere rituales simbólicos y red de apoyo.',
 'Escribir una carta, crear un altar simbólico, hablar del ser querido.',
 NULL,
 pgp_sym_encrypt('{"lo perdí", "no está"}', 'TU_CLAVE_AQUI')),

('autoagresión', 'Activa red de apoyo, contacta a profesional y enfatiza cuidado inmediato.',
 NULL,
 'Quitar objetos peligrosos del entorno, llamar a alguien de confianza o profesional.',
 pgp_sym_encrypt('{"me corté", "daño", "me quiero morir"}', 'TU_CLAVE_AQUI')),

('depresión leve', 'Sugiere ejercicio leve, rutina diaria y conexión social.',
 'Hacer la cama, caminar 5 minutos, responder mensajes pendientes.',
 NULL,
 pgp_sym_encrypt('{"sin ganas", "me cuesta", "aislado"}', 'TU_CLAVE_AQUI')),

('crisis emocional / ideación suicida', 'Activa primeros auxilios emocionales, evalúa entorno y deriva a especialistas.',
 NULL,
 'No dejar a la persona sola. Contactar a profesionales o servicios de emergencia.',
 pgp_sym_encrypt('{"suicidio", "ya no quiero vivir", "me quiero morir"}', 'TU_CLAVE_AQUI')),

('pensamientos negativos', 'Utiliza registro de pensamientos, cuestionamiento de creencias y metáforas de defusión.',
 'Escribir pensamientos automáticos, usar metáforas, hablar en voz alta.',
 NULL,
 pgp_sym_encrypt('{"soy un fracaso", "nada sirve", "odio mi mente"}', 'TU_CLAVE_AQUI')),

('tolerancia al distress', 'Aplica estrategias STOP, ACCEPTS y distracción significativa con sentido.',
 'Ver una serie, caminar, dibujar, llamar a alguien.',
 NULL,
 pgp_sym_encrypt('{"me sobrepasa", "no lo aguanto"}', 'TU_CLAVE_AQUI')),

('mindfulness', 'Usa visuales lúdicos, audios breves y explica utilidad práctica con claridad.',
 'Practicar 5-4-3-2-1, meditación guiada de 3 minutos, enfocar la respiración.',
 NULL,
 pgp_sym_encrypt('{"aburrido", "no sirve", "no entiendo"}', 'TU_CLAVE_AQUI'));

-- Consulta para validar que las inserciones funcionan (requiere ingresar la clave real)
SELECT
  emocion,
  directriz,
  actividades_practicas,
  acciones_urgentes,
  pgp_sym_decrypt(palabras_clave, 'TU_CLAVE_AQUI') AS palabras
FROM directrices_terapeuticas;

-- Consulta para ver cómo se almacenan las palabras cifradas
SELECT
  emocion,
  palabras_clave
FROM directrices_terapeuticas;
