from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from openai import OpenAI
from datetime import datetime, date
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
import re

client = OpenAI()


MAX_REPORTES_DIARIOS = 5

def contar_reportes_hoy(db: Session, user_id: str) -> int:
    """Cuenta cuántos reportes ha generado el usuario hoy."""
    stmt = text("""
        SELECT COUNT(*) 
        FROM reportes_uso
        WHERE user_id = :user_id
        AND DATE(created_at) = :today
    """)
    result = db.execute(stmt, {"user_id": user_id, "today": date.today()}).scalar()
    return result or 0

def registrar_reporte(db: Session, user_id: str):
    """Registra el uso de un reporte en la tabla reportes_uso."""
    stmt = text("""
        INSERT INTO reportes_uso (user_id, created_at)
        VALUES (:user_id, NOW())
    """)
    db.execute(stmt, {"user_id": user_id})
    db.commit()

def obtener_meses_disponibles(db: Session, user_id: str):
    stmt = text("""
        SELECT DISTINCT 
            EXTRACT(YEAR FROM created_at) AS year,
            EXTRACT(MONTH FROM created_at) AS month
        FROM mensajes
        WHERE user_id = :user_id
        ORDER BY year, month
    """)
    resultados = db.execute(stmt, {"user_id": user_id}).mappings().all()
    return [{"year": int(r["year"]), "month": int(r["month"])} for r in resultados]

def obtener_historial_mes(db: Session, user_id: str, year: int, month: int):
    stmt = text("""
        SELECT role, pgp_sym_decrypt(contenido, :key) AS contenido, created_at
        FROM mensajes
        WHERE user_id = :user_id
        AND EXTRACT(YEAR FROM created_at) = :year
        AND EXTRACT(MONTH FROM created_at) = :month
        ORDER BY created_at ASC
    """)
    resultados = db.execute(stmt, {
        "user_id": user_id,
        "year": year,
        "month": month,
        "key": os.getenv("PGP_KEY")
    }).mappings().all()
    return resultados

def obtener_directrices(db: Session):
    stmt = text("""
        SELECT 
            emocion, 
            directriz, 
            actividades_practicas, 
            acciones_urgentes, 
            pgp_sym_decrypt(advertencias, :key) AS advertencias,
            pgp_sym_decrypt(palabras_clave, :key) AS palabras_clave
        FROM directrices_terapeuticas
    """)
    resultados = db.execute(stmt, {"key": os.getenv("PGP_KEY")}).mappings().all()
    directrices = []
    for r in resultados:
        directrices.append({
            "emocion": r["emocion"],
            "directriz": r["directriz"],
            "actividades": r["actividades_practicas"],
            "acciones_urgentes": r["acciones_urgentes"],
            "advertencias": r["advertencias"],
            "palabras_clave": r["palabras_clave"]
        })
    return directrices

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
            paragraphs.append(Paragraph(f"<b>{line[3:]}</b>", styles["Heading2"]))

        elif line.startswith("# "):
            paragraphs.append(Paragraph(f"<b>{line[2:]}</b>", styles["Heading1"]))

        # Negritas
        else:
            line_html = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", line)
            paragraphs.append(Paragraph(line_html, styles["BodyText"]))

    return paragraphs

def generar_reporte_pdf(db: Session, user_id: str, year: int = None, month: int = None, output_path="reportes/"):
    # Obtener historial de mensajes
    if year and month:
        stmt = text("""
            SELECT role, pgp_sym_decrypt(contenido, :key) AS contenido, created_at
            FROM mensajes
            WHERE user_id = :user_id
              AND EXTRACT(YEAR FROM created_at) = :year
              AND EXTRACT(MONTH FROM created_at) = :month
            ORDER BY created_at ASC
        """)
        resultados = db.execute(stmt, {
            "user_id": user_id,
            "year": year,
            "month": month,
            "key": os.getenv("PGP_KEY")
        }).mappings().all()
    else:
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

    # --- Obtener eventos críticos del mes si year y month están definidos ---
    eventos_criticos_texto = ""
    if year and month:
        stmt_eventos = text("""
            SELECT tipo_evento, descripcion, fecha, nivel_alerta
            FROM eventos_criticos
            WHERE user_id = :user_id
              AND EXTRACT(YEAR FROM fecha) = :year
              AND EXTRACT(MONTH FROM fecha) = :month
            ORDER BY fecha ASC
        """)
        eventos = db.execute(stmt_eventos, {"user_id": user_id, "year": year, "month": month}).mappings().all()
        if eventos:
            eventos_criticos_texto = "\n".join(
                [f"- [{e['fecha']:%Y-%m-%d %H:%M}] {e['tipo_evento']} ({e['nivel_alerta']}): {e['descripcion']}" for e in eventos]
            )
        else:
            eventos_criticos_texto = "No se registraron eventos críticos en este mes."
    # --- Directrices terapéuticas ---
    directrices = obtener_directrices(db)
    directrices_texto = "\n".join(
        [f"- Emoción: {d['emocion']}\n"
         f"  Directriz: {d['directriz']}\n"
         f"  Actividades: {d['actividades']}\n"
         f"  Acciones urgentes: {d['acciones_urgentes']}\n"
         f"  Advertencias: {d['advertencias']}\n"
         for d in directrices]
    )

    # Enviar a IA para análisis
    prompt = f"""
Eres un psicólogo profesional. Se te da el historial de un chat entre un usuario y un asistente.
Empieza directamente con las secciones solicitadas.
No incluyas títulos generales como "Reporte Preliminar".
Antes de generar las secciones de Posibles Problemas o Trastornos y Recomendaciones Iniciales,
usa estas directrices terapéuticas como guía:
{directrices_texto}
Tu tarea es generar un reporte preliminar en Markdown con:


# Emociones Predominantes del Mes
- Resume las emociones principales detectadas en este periodo.

# Emociones Detectadas (del mes seleccionado hasta la actualidad)
- Detallar emociones con ejemplos.

# Eventos Críticos del Mes
{eventos_criticos_texto}

# Posibles Problemas o Trastornos
- Señalar posibles problemas usando las directrices proporcionadas.

# Recomendaciones Iniciales
- Sugerir recomendaciones iniciales usando las directrices proporcionadas.

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
    # Limpiar encabezados duplicados que la IA pueda generar
    analisis_md = re.sub(r"(?i)^#* *reporte preliminar.*$", "", analisis_md, flags=re.MULTILINE).strip()

    # Crear PDF
    os.makedirs(output_path, exist_ok=True)
    if year and month:
        file_name = f"{output_path}reporte_{user_id}_{year}_{month}_{datetime.now():%Y%m%d_%H%M}.pdf"
    else:
        file_name = f"{output_path}reporte_{user_id}_{datetime.now():%Y%m%d_%H%M}.pdf"

    doc = SimpleDocTemplate(file_name, pagesize=A4)
    styles = getSampleStyleSheet()
    elements = []

    # Título principal
    elements.append(Paragraph("Reporte Preliminar de Conversación", styles["Title"]))
    elements.append(Spacer(1, 20))

    # Datos generales
    elements.append(Paragraph(f"Fecha de generación: {datetime.now():%Y-%m-%d %H:%M}", styles["Normal"]))
    if year and month:
        elements.append(Paragraph(f"Periodo analizado: {year}-{month:02d}", styles["Normal"]))
    else:
        elements.append(Paragraph("Periodo analizado: Todo el historial", styles["Normal"]))
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
