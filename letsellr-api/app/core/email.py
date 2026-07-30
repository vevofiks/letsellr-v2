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
    <body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="520" cellpadding="0" cellspacing="0"
                   style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="background:#014645;padding:32px 40px;text-align:center;">
                  <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.5px;">
                    Letsellr
                  </h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="color:#374151;font-size:15px;margin:0 0 24px;line-height:1.6;">
                    Hi there, <br><br>Use the secure code below to {action}:
                  </p>
                  <!-- OTP Box -->
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
                              padding:28px;text-align:center;margin:0 0 28px;">
                    <p style="margin:0;font-size:40px;font-weight:800;letter-spacing:10px;
                               color:#014645;font-family:'Courier New',monospace;">
                      {otp}
                    </p>
                  </div>
                  <p style="color:#64748b;font-size:14px;margin:0 0 8px;">
                    ⏱ This code expires in <strong style="color:#334155;">{expires_minutes} minutes</strong>.
                  </p>
                  <p style="color:#64748b;font-size:14px;margin:0 padding-left:5px;">
                    🔒 Never share this code with anyone. Letsellr staff will never ask for it.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#ffffff;padding:24px 40px;border-top:1px solid #f1f5f9;">
                  <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
                    If you didn't request this, you can safely ignore this email.
                    <br><br>© 2024 Letsellr. All rights reserved.
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
    try:
        await _send_email(to_email, subject, html)
    except Exception as e:
        logger.warning("SMTP delivery failed for %s: %s. [FALLBACK OTP CODE: %s]", to_email, e, otp)
