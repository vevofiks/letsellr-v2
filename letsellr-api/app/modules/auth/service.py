"""
Module: Auth
Service — Phone+WhatsApp OTP authentication (no email, no Supabase)

Registration flow:
  1. POST /auth/register        → validate phone uniqueness, cache profile,
                                   generate OTP, send via WhatsApp
  2. POST /auth/verify-registration → verify OTP, create user, return JWT

  1. POST /auth/register/user   → seeker flow (same but role=user)
  2. POST /auth/verify-registration → same endpoint

Login flow:
  1. POST /auth/login           → check phone exists, generate OTP, send via WhatsApp
  2. POST /auth/verify-login    → verify OTP, return JWT

Admin login:
  POST /auth/admin/login        → phone + password (bcrypt)

All JWTs are self-issued (HS256, SECRET_KEY). No Supabase dependency.
"""

import logging
import random
import string
import asyncio
from datetime import UTC, datetime, timedelta

import httpx
from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_otp,
    verify_otp_hash,
    hash_password,
    verify_password,
)
from app.modules.auth.models import OTPRecord
from app.modules.auth.schemas import (
    AdminLoginRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    UserRegisterRequest,
    RegisterResponse,
    ResendOTPRequest,
    TokenResponse,
    UserPublic,
    VerifyLoginRequest,
    VerifyRegistrationRequest,
    RefreshTokenRequest,
)
from app.modules.users.models import AgencyProfile, User
from app.modules.users.repository import UserRepository

logger = logging.getLogger(__name__)

# In-memory pending registration store (keyed by phone)
_pending_registrations: dict[str, RegisterRequest] = {}
_pending_user_registrations: dict[str, UserRegisterRequest] = {}


def _generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def _normalize_phone(phone: str) -> str:
    """Strip spaces/dashes. Keep leading + if present."""
    return phone.strip().replace(" ", "").replace("-", "")


async def _get_active_session_id() -> str:
    """Fetch active session UUID from OpenWA gateway if name is configured."""
    session_target = getattr(settings, "OPENWA_SESSION_ID", "production") or "production"
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
                    if s.get("name") == session_target or s.get("status") in ("ready", "CONNECTED", "connected"):
                        return s.get("id", session_target)
                if sessions:
                    return sessions[0].get("id", session_target)
    except Exception as e:
        logger.warning("Failed to auto-resolve OpenWA session ID: %s", e)

    return session_target   


async def _send_whatsapp_otp(phone: str, otp: str, purpose: str) -> None:
    """
    Send OTP via self-hosted OpenWA Gateway with line-by-line detailed execution logging.
    """
    logger.info("=== [OTP STEP 1] Initiating WhatsApp OTP dispatch for phone='%s', purpose='%s' ===", phone, purpose)

    if not settings.OPENWA_GATEWAY_URL:
        logger.warning("[OTP STEP 1.1] OPENWA_GATEWAY_URL is not configured. Falling back to DEV MODE.")
        logger.warning("[DEV MODE] WhatsApp OTP for %s (%s): %s", phone, purpose, otp)
        return

    logger.info("[OTP STEP 2] Cleaning raw phone number string '%s'...", phone)
    clean_digits = "".join(c for c in phone if c.isdigit())
    logger.info("[OTP STEP 2.1] Extracted numeric digits: '%s' (length=%d)", clean_digits, len(clean_digits))

    if len(clean_digits) == 10:
        clean_digits = "91" + clean_digits
        logger.info("[OTP STEP 2.2] 10-digit number detected. Prepended country code '91': '%s'", clean_digits)

    chat_id = f"{clean_digits}@c.us" if "@" not in phone else phone
    logger.info("[OTP STEP 2.3] Constructed WhatsApp Chat JID chatId='%s'", chat_id)

    message = (
        f"Your Letsellr verification code is: *{otp}*\n\n"
        f"This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. "
        f"Do not share it with anyone."
    )
    logger.info("[OTP STEP 3] Prepared OTP message body: '%s'", message.replace('\n', ' '))

    logger.info("[OTP STEP 4] Resolving active OpenWA Session ID...")
    session_id = await _get_active_session_id()
    logger.info("[OTP STEP 4.1] Resolved active OpenWA session_id='%s'", session_id)

    url = f"{settings.OPENWA_GATEWAY_URL.rstrip('/')}/api/sessions/{session_id}/messages/send-text"
    logger.info("[OTP STEP 5] Constructed OpenWA API target URL='%s'", url)

    headers = {
        "X-API-Key": settings.OPENWA_API_KEY,
        "Content-Type": "application/json",
    }
    payload = {
        "chatId": chat_id,
        "text": message,
    }
    logger.info("[OTP STEP 6] Payload prepared: chatId='%s', text_len=%d", chat_id, len(message))
    logger.info("[OTP STEP 7] Dispatching HTTP POST request to OpenWA Gateway...")

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, headers=headers, json=payload)
            logger.info("[OTP STEP 8] HTTP Response Received! StatusCode=%s", resp.status_code)
            logger.info("[OTP STEP 8.1] Raw Response Body: %s", resp.text)

            resp.raise_for_status()
            logger.info("=== [OTP SUCCESS] WhatsApp OTP successfully dispatched to %s (chatId=%s, session_id=%s) ===", phone, chat_id, session_id)
    except httpx.HTTPStatusError as e:
        logger.error("[OTP ERROR] OpenWA returned HTTP Status Error %s: %s", e.response.status_code, e.response.text)
        logger.warning("[FALLBACK DEV MODE] WhatsApp OTP for %s (%s): %s", phone, purpose, otp)
    except Exception as e:
        logger.error(f"WhatsApp OTP failed to send to {phone}: {e}")


