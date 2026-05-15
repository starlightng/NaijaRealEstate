import logging
from typing import Any
from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

async def send_email(
    to_email: str,
    subject: str,
    body: str,
    html_body: Any = None
):
    """
    Sends an email using aiosmtplib.
    If SMTP settings are missing in .env, it logs the email to the console as a stub.
    """
    if not settings.SMTP_HOST:
        logger.info(f"[EMAIL STUB] Sending email to {to_email}\nSubject: {subject}\nBody: {body}")
        return True

    try:
        from aiosmtplib import send
        from email.message import EmailMessage

        message = EmailMessage()
        message["From"] = settings.EMAIL_FROM
        message["To"] = to_email
        message["Subject"] = subject
        message.set_content(body)

        if html_body:
            from email.mime.text import MIMEText
            msg = MIMEText(html_body, "html")
            message.add_alternative(msg)

        await send(
            message,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
        )
        return True
    except Exception as e:
        logger.error(f"Email sending failed: {e}")
        return False
