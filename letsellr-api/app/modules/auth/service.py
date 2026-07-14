"""
Module: Auth
Service — Business logic for OTP-based email authentication

Registration flow:
  1. POST /auth/register    → validate email uniqueness, store pending user,
                              generate OTP, send email
  2. POST /auth/verify-registration → verify OTP, mark email_verified=True,
                                       return JWT tokens

Login flow:
  1. POST /auth/login       → check email exists, generate OTP, send email
  2. POST /auth/verify-login → verify OTP, return JWT tokens

Both flows share the same OTP generation + verification logic.
"""

import logging
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.supabase import get_supabase_client
from app.modules.auth.schemas import (
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
)
from app.modules.users.models import AgencyProfile, User
from app.modules.users.repository import UserRepository

logger = logging.getLogger(__name__)

# Temporary in-memory store for pending registration data
_pending_registrations: dict[str, RegisterRequest] = {}
_pending_user_registrations: dict[str, UserRegisterRequest] = {}

class AuthService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db
        self.repo = UserRepository(db)

    # ── Registration ─────────────────────────────────────────────────────────

    async def register(self, payload: RegisterRequest) -> RegisterResponse:
        if payload.role == "agency" and not payload.agency_display_name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Agencies must provide an agency_display_name.",
            )

        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please log in.",
            )

        _pending_registrations[payload.email] = payload

        supabase = get_supabase_client()
        try:
            supabase.auth.sign_in_with_otp({
                "email": payload.email,
                "options": {
                    "data": {
                        "name": payload.name,
                        "phone": payload.phone,
                        "role": payload.role,
                        "location_city": payload.location_city,
                        "location_area": payload.location_area,
                        "preference_type": payload.preference_type,
                    }
                }
            })
        except Exception as e:
            logger.error("Supabase sign_in_with_otp error: %s", e)
            error_str = str(e).lower()
            if "rate limit" in error_str or "too many requests" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Email rate limit exceeded. Please wait a moment before trying again.",
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP. Please try again later.",
            ) from e

        logger.info("Supabase Registration OTP sent to %s", payload.email)
        return RegisterResponse(email=payload.email)

    async def register_user(self, payload: UserRegisterRequest) -> RegisterResponse:
        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists. Please log in.",
            )

        _pending_user_registrations[payload.email] = payload

        supabase = get_supabase_client()
        try:
            supabase.auth.sign_in_with_otp({
                "email": payload.email,
                "options": {
                    "data": {
                        "name": payload.name,
                        "phone": payload.phone,
                        "role": "user",
                        "location": payload.location,
                    }
                }
            })
        except Exception as e:
            logger.error("Supabase user sign_in_with_otp error: %s", e)
            error_str = str(e).lower()
            if "rate limit" in error_str or "too many requests" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Email rate limit exceeded. Please wait a moment before trying again.",
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP. Please try again later.",
            ) from e

        logger.info("Supabase User Registration OTP sent to %s", payload.email)
        return RegisterResponse(email=payload.email)


    async def verify_registration(
        self, payload: VerifyRegistrationRequest
    ) -> TokenResponse:
        pending = _pending_registrations.pop(payload.email, None)
        pending_user = _pending_user_registrations.pop(payload.email, None)
        
        if not pending and not pending_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration session expired. Please register again.",
            )

        supabase = get_supabase_client()
        try:
            res = supabase.auth.verify_otp(
                {"email": payload.email, "token": payload.otp, "type": "email"}
            )
        except Exception as e:
            if pending:
                _pending_registrations[payload.email] = pending
            if pending_user:
                _pending_user_registrations[payload.email] = pending_user
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP or expired.",
            ) from e

        if not res.user or not res.session:
            if pending:
                _pending_registrations[payload.email] = pending
            if pending_user:
                _pending_user_registrations[payload.email] = pending_user
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user session from Supabase.",
            )

        existing = await self.repo.get_by_email(payload.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists.",
            )

        if pending_user:
            user = User(
                auth_provider_uid=res.user.id,
                role="user",
                name=pending_user.name,
                email=pending_user.email,
                email_verified=True,
                phone=pending_user.phone,
                preference_type=[],
                location_city=pending_user.location,
                location_area="N/A",
                verification_status="pending",
                status="active",
            )
        elif pending:
            user = User(
                auth_provider_uid=res.user.id,
                role=pending.role,
                name=pending.name,
                email=pending.email,
                email_verified=True,
                phone=pending.phone,
                preference_type=pending.preference_type,
                location_city=pending.location_city,
                location_area=pending.location_area,
                verification_status="pending",
                status="active",
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
        await self.db.commit()
        logger.info("User created in local DB via Supabase Auth: %s", created.email)

        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            user=UserPublic.model_validate(created),
        )

    # ── Login ─────────────────────────────────────────────────────────────────

    async def login(self, payload: LoginRequest) -> MessageResponse:
        user = await self.repo.get_by_email(payload.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email. Please register first.",
            )

        if user.status == "suspended":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account has been suspended. Please contact support.",
            )

        supabase = get_supabase_client()
        try:
            supabase.auth.sign_in_with_otp({"email": payload.email})
        except Exception as e:
            logger.error("Supabase login sign_in_with_otp error: %s", e)
            error_str = str(e).lower()
            if "rate limit" in error_str or "too many requests" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Email rate limit exceeded. Please wait a moment before trying again.",
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP. Please try again later.",
            ) from e

        logger.info("Supabase Login OTP sent to %s", payload.email)
        return MessageResponse(message="OTP sent to your email. Valid for 10 minutes.")

    async def verify_login(self, payload: VerifyLoginRequest) -> TokenResponse:
        supabase = get_supabase_client()
        try:
            res = supabase.auth.verify_otp(
                {"email": payload.email, "token": payload.otp, "type": "email"}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid OTP. Please check the code and try again.",
            ) from e

        if not res.user or not res.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user session from Supabase.",
            )

        user = await self.repo.get_by_provider_uid(res.user.id)
        if not user:
            user = await self.repo.get_by_email(payload.email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Account not found in local database.",
                )
            
            user.auth_provider_uid = res.user.id
            await self.db.commit()

        logger.info("User logged in via Supabase: %s", user.email)
        
        return TokenResponse(
            access_token=res.session.access_token,
            refresh_token=res.session.refresh_token,
            user=UserPublic.model_validate(user),
        )

    # ── Resend OTP ────────────────────────────────────────────────────────────

    async def resend_otp(self, payload: ResendOTPRequest) -> MessageResponse:
        if payload.purpose == "login":
            user = await self.repo.get_by_email(payload.email)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No account found with this email.",
                )
        else:
            if payload.email not in _pending_registrations and payload.email not in _pending_user_registrations:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No pending registration found. Please register again.",
                )

        supabase = get_supabase_client()
        try:
            supabase.auth.sign_in_with_otp({"email": payload.email})
        except Exception as e:
            logger.error("Supabase resend_otp error: %s", e)
            error_str = str(e).lower()
            if "rate limit" in error_str or "too many requests" in error_str:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Email rate limit exceeded. Please wait a moment before trying again.",
                ) from e
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP. Please try again later.",
            ) from e
            
        return MessageResponse(message="A new OTP has been sent to your email.")
