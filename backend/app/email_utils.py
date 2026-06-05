import os
import ssl
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_email(subject: str, html_body: str, text_body: str = "") -> None:
    """Send an email via SMTP (Gmail by default).

    Required env vars:
      SMTP_USER       — the Gmail address used to send
      SMTP_PASSWORD   — a Gmail App Password (NOT the account password)
    Optional:
      SMTP_HOST       — default smtp.gmail.com
      SMTP_PORT       — default 587 (STARTTLS)
      REPORT_TO       — recipient; defaults to SMTP_USER
    """
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    to_addr = os.getenv("REPORT_TO", user or "")

    if not user or not password:
        raise RuntimeError("SMTP_USER / SMTP_PASSWORD environment variables are not set")
    if not to_addr:
        raise RuntimeError("REPORT_TO is not set and SMTP_USER is empty")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = user
    msg["To"] = to_addr
    if text_body:
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    context = ssl.create_default_context()
    with smtplib.SMTP(host, port, timeout=30) as server:
        server.starttls(context=context)
        server.login(user, password)
        server.sendmail(user, [to_addr], msg.as_string())
