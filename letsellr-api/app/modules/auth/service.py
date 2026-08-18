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
from app.core.whatsapp import notify_admin_pending_user, send_whatsapp_message
from app.modules.admin.service import admin_alert_targets
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
    """
    Standardize phone number format into canonical E.164 format (+91... for 10-digit Indian numbers).
    Strips spaces, dashes, parentheses, and leading zeros.
    """
    if not phone:
        return ""
    clean = "".join(c for c in phone if c.isdigit() or c == "+").strip()
    if clean.startswith("+"):
        return clean
    if clean.startswith("0"):
        clean = clean[1:]
    if len(clean) == 10:
        return f"+91{clean}"
    if len(clean) == 12 and clean.startswith("91"):
        return f"+{clean}"
    return f"+{clean}" if clean else phone


async def _send_whatsapp_otp(phone: str, otp: str, purpose: str) -> None:
    """Send an OTP via the self-hosted OpenWA Gateway."""
    message = (
        f"Your Letsellr verification code is: *{otp}*\n\n"
        f"This code is valid for {settings.OTP_EXPIRE_MINUTES} minutes. "
        f"Do not share it with anyone."
    )

    sent = await send_whatsapp_message(phone, message, context=f"{purpose} OTP")
    if not sent:
        logger.warning("[DEV MODE] WhatsApp OTP for %s (%s): %s", phone, purpose, otp)


async def _trigger_crm_webhook(user: User):
    url = "https://revucrm.larahub.io/api/v1/lead-intake/0488d536-a0ec-4919-b548-345e7ee84bce"
    headers = {
        "Authorization": "Bearer 4PvdLEkkCm4EhNITsiksFY7A2EKpRhhs",
        "X-Secret-Key": "4PvdLEkkCm4EhNITsiksFY7A2EKpRhhs",
        "Content-Type": "application/json",
    }
    payload = {
        "customer_name": user.name or "New User",
        "mobile_1": user.phone,
        "preferred_locations": [user.location_city] if user.location_city else [],
    }
    if user.email:
        payload["email"] = user.email

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=payload, headers=headers, timeout=5.0)
            logger.info(
                "CRM Webhook fired for %s, status: %s", user.phone, resp.status_code
            )
    except Exception as e:
        logger.error("Failed to fire CRM Webhook for %s: %s", user.phone, e)


