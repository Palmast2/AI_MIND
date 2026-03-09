import os
import aiosmtplib
from email.message import EmailMessage

from app.crud import message

async def enviar_alerta_crisis(user_id: str, mensaje_usuario: str, emocion: str, destinatario_email: str, nivel_riesgo: str):    
    """
    Envía un correo urgente usando aiosmtplib directo (sin fastapi-mail).
    Evita conflictos de dependencias con Starlette/Pydantic.
    """
    
    # 1. Configuración desde variables de entorno
    smtp_server = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("MAIL_PORT", 587))
    smtp_user = os.getenv("MAIL_USERNAME")
    smtp_password = os.getenv("MAIL_PASSWORD")
    mail_from = os.getenv("MAIL_FROM")
    #mail_to = os.getenv("MAIL_PSICOLOGO")
    mail_to = destinatario_email

    # Validación de seguridad
    if not (smtp_user and smtp_password):
        print("⚠️ Error: Faltan credenciales en el .env para enviar correos.")
        return

    # 2. Construir el mensaje
    message = EmailMessage()
    message["From"] = mail_from
    message["To"] = mail_to
    message["Subject"] = f"🚨 ALERTA DE RIESGO {nivel_riesgo.upper()} - Usuario {user_id}"

    # 3. Contenido HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; border: 1px solid #d32f2f; border-radius: 8px; overflow: hidden; }}
            .header {{ background-color: #D32F2F; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; background-color: #fff; }}
            .alert-box {{ background-color: #ffebee; border-left: 5px solid #D32F2F; padding: 15px; margin: 20px 0; }}
            .footer {{ background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠️ ALERTA DE RIESGO: {nivel_riesgo.upper()}</h1>
            </div>
            <div class="content">
                <p>Estimado Profesional,</p>
                <p>El sistema IA-MIND ha detectado un patrón de riesgo <strong>{nivel_riesgo.upper()}</strong> asociado a la emoción: <strong>{emocion}</strong>.</p>
                
                <div class="alert-box">
                    <p><strong>Usuario ID:</strong> {user_id}</p>
                    <p><strong>Mensaje del Usuario:</strong></p>
                    <p><em>"{mensaje_usuario}"</em></p>
                </div>

                <p>Se recomienda revisión inmediata.</p>
            </div>
            <div class="footer">
                <p>Mensaje automático del sistema IA-MIND.</p>
            </div>
        </div>
    </body>
    </html>
    """

    message.set_content(f"Alerta de riesgo {nivel_riesgo.upper()} detectada. Habilite HTML para ver detalles.")
    message.add_alternative(html_content, subtype='html')

    # 4. Enviar usando conexión segura (STARTTLS para Gmail)
    try:
        await aiosmtplib.send(
            message,
            hostname=smtp_server,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True # Importante para puerto 587
        )
        print(f"✅ Correo de alerta {nivel_riesgo.upper()} enviado a {mail_to}")
    except Exception as e:
        print(f"❌ Error enviando correo de alerta: {str(e)}")