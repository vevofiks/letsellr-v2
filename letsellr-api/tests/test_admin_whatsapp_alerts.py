"""
Covers the admin WhatsApp alerts fired when an owner/agency signup or a
property listing lands in the admin approval queue.
"""

import pytest

from app.core import whatsapp
from app.core.config import settings


@pytest.fixture
def captured(monkeypatch):
    """Capture outbound WhatsApp messages instead of hitting the gateway."""
    sent: list[tuple[str, str]] = []

    async def fake_send(phone: str, message: str, *, context: str = "") -> bool:
        sent.append((phone, message))
        return True

    monkeypatch.setattr(whatsapp, "send_whatsapp_message", fake_send)
    return sent


@pytest.mark.asyncio
async def test_pending_user_alert_goes_to_admin_with_users_link(captured):
    await whatsapp.notify_admin_pending_user(
        name="Skyline Realty", role="agency", phone="+919000011111", city="Kochi"
    )

    assert len(captured) == 1
    phone, message = captured[0]
    assert phone == settings.ADMIN_WHATSAPP_NUMBERS.split(",")[0].strip()
    assert "https://app.letsellr.in/admin-platform/users" in message
    assert "Agency" in message
    assert "Skyline Realty" in message
    assert "+919000011111" in message


@pytest.mark.asyncio
async def test_pending_property_alert_goes_to_admin_with_properties_link(captured):
    await whatsapp.notify_admin_pending_property(
        title="2BHK near Metro",
        ref="PROP-AB12CD",
        category="apartment",
        city="Kochi",
        owner_name="Ravi",
        owner_role="owner",
    )

    assert len(captured) == 1
    _, message = captured[0]
    assert "https://app.letsellr.in/admin-platform/properties" in message
    assert "PROP-AB12CD" in message
    assert "2BHK near Metro" in message


@pytest.mark.asyncio
async def test_alerts_fan_out_to_every_configured_admin_number(captured, monkeypatch):
    monkeypatch.setattr(
        settings, "ADMIN_WHATSAPP_NUMBERS", "+919895415718, +919000099999"
    )

    await whatsapp.notify_admin_pending_user(
        name="Ravi", role="owner", phone="+919000022222"
    )

    assert [phone for phone, _ in captured] == ["+919895415718", "+919000099999"]


@pytest.mark.asyncio
async def test_explicit_recipients_override_the_env_default(captured):
    await whatsapp.notify_admin_pending_property(
        title="2BHK near Metro", ref="PROP-AB12CD", recipients=["+919000012345"]
    )

    assert [phone for phone, _ in captured] == ["+919000012345"]


@pytest.mark.asyncio
async def test_no_admin_numbers_configured_is_a_noop(captured, monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_WHATSAPP_NUMBERS", "")

    await whatsapp.notify_admin_pending_user(
        name="Ravi", role="owner", phone="+919000022222"
    )

    assert captured == []


def test_chat_id_normalises_indian_numbers():
    assert whatsapp.to_chat_id("+91 98954 15718") == "919895415718@c.us"
    assert whatsapp.to_chat_id("9895415718") == "919895415718@c.us"
    assert whatsapp.to_chat_id("919895415718@c.us") == "919895415718@c.us"
