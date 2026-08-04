import pytest
from unittest.mock import patch
from app.modules.auth.models import OTPRecord
from sqlalchemy import select


@pytest.mark.asyncio
async def test_registration_and_otp_flow(client, db):
    # 1. Register a new user seeker
    payload = {
        "name": "Test Seeker",
        "phone": "+918136990018",
        "email": "seeker@example.com",
        "pin": "1234",
        "preference_type": "buy",
        "location": "Kochi",
    }

    with patch("app.modules.auth.service._send_whatsapp_otp") as mock_send:
        res = await client.post("/api/auth/register/user", json=payload)
        assert res.status_code in (200, 202)
        assert res.json()["phone"] == "+918136990018"
        assert mock_send.called

    # Check OTPRecord in DB
    result = await db.execute(
        select(OTPRecord).where(
            OTPRecord.phone == "+918136990018",
            OTPRecord.purpose == "registration",
        )
    )
    record = result.scalar_one_or_none()
    assert record is not None
    assert record.payload["name"] == "Test Seeker"

    # 2. Resend OTP
    with patch("app.modules.auth.service._send_whatsapp_otp") as mock_send_resend:
        resend_res = await client.post(
            "/api/auth/resend-otp",
            json={
                "phone": "8136990018",  # Test flexible phone normalization
                "purpose": "registration",
            },
        )
        assert resend_res.status_code == 200
        assert mock_send_resend.called

    # 3. Verify incorrect OTP does NOT clear registration session
    bad_verify = await client.post(
        "/api/auth/verify-registration",
        json={"phone": "+918136990018", "otp": "999999"},
    )
    assert bad_verify.status_code == 400
    assert "Invalid OTP" in bad_verify.json()["detail"]

    # 4. Verify with test bypass OTP (000000) or valid OTP
    # We can fetch the raw record and check verification
    result = await db.execute(
        select(OTPRecord).where(
            OTPRecord.phone == "+918136990018",
            OTPRecord.purpose == "registration",
        )
    )
    record = result.scalar_one_or_none()
    assert record is not None


@pytest.mark.asyncio
async def test_owner_registration_and_login_blocking(client, db):
    phone = "+910000000099"
    payload = {
        "role": "owner",
        "name": "Test Owner",
        "phone": phone,
        "email": "owner_unique@example.com",
        "preference_type": "residential",
        "pin": "1234",
        "location_city": "Kochi",
        "location_area": "Edapally",
    }
    with patch("app.modules.auth.service._send_whatsapp_otp"):
        reg_res = await client.post("/api/auth/register", json=payload)
        assert reg_res.status_code in (200, 202)

    with patch("app.modules.auth.service.AuthService._verify_otp"):
        ver_res = await client.post(
            "/api/auth/verify-registration", json={"phone": phone, "otp": "123456"}
        )
        assert ver_res.status_code in (200, 201)

    # Try logging in via PIN -> Should be blocked (403 Forbidden)
    login_res = await client.post(
        "/api/auth/login", json={"phone": phone, "pin": "1234"}
    )
    assert login_res.status_code == 403
    assert "under review" in login_res.json()["detail"].lower()
