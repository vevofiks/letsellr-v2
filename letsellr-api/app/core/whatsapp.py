"""
Core: WhatsApp Service

Thin wrapper around the self-hosted OpenWA Gateway. Everything that sends a
WhatsApp message (OTPs, admin alerts) goes through `send_whatsapp_message`
so session resolution and phone normalisation live in one place.

Admin alert helpers are here too, next to the transport, mirroring how
`core/email.py` keeps its templates alongside `_send_email`.
"""

import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def normalize_whatsapp_number(raw: str) -> str:
    """
    Normalise a typed number to E.164 (`+919895415718`).

    Bare 10-digit numbers are assumed Indian. Raises ValueError on anything
    that can't be a phone number so the API can reject it with a clear message.
    """
    digits = "".join(c for c in (raw or "") if c.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    if not 10 <= len(digits) <= 15:
        raise ValueError(f"'{raw}' is not a valid phone number.")
    return f"+{digits}"


def to_chat_id(phone: str) -> str:
    """Convert a phone number into an OpenWA chat JID (`<digits>@c.us`)."""
    if "@" in phone:
        return phone
    digits = "".join(c for c in phone if c.isdigit())
    if len(digits) == 10:
        digits = "91" + digits
    return f"{digits}@c.us"


async def get_active_session_id() -> str:
    """Fetch active session UUID from OpenWA gateway if a name is configured."""
    session_target = (
        getattr(settings, "OPENWA_SESSION_ID", "production") or "production"
    )
    if "-" in session_target and len(session_target) > 30:
        return session_target

    try:
        url = f"{settings.OPENWA_GATEWAY_URL.rstrip('/')}/api/sessions"
        headers = {"X-API-Key": settings.OPENWA_API_KEY}
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                sessions = resp.json()
                for s in sessions:
                    if s.get("name") == session_target or s.get("status") in (
                        "ready",
                        "CONNECTED",
                        "connected",
                    ):
                        return s.get("id", session_target)
                if sessions:
                    return sessions[0].get("id", session_target)
    except Exception as e:
        logger.warning("Failed to auto-resolve OpenWA session ID: %s", e)

    return session_target


async def send_whatsapp_message(phone: str, message: str, *, context: str = "") -> bool:
    """
    Send a plain-text WhatsApp message via the OpenWA Gateway.

    Never raises — returns True on success, False otherwise, so callers can
    fire this off without risking the request that triggered it.
    """
    label = context or "message"

    if not settings.OPENWA_GATEWAY_URL:
        logger.warning(
            "[WHATSAPP] OPENWA_GATEWAY_URL not configured — %s to %s not sent.\n%s",
            label,
            phone,
            message,
        )
        return False

    chat_id = to_chat_id(phone)
    session_id = await get_active_session_id()
    url = f"{settings.OPENWA_GATEWAY_URL.rstrip('/')}/api/sessions/{session_id}/messages/send-text"
    headers = {
        "X-API-Key": settings.OPENWA_API_KEY,
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                url, headers=headers, json={"chatId": chat_id, "text": message}
            )
            resp.raise_for_status()
            logger.info(
                "[WHATSAPP] Sent %s to %s (chatId=%s, session_id=%s)",
                label,
                phone,
                chat_id,
                session_id,
            )
            return True
    except httpx.HTTPStatusError as e:
        logger.error(
            "[WHATSAPP] OpenWA returned HTTP %s for %s to %s: %s",
            e.response.status_code,
            label,
            phone,
            e.response.text,
        )
    except Exception as e:
        logger.error("[WHATSAPP] Failed to send %s to %s: %s", label, phone, e)
    return False


# ── Admin alerts ─────────────────────────────────────────────────────────────


def admin_whatsapp_numbers() -> list[str]:
    """Server-default alert recipients, from the comma-separated env value."""
    raw = settings.ADMIN_WHATSAPP_NUMBERS or ""
    return [n.strip() for n in raw.split(",") if n.strip()]


async def _notify_admins(
    message: str, context: str, recipients: list[str] | None = None
) -> None:
    numbers = recipients if recipients is not None else admin_whatsapp_numbers()
    if not numbers:
        logger.warning("[WHATSAPP] No alert recipients — skipping %s.", context)
        return
    for number in numbers:
        await send_whatsapp_message(number, message, context=context)


async def notify_admin_pending_user(
    *,
    name: str | None,
    role: str,
    phone: str,
    city: str | None = None,
    recipients: list[str] | None = None,
) -> None:
    """Alert admins that a new owner/agency signup is awaiting approval."""
    role_label = "Agency" if role == "agency" else "Owner"
    lines = [
        "*Letsellr — New account pending approval*",
        "",
        f"Type: {role_label}",
        f"Name: {name or 'N/A'}",
        f"Phone: {phone}",
    ]
    if city:
        lines.append(f"City: {city}")
    lines += [
        "",
        "Review & approve here:",
        f"{settings.ADMIN_PANEL_URL.rstrip('/')}/users",
    ]
    await _notify_admins("\n".join(lines), "pending-user alert", recipients)


async def notify_admin_pending_property(
    *,
    title: str | None,
    ref: str | None,
    category: str | None = None,
    city: str | None = None,
    owner_name: str | None = None,
    owner_role: str | None = None,
    recipients: list[str] | None = None,
) -> None:
    """Alert admins that a new listing is sitting in the review queue."""
    lines = [
        "*Letsellr — New property pending review*",
        "",
        f"Title: {title or 'Untitled listing'}",
    ]
    if ref:
        lines.append(f"Ref: {ref}")
    if category:
        lines.append(f"Category: {category}")
    if city:
        lines.append(f"City: {city}")
    if owner_name or owner_role:
        owner_label = owner_name or "N/A"
        if owner_role:
            owner_label = f"{owner_label} ({owner_role})"
        lines.append(f"Listed by: {owner_label}")
    lines += [
        "",
        "Review & approve here:",
        f"{settings.ADMIN_PANEL_URL.rstrip('/')}/properties",
    ]
    await _notify_admins("\n".join(lines), "pending-property alert", recipients)