class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    # ── OTP Helpers ───────────────────────────────────────────────────────────

    async def _save_otp(
        self, phone: str, otp: str, purpose: str, payload: dict | None = None
    ) -> None:
        """Delete any existing OTP for this phone+purpose, then save new one with payload."""
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
            payload=payload,
        )
        self.db.add(record)
        await self.db.flush()

    async def _verify_otp(self, phone: str, otp: str, purpose: str) -> OTPRecord:
        """Verify OTP for a phone+purpose. Returns the record on success."""

        # --- TEST BACKDOOR FOR PRODUCTION TESTING ---
        if otp == "000000" and phone in ("+910000000001", "+910000000002"):
            logger.info("Test account login bypass using master PIN: %s", phone)
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
                detail="No verification OTP found. Please request a new code.",
            )

        exp = (
            record.expires_at
            if record.expires_at.tzinfo
            else record.expires_at.replace(tzinfo=UTC)
        )
        if exp < datetime.now(UTC):
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
        await self.db.execute(delete(OTPRecord).where(OTPRecord.id == record.id))
        return record

    def _issue_tokens(self, user: User) -> TokenResponse:
        """Issue self-signed JWT access + refresh tokens.

        Admins get much longer-lived tokens than owner/agency/seeker accounts —
        the admin panel is a long-running back-office tool, not a mobile app users
        re-open constantly, so a short access-token TTL was causing it to look like
        the admin session "auto logs out" whenever the silent refresh didn't get a
        chance to fire within the hour.
        """
        if user.role == "admin":
            access_token = create_access_token(
                str(user.id), expire_minutes=settings.ADMIN_ACCESS_TOKEN_EXPIRE_MINUTES
            )
            refresh_token = create_refresh_token(
                str(user.id), expire_days=settings.ADMIN_REFRESH_TOKEN_EXPIRE_DAYS
            )
        else:
            access_token = create_access_token(str(user.id))
            refresh_token = create_refresh_token(str(user.id))
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=UserPublic.model_validate(user),
        )

    # ── Availability check (live form validation) ───────────────────────────────

    async def check_availability(
        self, phone: str | None, email: str | None
    ) -> "AvailabilityResponse":
        from app.modules.auth.schemas import AvailabilityResponse

        phone_taken = False
        email_taken = False

        if phone and phone.strip():
            phone_taken = (await self.repo.get_by_phone(_normalize_phone(phone))) is not None

        if email and email.strip():
            email_taken = (await self.repo.get_by_email(email.strip())) is not None

        return AvailabilityResponse(phone_taken=phone_taken, email_taken=email_taken)

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

        email = payload.email.strip() if payload.email and payload.email.strip() else None
        if email and await self.repo.get_by_email(email):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email address already exists. Please log in or use a different email.",
            )

        otp = _generate_otp(settings.OTP_LENGTH)
        reg_payload = payload.model_dump()
        reg_payload["_registration_type"] = "owner_agency"
        await self._save_otp(phone, otp, "registration", payload=reg_payload)
        await self.db.commit()

        await _send_whatsapp_otp(phone, otp, "registration")

        logger.info(
            "Registration OTP sent to %s (role=%s)",
            phone,
            getattr(payload, "role", "user"),
        )
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
        reg_payload = payload.model_dump()
        reg_payload["_registration_type"] = "user"
        await self._save_otp(phone, otp, "registration", payload=reg_payload)
        await self.db.commit()

        await _send_whatsapp_otp(phone, otp, "registration")

        logger.info("Seeker registration OTP sent to %s", phone)
        return RegisterResponse(phone=phone)

    async def verify_registration(
        self, payload: VerifyRegistrationRequest
    ) -> TokenResponse:
        phone = _normalize_phone(payload.phone)

        # 1. Fetch OTP record to get saved registration payload
        result = await self.db.execute(
            select(OTPRecord).where(
                OTPRecord.phone == phone,
                OTPRecord.purpose == "registration",
                OTPRecord.used == False,
            )
        )
        record = result.scalar_one_or_none()

        if not record or not record.payload:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration session expired or not found. Please register again.",
            )

        reg_data = record.payload

        # 2. Verify the OTP code
        await self._verify_otp(phone, payload.otp, "registration")

        reg_type = reg_data.get("_registration_type", "user")

        email = reg_data.get("email")
        email = email.strip() if email and email.strip() else None
        if email:
            existing_email_user = await self.repo.get_by_email(email)
            if existing_email_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="An account with this email address already exists. Please log in or use a different email.",
                )

        # Build user
        if reg_type == "user" or (
            "preference_type" in reg_data and "location" in reg_data
        ):
            user = User(
                role="user",
                name=reg_data.get("name"),
                email=email,
                phone=phone,
                auth_provider_uid=hash_password(reg_data["pin"]),
                email_verified=False,
                preference_type=reg_data.get("preference_type", "buy"),
                location_city=reg_data.get(
                    "location", reg_data.get("location_city", "")
                ),
                location_area="N/A",
                verification_status="unverified",
                status="active",
            )
        else:
            role = reg_data.get("role", "owner")
            user = User(
                role=role,
                name=reg_data.get("name"),
                email=email,
                phone=phone,
                auth_provider_uid=hash_password(reg_data["pin"]),
                email_verified=False,
                preference_type=reg_data.get("preference_type", "buy"),
                location_city=reg_data.get("location_city", ""),
                location_area=reg_data.get("location_area", "N/A"),
                verification_status=(
                    "pending" if role in ("agency", "owner") else "unverified"
                ),
                status="pending" if role in ("agency", "owner") else "active",
            )

            if role == "agency":
                user.agency_profile = AgencyProfile(
                    display_name=reg_data.get("agency_display_name")
                    or reg_data.get("name"),
                    about=reg_data.get("agency_about") or "",
                    areas_served=reg_data.get("agency_areas_served", []),
                )

        created = await self.repo.create(user)

        if user.role == "agency":
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

        # Alert admins on WhatsApp about accounts that land in the approval queue.
        # Name comes from reg_data so we never lazy-load agency_profile post-refresh.
        if created.role in ("owner", "agency") and created.status == "pending":
            targets = await admin_alert_targets(self.db, "users")
            display_name = (
                reg_data.get("agency_display_name") or created.name
                if created.role == "agency"
                else created.name
            )
            if targets:
                asyncio.create_task(
                    notify_admin_pending_user(
                        name=display_name,
                        role=created.role,
                        phone=created.phone,
                        city=created.location_city,
                        recipients=targets,
                    )
                )

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

        if not user.auth_provider_uid or not verify_password(
            payload.pin, user.auth_provider_uid
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid phone number or 4-digit security PIN.",
            )

        logger.info(
            "User logged in via 4-digit PIN: phone=%s role=%s", phone, user.role
        )
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

        if not user.auth_provider_uid or not verify_password(
            payload.password, user.auth_provider_uid
        ):
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

        if user.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Contact support.",
            )

        logger.info("User verified login: phone=%s", phone)
        return self._issue_tokens(user)

    # ── Resend OTP ────────────────────────────────────────────────────────────

    async def resend_otp(self, payload: ResendOTPRequest) -> MessageResponse:
        phone = _normalize_phone(payload.phone)

        existing_payload = None
        if payload.purpose == "login":
            user = await self.repo.get_by_phone(phone)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No account found with this phone number.",
                )
        else:
            result = await self.db.execute(
                select(OTPRecord).where(
                    OTPRecord.phone == phone,
                    OTPRecord.purpose == "registration",
                )
            )
            record = result.scalar_one_or_none()
            if not record or not record.payload:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No pending registration found. Please register again.",
                )
            existing_payload = record.payload

        otp = _generate_otp(settings.OTP_LENGTH)
        await self._save_otp(phone, otp, payload.purpose, payload=existing_payload)
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
