-- Crear tabla con advertencias cifradas
CREATE TABLE directrices_terapeuticas (
  directriz_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emocion TEXT NOT NULL,
  directriz TEXT NOT NULL,
  actividades_practicas TEXT,
  acciones_urgentes TEXT,
  advertencias BYTEA,
  palabras_clave BYTEA NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nota importante:
-- Reemplazar 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo' por la clave real de cifrado al ejecutar este script.

-- Insertar registros usando convert_to para preservar caracteres especiales
INSERT INTO directrices_terapeuticas (
  emocion, directriz, actividades_practicas, acciones_urgentes, advertencias, palabras_clave
)
VALUES
('tristeza', 'Ofrece grounding, valida la emoción y sugiere reconectar con otros.',
 'Pasear al aire libre, escribir en un diario, escuchar música emocionalmente significativa.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar invalidar la emoción con frases como "anímate". No presionar cambios rápidos.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"suicidio", "desesperanza", "tristeza"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('ansiedad', 'Aplica respiración 4-7-8, técnicas sensoriales y evita frases alarmistas como "deberías".',
 'Respiración 4-7-8, uso de objetos sensoriales, duchas frías o cálidas.',
 NULL,
 pgp_sym_encrypt(convert_to('No usar "deberías", evitar trivializar mindfulness, limitar interacciones para evitar dependencia.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"pánico", "miedo", "estrés"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('ira', 'Invita a la respiración consciente y redirección emocional hacia actividades seguras.',
 'Golpear una almohada, escribir sin censura, salir a correr.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar reforzar pensamientos de venganza o justificación de violencia.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"odio", "violencia"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('culpa', 'Valida sin juzgar, fomenta el autocuidado y el perdón personal.',
 'Escribir una carta de auto-perdón, practicar afirmaciones positivas, autocuidado.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar reforzar la autocrítica o ideas de castigo.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"fallé", "todo es mi culpa"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('soledad', 'Sugiere actividades sociales leves, validación emocional y compañía simbólica.',
 'Unirse a comunidades en línea, hablar con un ser querido, interactuar con mascota virtual.',
 NULL,
 pgp_sym_encrypt(convert_to('No fomentar aislamiento digital, evitar sugerencias que aumenten la desconexión real.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"nadie", "abandonado"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('frustracion', 'Fomenta aceptación, reformulación cognitiva y pausas activas.',
 'Romper una hoja de papel, escuchar música, hacer estiramientos.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar frases como "no te quejes", no minimizar el esfuerzo previo.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"nada sirve", "ya no puedo"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('miedo', 'Invita a racionalizar, centrarse en el presente y acompañamiento.',
 'Describir lo que ves a tu alrededor, ejercicios de grounding, respiración.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar exponer al miedo sin preparación; no invalidar con "no pasa nada".', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"no salgas", "te van a hacer daño"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('confusion', 'Ofrece validación emocional, clarificación y acompañamiento paso a paso.',
 'Hacer una lista de ideas, hablar con alguien de confianza, escribir dudas.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar saturar de información o decisiones inmediatas.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"no entiendo", "estoy perdido"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('agotamiento', 'Sugiere pausas, descanso, auto-compasión y validación.',
 'Tomar una siesta, beber agua, escuchar audios relajantes.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar promover exigencia o actividad excesiva en ese estado.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"no puedo más", "cansado"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('desesperanza', 'Refuerza logros pasados, conexión social y sentido de propósito.',
 'Recordar momentos difíciles superados, mirar fotos significativas.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar invalidar con frases como "todo estará bien"; requiere validación profunda.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"nunca mejora", "sin salida"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('verguenza', 'Fomenta autoaceptación, apoyo social y reducción del juicio.',
 'Escribir sobre logros, hablar con alguien de confianza, mirar al espejo con afirmaciones.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar comparaciones con otros, no reforzar juicios.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"soy un error", "no valgo"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('euforia', 'Valida emoción positiva manteniendo equilibrio y enfoque realista.',
 'Respirar profundo, planificar actividades, escribir metas.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar alimentar impulsividad o conductas riesgosas; mantener enfoque realista.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"soy invencible", "todo es perfecto"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('apatia', 'Promueve activación conductual con tareas simples y significativas.',
 'Levantarse de la cama, tomar agua, vestirse, poner música suave.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar discursos motivacionales vacíos, empezar con metas mínimas.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"me da igual", "nada importa", "no quiero hacer nada"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('duelo', 'Valida el proceso, sugiere rituales simbólicos y red de apoyo.',
 'Escribir una carta, crear un altar simbólico, hablar del ser querido.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar frases como "ya supéralo", permitir el tiempo necesario para el duelo.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"lo perdí", "no está"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('autoagresion', 'Activa red de apoyo, contacta a profesional y enfatiza cuidado inmediato.',
 NULL,
 'Quitar objetos peligrosos del entorno, llamar a alguien de confianza o profesional.',
 pgp_sym_encrypt(convert_to('Nunca validar la autoagresión, evitar ambigüedad en mensajes; intervenir con urgencia.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"me corté", "daño", "me quiero morir"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('depresion leve', 'Sugiere ejercicio leve, rutina diaria y conexión social.',
 'Hacer la cama, caminar 5 minutos, responder mensajes pendientes.',
 NULL,
 pgp_sym_encrypt(convert_to('No hacer de la gamificación el centro de la experiencia; evitar el aislamiento.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"sin ganas", "me cuesta", "aislado"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('crisis emocional / ideacion suicida', 'Activa primeros auxilios emocionales, evalúa entorno y deriva a especialistas.',
 NULL,
 'No dejar a la persona sola. Contactar a profesionales o servicios de emergencia.',
 pgp_sym_encrypt(convert_to('El bot no debe sustituir intervención profesional; activar red de apoyo.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"suicidio", "ya no quiero vivir", "me quiero morir"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('pensamientos negativos', 'Utiliza registro de pensamientos, cuestionamiento de creencias y metáforas de defusión.',
 'Escribir pensamientos automáticos, usar metáforas, hablar en voz alta.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar reforzar etiquetas negativas, evitar generalizaciones.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"soy un fracaso", "nada sirve", "odio mi mente"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('tolerancia al distress', 'Aplica estrategias STOP, ACCEPTS y distracción significativa con sentido.',
 'Ver una serie, caminar, dibujar, llamar a alguien.',
 NULL,
 pgp_sym_encrypt(convert_to('Evitar técnicas pasivas sin explicación previa; no dejar al usuario solo si hay crisis.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"me sobrepasa", "no lo aguanto"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo')),

('mindfulness', 'Usa visuales lúdicos, audios breves y explica utilidad práctica con claridad.',
 'Practicar 5-4-3-2-1, meditación guiada de 3 minutos, enfocar la respiración.',
 NULL,
 pgp_sym_encrypt(convert_to('Explicar bien su utilidad para evitar rechazo; no imponer como solución universal.', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'),
 pgp_sym_encrypt(convert_to('{"aburrido", "no sirve", "no entiendo"}', 'UTF8'), 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo'));

-- Consultas de verificación
SELECT
  emocion,
  directriz,
  actividades_practicas,
  acciones_urgentes,
  pgp_sym_decrypt(advertencias, 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo') AS advertencias,
  pgp_sym_decrypt(palabras_clave, 'fZcJQgxTVh2s3G7gnhVoF8OSqtk8zClLEwXfnIq69ueWSvOi2Z2O8fX85LDf5aunIe4NJ8ELYDNcN0S6Jomt171I4H3mqk352Qo') AS palabras_clave
FROM directrices_terapeuticas;

SELECT
  emocion,
  encode(advertencias, 'hex') AS advertencias_cifradas,
  encode(palabras_clave, 'hex') AS palabras_clave_cifradas
FROM directrices_terapeuticas;
