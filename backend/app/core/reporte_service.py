from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from openai import OpenAI
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import re

client = OpenAI()

def convertir_markdown_a_paragraphs(md_text, styles):
    """
    Convierte Markdown básico a una lista de Paragraphs de reportlab,
    respetando saltos de línea y espaciado.
    """
    paragraphs = []
    lines = md_text.split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            paragraphs.append(Spacer(1, 10))
            continue

        # Encabezados
        if line.startswith("## "):
            paragraphs.append(Paragraph(line[3:], styles["Heading2"]))
        elif line.startswith("# "):
            paragraphs.append(Paragraph(line[2:], styles["Heading1"]))
        # Negritas
        else:
            line_html = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", line)
            paragraphs.append(Paragraph(line_html, styles["BodyText"]))

    return paragraphs

def generar_reporte_pdf(db: Session, user_id: str, output_path="reportes/"):
    # Obtener historial de mensajes
    stmt = text("""
        SELECT role, pgp_sym_decrypt(contenido, :key) AS contenido, created_at
        FROM mensajes
        WHERE user_id = :user_id
        ORDER BY created_at ASC
    """)
    resultados = db.execute(stmt, {
        "user_id": user_id,
        "key": os.getenv("PGP_KEY")
    }).mappings().all()

    if not resultados:
        return None

    historial_texto = "\n".join(
        [f"[{r['created_at']:%Y-%m-%d %H:%M}] {r['role']}: {r['contenido']}" for r in resultados]
    )

    # Enviar a IA para análisis
    prompt = f"""
Eres un psicólogo profesional. Se te da el historial de un chat entre un usuario y un asistente.
Tu tarea es generar un reporte preliminar en Markdown con:

# Emociones Detectadas
- Detallar emociones

# Posibles Problemas o Trastornos
- Señalar posibles problemas

# Recomendaciones Iniciales
- Sugerencias iniciales

# Nota Aclaratoria
- Incluir nota de que esto no es diagnóstico

Historial:
{historial_texto}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Eres un psicólogo clínico redactando un reporte preliminar."},
            {"role": "user", "content": prompt}
        ]
    )
    analisis_md = response.choices[0].message.content

    # Crear PDF
    os.makedirs(output_path, exist_ok=True)
    file_name = f"{output_path}reporte_{user_id}_{datetime.now():%Y%m%d_%H%M}.pdf"

    doc = SimpleDocTemplate(file_name, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Título principal
    elements.append(Paragraph("Reporte Preliminar de Conversación", styles["Title"]))
    elements.append(Spacer(1, 20))

    # Datos generales
    elements.append(Paragraph(f"Usuario: {user_id}", styles["Normal"]))
    elements.append(Paragraph(f"Fecha de generación: {datetime.now():%Y-%m-%d %H:%M}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    # Convertir Markdown a Paragraphs respetando saltos
    elements.extend(convertir_markdown_a_paragraphs(analisis_md, styles))
    elements.append(Spacer(1, 20))

    # Nota final
    elements.append(Paragraph(
        "Este reporte es solo un apoyo preliminar basado en mensajes. "
        "No constituye un diagnóstico médico ni psicológico. Se recomienda la "
        "evaluación directa por un profesional.",
        styles["Italic"]
    ))

    doc.build(elements)
    return file_name