async def _trigger_crm_webhook(user: User):
    url = "https://revucrm.larahub.io/api/v1/lead-intake/0488d536-a0ec-4919-b548-345e7ee84bce"
    headers = {
        "Authorization": "Bearer 4PvdLEkkCm4EhNITsiksFY7A2EKpRhhs",
        "X-Secret-Key": "4PvdLEkkCm4EhNITsiksFY7A2EKpRhhs",
        "Content-Type": "application/json"
    }
    payload = {
        "customer_name": user.name or "New User",
        "mobile_1": user.phone,
        "preferred_locations": [user.location_city] if user.location_city else []
    }
    if user.email:
        payload["email"] = user.email
        
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=5.0)
            logger.info("CRM Webhook fired for %s, status: %s", user.phone, resp.status_code)
    except Exception as e:
        logger.error("Failed to fire CRM Webhook for %s: %s", user.phone, e)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    # ── OTP Helpers ───────────────────────────────────────────────────────────

    async def _save_otp(self, phone: str, otp: str, purpose: str) -> None:
        """Delete any existing OTP for this phone+purpose, then save new one."""
        await self.db.execute(
            delete(OTPRecord).where(
                OTPRecord.phone == phone, OTPRecord.purpose == purpose
            )
        )
        expires_at = datetime.now(UTC) + timedelta(minutes=settings.OTP_EXPIRE_MINUTES)
        record = OTPRecord(
            phone=phone,
            hashed_otp=hash_otp(otp),
            purpose=purpose,
            expires_at=expires_at,
        )
        self.db.add(record)
        await self.db.flush()

    async def _verify_otp(self, phone: str, otp: str, purpose: str) -> OTPRecord:
        """Verify OTP for a phone+purpose. Returns the record on success."""
        
        # --- TEST BACKDOOR FOR PRODUCTION TESTING ---
        if otp == "000000" and phone in ("+910000000001", "+910000000002"):
            logger.info("Test account login bypass using master PIN: %s", phone)
            # Create a dummy record just to return
            return OTPRecord(phone=phone, purpose=purpose)
            
        result = await self.db.execute(
            select(OTPRecord).where(
                OTPRecord.phone == phone,
                OTPRecord.purpose == purpose,
                OTPRecord.used == False,
            )
        )
        record = result.scalar_one_or_none()

        if not record:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No OTP found. Please request a new one.",
            )
        if record.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP has expired. Please request a new one.",
            )
        if not verify_otp_hash(otp, record.hashed_otp):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP. Please check the code and try again.",
            )

        record.used = True
        await self.db.execute(
            delete(OTPRecord).where(OTPRecord.id == record.id)
        )
        return record

    def _issue_tokens(self, user: User) -> TokenResponse:
        """Issue self-signed JWT access + refresh tokens."""
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserPublic.model_validate(user),
        )

    # ── Registration ─────────────────────────────────────────────────────────

    async def register(self, payload: RegisterRequest) -> RegisterResponse:
        if payload.role == "agency" and not payload.agency_display_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Agencies must provide an agency_display_name.",
            )

        phone = _normalize_phone(payload.phone)
        existing = await self.repo.get_by_phone(phone)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this phone number already exists. Please log in.",
            )

        otp = _generate_otp(settings.OTP_LENGTH)
        await self._save_otp(phone, otp, "registration")
        _pending_registrations[phone] = payload
        await self.db.commit()

        await _send_whatsapp_otp(phone, otp, "registration")

        logger.info("Registration OTP sent to %s (role=%s)", phone, getattr(payload, "role", "user"))
        return RegisterResponse(phone=phone)

    async def register_user(self, payload: UserRegisterRequest) -> RegisterResponse:
        phone = _normalize_phone(payload.phone)
        existing = await self.repo.get_by_phone(phone)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this phone number already exists. Please log in.",
            )

        otp = _generate_otp(settings.OTP_LENGTH)
        await self._save_otp(phone, otp, "registration")
        _pending_user_registrations[phone] = payload
        await self.db.commit()

        await _send_whatsapp_otp(phone, otp, "registration")

        logger.info("Seeker registration OTP sent to %s", phone)
        return RegisterResponse(phone=phone)

    async def verify_registration(self, payload: VerifyRegistrationRequest) -> TokenResponse:
        phone = _normalize_phone(payload.phone)

        pending = _pending_registrations.get(phone)
        pending_user = _pending_user_registrations.get(phone)

        if not pending and not pending_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration session expired or not found. Please register again.",
            )

        # Ensure we only pop after verifying, so an incorrect OTP doesn't destroy the session.
        try:
            await self._verify_otp(phone, payload.otp, "registration")
        except HTTPException:
            raise
            
        if pending:
            pending = _pending_registrations.pop(phone, None)
        if pending_user:
            pending_user = _pending_user_registrations.pop(phone, None)

        # Build user
        if pending_user:
            user = User(
                role="user",
                name=pending_user.name,
                email=pending_user.email.strip() if pending_user.email and pending_user.email.strip() else None,
                phone=phone,
                auth_provider_uid=hash_password(pending_user.pin),
                email_verified=False,
                preference_type=pending_user.preference_type,
                location_city=pending_user.location,
                location_area="N/A",
                verification_status="unverified",
                status="active",
            )
        elif pending:
            user = User(
                role=pending.role,
                name=pending.name,
                email=pending.email.strip() if pending.email and pending.email.strip() else None,
                phone=phone,
                auth_provider_uid=hash_password(pending.pin),
                email_verified=False,
                preference_type=pending.preference_type,
                location_city=pending.location_city,
                location_area=pending.location_area,
                verification_status="pending" if pending.role in ("agency", "owner") else "unverified",
                status="pending" if pending.role in ("agency", "owner") else "active",
            )

            if pending.role == "agency":
                user.agency_profile = AgencyProfile(
                    display_name=pending.agency_display_name or pending.name,
                    about=pending.agency_about or "",
                    areas_served=pending.agency_areas_served,
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration session expired.",
            )

        created = await self.repo.create(user)

        if pending and pending.role == "agency":
            from app.modules.admin.models import VerificationRequest
            req = VerificationRequest(
                user_id=created.id,
                status="pending",
                document_keys=[],
            )
            self.db.add(req)

        await self.db.commit()
        await self.db.refresh(created)
        logger.info("User created via phone OTP: phone=%s role=%s", phone, created.role)

        # Trigger CRM webhook asynchronously
        asyncio.create_task(_trigger_crm_webhook(created))

        return self._issue_tokens(created)

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, payload: LoginRequest) -> TokenResponse:
        phone = _normalize_phone(payload.phone)
        user = await self.repo.get_by_phone(phone)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this phone number. Please register first.",
            )

        if user.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact support.",
            )
        if user.verification_status in ("review_request", "pending", "unverified"):
            if user.role in ("owner", "agency"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account is currently under review. You will be able to sign in once verified.",
                )

        if not user.auth_provider_uid or not verify_password(payload.pin, user.auth_provider_uid):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or 4-digit security PIN.",
            )

        logger.info("User logged in via 4-digit PIN: phone=%s role=%s", phone, user.role)
        return self._issue_tokens(user)

    async def admin_login(self, payload: AdminLoginRequest) -> TokenResponse:
        email = payload.email.strip()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide an email address.",
            )

        user = await self.repo.get_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No administrator account found with this email address.",
            )
        if user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Account is not authorized for Administrator access.",
            )
        if user.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact support.",
            )

        if not user.auth_provider_uid or not verify_password(payload.password, user.auth_provider_uid):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password. Access denied.",
            )

        logger.info("Admin logged in: email=%s user_id=%s", email, user.id)
        return self._issue_tokens(user)

    async def verify_login(self, payload: VerifyLoginRequest) -> TokenResponse:
        phone = _normalize_phone(payload.phone)
        await self._verify_otp(phone, payload.otp, "login")

        user = await self.repo.get_by_phone(phone)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found.",
            )

        logger.info("User verified login: phone=%s", phone)
        return self._issue_tokens(user)

    # ── Resend OTP ────────────────────────────────────────────────────────────

    async def resend_otp(self, payload: ResendOTPRequest) -> MessageResponse:
        phone = _normalize_phone(payload.phone)

        if payload.purpose == "login":
            user = await self.repo.get_by_phone(phone)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No account found with this phone number.",
                )
        else:
            if phone not in _pending_registrations and phone not in _pending_user_registrations:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No pending registration found. Please register again.",
                )

        otp = _generate_otp(settings.OTP_LENGTH)
        await self._save_otp(phone, otp, payload.purpose)
        await self.db.commit()

        await _send_whatsapp_otp(phone, otp, payload.purpose)
        return MessageResponse(message="A new OTP has been sent to your WhatsApp.")

    # ── Token Refresh ─────────────────────────────────────────────────────────

    async def refresh_token(self, payload: RefreshTokenRequest) -> TokenResponse:
        """Verify our own refresh token and issue new access+refresh tokens."""
        try:
            data = decode_token(payload.refresh_token)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token. Please log in again.",
            ) from e

        if data.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type.",
            )

        user = await self.repo.get_by_id(data["sub"])
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Account not found.",
            )

        logger.info("Token refreshed for user %s", user.id)
        return self._issue_tokens(user)
