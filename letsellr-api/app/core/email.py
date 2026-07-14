"""
Core: Email Service

Sends transactional emails via SMTP using aiosmtplib (async).
All email templates are defined here so they stay in one place.
"""

import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

import aiosmtplib

from app.core.config import settings

logger = logging.getLogger(__name__)


async def _send_email(to_email: str, subject: str, html_body: str) -> None:
    """Low-level async SMTP send. Raises on failure."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    await aiosmtplib.send(
        msg,
        hostname=settings.SMTP_HOST,
        port=settings.SMTP_PORT,
        username=settings.SMTP_USERNAME,
        password=settings.SMTP_PASSWORD,
        start_tls=settings.SMTP_USE_TLS,
    )
    logger.info("Email sent to %s — subject: %s", to_email, subject)


# ── Email Templates ──────────────────────────────────────────────────────────

def _otp_html(otp: str, purpose: str, expires_minutes: int) -> str:
    action = "verify your email and complete registration" if purpose == "registration" else "log in"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
                   style="background:#1a1a1a;border-radius:16px;border:1px solid #2a2a2a;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#6C63FF,#a78bfa);padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#fff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                    Letsellr
                  </h1>
                  <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                    Your trusted property platform
                  </p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="color:#d1d5db;font-size:15px;margin:0 0 24px;">
                    Hi there! Use the code below to {action}:
                  </p>
                  <!-- OTP Box -->
                  <div style="background:#111827;border:2px solid #6C63FF;border-radius:12px;
                              padding:28px;text-align:center;margin:0 0 28px;">
                    <p style="margin:0 0 8px;color:#9ca3af;font-size:12px;
                               text-transform:uppercase;letter-spacing:2px;">
                      Your OTP Code
                    </p>
                    <p style="margin:0;font-size:44px;font-weight:800;letter-spacing:10px;
                               color:#a78bfa;font-family:'Courier New',monospace;">
                      {otp}
                    </p>
                  </div>
                  <p style="color:#6b7280;font-size:13px;margin:0 0 8px;">
                    ⏱ This code expires in <strong style="color:#d1d5db;">{expires_minutes} minutes</strong>.
                  </p>
                  <p style="color:#6b7280;font-size:13px;margin:0;">
                    🔒 Never share this code with anyone. Letsellr staff will never ask for it.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#111;padding:20px 40px;border-top:1px solid #2a2a2a;">
                  <p style="margin:0;color:#4b5563;font-size:12px;text-align:center;">
                    If you didn't request this, you can safely ignore this email.
                    <br>© 2024 Letsellr. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """


async def send_otp_email(to_email: str, otp: str, purpose: str = "login") -> None:
    """Send an OTP email. purpose is 'login' or 'registration'."""
    subject_map = {
        "login": "Your Letsellr Login Code",
        "registration": "Verify Your Letsellr Account",
    }
    subject = subject_map.get(purpose, "Your Letsellr OTP Code")
    html = _otp_html(otp, purpose, settings.OTP_EXPIRE_MINUTES)
    await _send_email(to_email, subject, html)
