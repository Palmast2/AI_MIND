import random

# Lista validada (simulada por ahora)
FRASES_CONTENCION = [
    "Entiendo que estás pasando por un momento muy difícil. Respira profundo, estoy aquí contigo.",
    "Tu dolor es válido, pero no tienes que enfrentarlo solo. Vamos a buscar apoyo.",
    "Sé que ahora todo parece oscuro, pero este momento pasará. Por favor, mantente a salvo.",
    "Eres importante. Por favor, lee los contactos que te muestro abajo, hay gente que quiere ayudarte."
]

def obtener_frase_segura():
    """Devuelve una frase aleatoria validada para crisis."""
    return random.choice(FRASES_CONTENCION)