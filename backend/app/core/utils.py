from fastapi_jwt_auth import AuthJWT
from slowapi.util import get_remote_address
from itsdangerous import URLSafeTimedSerializer
import smtplib
from email.mime.text import MIMEText

RESET_TOKEN_EXPIRATION = 3600  # 1 hora

def get_user_id(request):
    try:
        token = request.cookies.get("access_token_cookie")
        if token:
            Authorize = AuthJWT()
            Authorize._token = token
            user_id = Authorize.get_jwt_subject()
            if user_id:
                return user_id
    except Exception:
        pass
    # Si no hay JWT, usa la IP como fallback
    return get_remote_address(request)

def generate_reset_token(email: str):
    import os
    SECRET_KEY = os.getenv("PASSWORD_RESET_SECRET_KEY")
    serializer = URLSafeTimedSerializer(SECRET_KEY)
    return serializer.dumps(email, salt="password-reset")

def verify_reset_token(token: str, expiration=RESET_TOKEN_EXPIRATION):
    import os
    SECRET_KEY = os.getenv("PASSWORD_RESET_SECRET_KEY")
    serializer = URLSafeTimedSerializer(SECRET_KEY)
    try:
        email = serializer.loads(token, salt="password-reset", max_age=expiration)
        return email
    except Exception:
        return None

def send_reset_email(email: str, token: str):
    import os
    GMAIL_USER = os.getenv("GMAIL_USER")
    GMAIL_PASS = os.getenv("GMAIL_PASS")
    reset_link = f"https://app.aimind.portablelab.work/reset-password?token={token}"
    expiracion_horas = RESET_TOKEN_EXPIRATION // 3600
    msg = MIMEText(
        f"Para cambiar tu contraseña, haz clic aquí: {reset_link}\n\n"
        f"Este enlace expirará en {expiracion_horas} hora(s). Si no solicitaste este cambio, ignora este correo."
    )
    msg["Subject"] = "Recuperación de contraseña"
    msg["From"] = "no-reply@aimind.com"
    msg["To"] = email

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        server.sendmail(msg["From"], [msg["To"]], msg.as_string())