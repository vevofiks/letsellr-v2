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


async def _send_whatsapp_otp(phone: str, otp: str, purpose: str) -> None:
    """
    Send OTP via WhatsApp Cloud API (Meta Graph API).
    Requires WHATSAPP_API_TOKEN and WHATSAPP_PLATFORM_NUMBER in settings.

    Falls back to logging the OTP if no API token is configured (dev mode).
    """
    if not settings.WHATSAPP_API_TOKEN or not settings.WHATSAPP_PLATFORM_NUMBER:
        logger.warning(
            "[DEV MODE] WhatsApp OTP for %s (%s): %s", phone, purpose, otp
        )
        return

    action = "registration" if purpose == "registration" else "login"
    message = (
        f"Your Letsellr verification code is: *{otp}*\n\n"
        f"This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. "
        f"Do not share it with anyone."
    )

    url = (
        f"https://graph.facebook.com/v19.0/"
        f"{settings.WHATSAPP_PLATFORM_NUMBER}/messages"
    )
    headers = {
        "Authorization": f"Bearer {settings.WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": phone,
        "type": "text",
        "text": {"body": message},
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, headers=headers, json=payload)
            resp.raise_for_status()
            logger.info("WhatsApp OTP sent to %s (purpose=%s)", phone, purpose)
    except httpx.HTTPStatusError as e:
        logger.error(
            "WhatsApp API error %s: %s", e.response.status_code, e.response.text
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send WhatsApp OTP. Please try again.",
        ) from e
    except Exception as e:
        logger.error("WhatsApp send error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send WhatsApp OTP. Please try again.",
        ) from e


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

        logger.info("Registration OTP sent to %s (role=%s)", phone, payload.role)
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

        pending = _pending_registrations.pop(phone, None)
        pending_user = _pending_user_registrations.pop(phone, None)

        if not pending and not pending_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration session expired or not found. Please register again.",
            )

        await self._verify_otp(phone, payload.otp, "registration")

        # Build user
        if pending_user:
            user = User(
                role="user",
                name=pending_user.name,
                phone=phone,
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
                phone=phone,
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

        return self._issue_tokens(created)

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, payload: LoginRequest) -> MessageResponse:
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

        otp = _generate_otp(settings.OTP_LENGTH)
        await self._save_otp(phone, otp, "login")
        await self.db.commit()

        await _send_whatsapp_otp(phone, otp, "login")

        logger.info("Login OTP sent to %s", phone)
        return MessageResponse(message="OTP sent to your WhatsApp. Please verify to log in.")

    async def admin_login(self, payload: AdminLoginRequest) -> TokenResponse:
        identifier = (payload.email or payload.phone or "").strip()
        if not identifier:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please provide an email address or phone number.",
            )

        user = None
        if "@" in identifier:
            user = await self.repo.get_by_email(identifier)
        if not user:
            phone = _normalize_phone(identifier)
            user = await self.repo.get_by_phone(phone)
        if not user and "@" not in identifier:
            user = await self.repo.get_by_email(identifier)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No administrator account found with this email or phone number.",
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
                detail="Invalid email/phone or password. Access denied.",
            )

        logger.info("Admin logged in: identifier=%s user_id=%s", identifier, user.id)
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
