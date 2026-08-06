"""
Covers the admin settings endpoints — WhatsApp notification toggles and the
admin's own login email/password change.
"""

import pytest

from app.core.security import hash_password, verify_password
from app.depends.auth import get_current_user
from app.main import app
from app.modules.admin.service import admin_alert_targets


@pytest.fixture
def as_admin(test_admin):
    app.dependency_overrides[get_current_user] = lambda: test_admin
    yield test_admin
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_notification_settings_default_to_on(client, as_admin):
    res = await client.get("/api/admin/settings/notifications")
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["notify_pending_users"] is True
    assert body["notify_pending_properties"] is True
    # Until the admin saves their own, the env default is used and flagged.
    assert body["whatsapp_recipients"]
    assert body["using_server_default"] is True


@pytest.mark.asyncio
async def test_toggles_are_independent(client, as_admin, db):
    res = await client.patch(
        "/api/admin/settings/notifications", json={"notify_pending_properties": False}
    )
    assert res.status_code == 200, res.text
    assert res.json()["notify_pending_properties"] is False
    assert res.json()["notify_pending_users"] is True

    assert await admin_alert_targets(db, "properties") == []
    assert await admin_alert_targets(db, "users") != []


@pytest.mark.asyncio
async def test_recipients_are_saved_and_normalised(client, as_admin, db):
    res = await client.patch(
        "/api/admin/settings/notifications",
        json={"whatsapp_recipients": ["98954 15718", "+91 90000 11111"]},
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["whatsapp_recipients"] == ["+919895415718", "+919000011111"]
    assert body["using_server_default"] is False

    # Alerts now target exactly what the admin saved.
    assert await admin_alert_targets(db, "users") == [
        "+919895415718",
        "+919000011111",
    ]


@pytest.mark.asyncio
async def test_duplicate_recipients_are_collapsed(client, as_admin):
    res = await client.patch(
        "/api/admin/settings/notifications",
        json={"whatsapp_recipients": ["9895415718", "+919895415718"]},
    )
    assert res.status_code == 200, res.text
    assert res.json()["whatsapp_recipients"] == ["+919895415718"]


@pytest.mark.asyncio
async def test_invalid_recipient_is_rejected(client, as_admin):
    res = await client.patch(
        "/api/admin/settings/notifications", json={"whatsapp_recipients": ["12345"]}
    )
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_clearing_recipients_falls_back_to_server_default(client, as_admin):
    await client.patch(
        "/api/admin/settings/notifications",
        json={"whatsapp_recipients": ["+919000011111"]},
    )
    res = await client.patch(
        "/api/admin/settings/notifications", json={"whatsapp_recipients": []}
    )
    assert res.status_code == 200, res.text
    body = res.json()
    assert body["using_server_default"] is True
    assert body["whatsapp_recipients"] == ["+919895415718"]


@pytest.mark.asyncio
async def test_non_admin_cannot_read_or_write_settings(client, test_owner):
    app.dependency_overrides[get_current_user] = lambda: test_owner
    try:
        assert (await client.get("/api/admin/settings/notifications")).status_code == 403
        res = await client.patch(
            "/api/admin/settings/notifications", json={"notify_pending_users": False}
        )
        assert res.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_change_email_and_password(client, as_admin, db):
    as_admin.auth_provider_uid = hash_password("oldpassword")
    await db.flush()

    res = await client.patch(
        "/api/admin/settings/account",
        json={
            "current_password": "oldpassword",
            "new_email": "New.Admin@Letsellr.in",
            "new_password": "brandnewpass1",
        },
    )
    assert res.status_code == 200, res.text
    assert res.json()["email"] == "new.admin@letsellr.in"
    assert verify_password("brandnewpass1", as_admin.auth_provider_uid)


@pytest.mark.asyncio
async def test_wrong_current_password_is_rejected(client, as_admin, db):
    as_admin.auth_provider_uid = hash_password("oldpassword")
    await db.flush()

    res = await client.patch(
        "/api/admin/settings/account",
        json={"current_password": "nope", "new_password": "brandnewpass1"},
    )
    assert res.status_code == 401
    assert verify_password("oldpassword", as_admin.auth_provider_uid)


@pytest.mark.asyncio
async def test_email_already_taken_is_rejected(client, as_admin, db, test_owner):
    as_admin.auth_provider_uid = hash_password("oldpassword")
    await db.flush()

    res = await client.patch(
        "/api/admin/settings/account",
        json={"current_password": "oldpassword", "new_email": test_owner.email},
    )
    assert res.status_code == 409


@pytest.mark.asyncio
async def test_short_new_password_is_rejected(client, as_admin, db):
    as_admin.auth_provider_uid = hash_password("oldpassword")
    await db.flush()

    res = await client.patch(
        "/api/admin/settings/account",
        json={"current_password": "oldpassword", "new_password": "short"},
    )
    assert res.status_code == 422
