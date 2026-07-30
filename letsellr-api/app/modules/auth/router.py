"""
Module: Auth
Router — Phone + WhatsApp OTP authentication endpoints

Registration flow:
  POST /api/auth/register              → send OTP to WhatsApp (owners/agencies)
  POST /api/auth/register/user         → send OTP to WhatsApp (seekers)
  POST /api/auth/verify-registration   → verify OTP, create account, return JWT

Login flow:
  POST /api/auth/login                 → send OTP to existing phone via WhatsApp
  POST /api/auth/verify-login          → verify OTP, return JWT

Admin login:
  POST /api/auth/admin/login           → email + password → JWT (no OTP)

Utility:
  POST /api/auth/resend-otp            → resend OTP
  POST /api/auth/refresh               → exchange refresh token for new tokens
  GET  /api/auth/me                    → return current user (requires JWT)
"""

from typing import Optional, Union

from fastapi import APIRouter

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
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
from app.modules.auth.service import AuthService

router = APIRouter()


# ── Registration ──────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=202,
    summary="Start registration for owners/agencies — sends OTP via WhatsApp",
)
async def register(payload: RegisterRequest, db: DbSession) -> RegisterResponse:
    """
    **Step 1 of registration for owners/agencies.**

    Validates the phone is unique, caches the profile data,
    and sends a 6-digit OTP to the provided phone via WhatsApp.

    The account is **not created** until the OTP is verified.
    """
    service = AuthService(db)
    return await service.register(payload)


@router.post(
    "/register/user",
    response_model=RegisterResponse,
    status_code=202,
    summary="Start registration for seekers — sends OTP via WhatsApp",
)
async def register_user(payload: UserRegisterRequest, db: DbSession) -> RegisterResponse:
    """
    **Step 1 of registration for seekers.**

    Captures simple user profile data and sends a 6-digit OTP via WhatsApp.
    """
    service = AuthService(db)
    return await service.register_user(payload)


@router.post(
    "/verify-registration",
    response_model=TokenResponse,
    status_code=201,
    summary="Complete registration — verify WhatsApp OTP",
)
async def verify_registration(
    payload: VerifyRegistrationRequest, db: DbSession
) -> TokenResponse:
    """
    **Step 2 of registration.**

    Verifies the OTP sent to the user's WhatsApp.
    On success: creates the user account and returns JWT access + refresh tokens.
    """
    service = AuthService(db)
    return await service.verify_registration(payload)


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Sign in — phone + 4-digit PIN",
)
async def login(payload: LoginRequest, db: DbSession) -> TokenResponse:
    """
    **Login via Phone Number + 4-digit PIN.**

    Validates credentials and returns JWT access + refresh tokens directly.
    """
    service = AuthService(db)
    return await service.login(payload)


@router.post(
    "/admin/login",
    response_model=TokenResponse,
    summary="Admin login — email + password",
)
async def admin_login(payload: AdminLoginRequest, db: DbSession) -> TokenResponse:
    """
    **Admin login via email + password.**

    No OTP required for admin accounts — direct password verification.
    """
    service = AuthService(db)
    return await service.admin_login(payload)


@router.post(
    "/verify-login",
    response_model=TokenResponse,
    summary="Complete login — verify WhatsApp OTP",
)
async def verify_login(payload: VerifyLoginRequest, db: DbSession) -> TokenResponse:
    """
    **Step 2 of login.**

    Verifies the WhatsApp OTP. On success returns JWT access + refresh tokens.
    """
    service = AuthService(db)
    return await service.verify_login(payload)


# ── Utility ───────────────────────────────────────────────────────────────────

@router.post(
    "/resend-otp",
    response_model=MessageResponse,
    summary="Resend OTP via WhatsApp",
)
async def resend_otp(payload: ResendOTPRequest, db: DbSession) -> MessageResponse:
    """Resend a fresh OTP to WhatsApp for login or registration. Invalidates any previous OTP."""
    service = AuthService(db)
    return await service.resend_otp(payload)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
)
async def refresh_token(payload: RefreshTokenRequest, db: DbSession) -> TokenResponse:
    """Exchange a refresh token for new access+refresh tokens."""
    service = AuthService(db)
    return await service.refresh_token(payload)


@router.get(
    "/me",
    response_model=UserPublic,
    summary="Get current user",
)
async def get_me(
    current_user: CurrentUser,
    db: DbSession,
    phone: Optional[str] = None,
) -> UserPublic:
    """Return the currently authenticated user's profile. Requires a valid JWT."""
    if phone and current_user.role == "admin":
        from app.modules.users.repository import UserRepository
        repo = UserRepository(db)
        clean_phone = phone.strip()
        user = await repo.get_by_phone(clean_phone)
        if not user and clean_phone.startswith("+"):
            user = await repo.get_by_phone(clean_phone[1:])
        if not user and len(clean_phone) > 10:
            user = await repo.get_by_phone(clean_phone[-10:])
        if user:
            return UserPublic.model_validate(user)
        return UserPublic(
            id=current_user.id,
            role="user",
            name="Valued Customer",
            email=None,
            email_verified=False,
            phone=clean_phone,
            preference_type="buy",
            location_city="",
            location_area="",
            verification_status="none",
            status="active",
            msg_limit=3,
            msg_usage=0
        )
    return UserPublic.model_validate(current_user)


@router.post(
    "/usage/increment",
    response_model=UserPublic,
    summary="Increment user message usage count",
)
async def increment_usage(
    current_user: CurrentUser,
    db: DbSession,
    phone: str,
) -> UserPublic:
    """Increment msg_usage for a user by phone number (requires service key)."""
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin authorization required")
    
    from app.modules.users.repository import UserRepository
    repo = UserRepository(db)
    clean_phone = phone.strip()
    user = await repo.get_by_phone(clean_phone)
    if not user and clean_phone.startswith("+"):
        user = await repo.get_by_phone(clean_phone[1:])
    if not user and len(clean_phone) > 10:
        user = await repo.get_by_phone(clean_phone[-10:])
    
    if user:
        user.msg_usage += 1
        await db.commit()
        await db.refresh(user)
        return UserPublic.model_validate(user)
    
    return UserPublic(
        id=current_user.id,
        role="user",
        name="Valued Customer",
        email="",
        email_verified=False,
        phone=clean_phone,
        preference_type="buy",
        location_city="",
        location_area="",
        verification_status="none",
        status="active",
        msg_limit=3,
        msg_usage=1
    )
