CREATE TABLE IF NOT EXISTS patrones_riesgo (
    id SERIAL PRIMARY KEY,
    patron TEXT NOT NULL,
    nivel VARCHAR(10) CHECK (nivel IN ('alto', 'medio', 'bajo')) NOT NULL
);

INSERT INTO patrones_riesgo (nivel, patron) VALUES 
('alto', 'me quiero morir'), ('alto', 'quiero morir'), ('alto', 'morirme'), 
('alto', 'me quiero suicidar'), ('alto', 'quiero suicidarme'), ('alto', 'suicidarme'), 
('alto', 'me quiero matar'), ('alto', 'matarme'), ('alto', 'me quiero autodesvivir'), 
('alto', 'quitarme la vida'), ('alto', 'ya no quiero vivir'), ('alto', 'no vale la pena vivir'), 
('alto', 'me quiero hacer daño'), ('alto', 'hacerme daño'), ('alto', 'quiero lastimarme'), 
('alto', 'quiero hacerme daño físico'), ('alto', 'autoagresión'), ('alto', 'quiero acabar con todo'), 
('alto', 'quiero terminar con todo'), ('alto', 'no quiero seguir'), ('alto', 'no quiero continuar'), 
('alto', 'no quiero estar aquí'), ('alto', 'siento que no hay salida'), ('alto', 'no hay salida'), 
('alto', 'no puedo más'), ('alto', 'no puedo soportarlo más'), ('alto', 'no tengo esperanza'), 
('alto', 'nada va a cambiar'), ('alto', 'la situación no mejorará'), ('alto', 'sentirse sin ayuda'), 
('alto', 'me siento solo'), ('alto', 'soy una carga para mi familia'), ('alto', 'soy una carga para mis amigos'), 
('alto', 'no tengo a nadie'), ('alto', 'nadie me entiende'), ('alto', 'nadie me escucha'), 
('alto', 'nadie me apoya'), ('alto', 'no tengo a nadie que me quiera'), ('alto', 'tengo una nube negra sobre mí'), 
('alto', 'Siento que no puedo respirar'), ('alto', 'Siento que me ahogo'), ('alto', 'Siento que me estoy hundiendo'), 
('alto', 'poner mis asuntos en orden'), ('alto', 'organizar mis finanzas para cuando no esté'), 
('alto', 'prepararse para la muerte'), ('alto', 'escribir una nota de suicidio'), ('alto', 'mi nota de despedida'), 
('alto', 'escribiendo cartas de despedida'), ('alto', 'quiero despedirme'), ('alto', 'adiós a todos'), 
('alto', 'me voy a encerrar'), ('alto', 'ya no me van a ver'), ('alto', 'ponerme en peligro');

INSERT INTO patrones_riesgo (nivel, patron) VALUES 
('medio', 'tristeza persistente'), ('medio', 'sensación de vacío'), ('medio', 'me siento vacío'), 
('medio', 'mucha culpa'), ('medio', 'me siento culpable'), ('medio', 'no valgo nada'), 
('medio', 'desanimado'), ('medio', 'melancolía'), ('medio', 'desaliento'), ('medio', 'autoestima baja'), 
('medio', 'agotamiento'), ('medio', 'fatiga'), ('medio', 'pérdida de energía'), ('medio', 'no tengo ganas'), 
('medio', 'desgano'), ('medio', 'me canso rápido'), ('medio', 'sin fuerzas'), ('medio', 'inmovilizado'), 
('medio', 'no puedo hacer nada'), ('medio', 'me siento abrumado'), ('medio', 'me siento agotado emocionalmente'), 
('medio', 'Ya no disfruto lo que antes me gustaba'), ('medio', 'dolor que no se va'), ('medio', 'mucho dolor de cabeza'), 
('medio', 'problemas para dormir'), ('medio', 'insomnio'), ('medio', 'duermo todo el día'), 
('medio', 'no tengo hambre'), ('medio', 'opresión en el pecho'), ('medio', 'no puedo respirar bien'), 
('medio', 'he perdido el interés'), ('medio', 'nada me hace feliz'), ('medio', 'no disfruto nada'), 
('medio', 'estoy irritable'), ('medio', 'me enojo por cualquier cosa'), ('medio', 'no me puedo concentrar'), 
('medio', 'me falla la memoria'), ('medio', 'no sé qué decidir'), ('medio', 'me siento confundido');

INSERT INTO patrones_riesgo (nivel, patron) VALUES 
('bajo', 'mi vida no es ideal'), ('bajo', 'quisiera mejorar algunas cosas'), ('bajo', 'no estoy totalmente satisfecho'), 
('bajo', 'necesito un cambio'), ('bajo', 'dar un paso más'), ('bajo', 'cambiar mi rutina'), 
('bajo', 'problemas en mi vida'), ('bajo', 'algo me falta'), ('bajo', 'no me siento pleno'), 
('bajo', 'me siento inquieto'), ('bajo', 'tengo inquietud'), ('bajo', 'estoy agitado'), 
('bajo', 'mucha incertidumbre'), ('bajo', 'me preocupa el futuro'), ('bajo', 'siento inseguridad'), 
('bajo', 'pensamientos de inseguridad'), ('bajo', 'estoy nervioso'), ('bajo', 'me siento tenso'), 
('bajo', 'estoy un poco nervioso'), ('bajo', 'mucho estrés'), ('bajo', 'me siento presionado'), 
('bajo', 'estoy en alerta'), ('bajo', 'muchas preocupaciones'), ('bajo', 'me siento agobiado'), 
('bajo', 'el ambiente me estresa'), ('bajo', 'siento que necesito un descanso');