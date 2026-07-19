"""
Module: Auth
Router — Email OTP authentication endpoints

Registration flow:
  POST /api/auth/register              → send OTP to email
  POST /api/auth/verify-registration   → verify OTP, create account, return JWT

Login flow:
  POST /api/auth/login                 → send OTP to existing email
  POST /api/auth/verify-login          → verify OTP, return JWT

Utility:
  POST /api/auth/resend-otp            → resend OTP for login or registration
  GET  /api/auth/me                    → return current user (requires JWT)
"""

from fastapi import APIRouter

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
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
    RefreshTokenRequest,
)
from app.modules.auth.service import AuthService

router = APIRouter()


# ── Registration ──────────────────────────────────────────────────────────────

@router.post(
    "/register",
    response_model=RegisterResponse,
    status_code=202,
    summary="Start registration for owners/agencies — sends OTP to email",
)
async def register(payload: RegisterRequest, db: DbSession) -> RegisterResponse:
    """
    **Step 1 of registration for owners/agencies.**

    Validates the email is unique, caches the profile data,
    and sends a 6-digit OTP to the provided email address.

    The account is **not created** until the OTP is verified.
    """
    service = AuthService(db)
    return await service.register(payload)

@router.post(
    "/register/user",
    response_model=RegisterResponse,
    status_code=202,
    summary="Start registration for normal users — sends OTP to email",
)
async def register_user(payload: UserRegisterRequest, db: DbSession) -> RegisterResponse:
    """
    **Step 1 of registration for normal users/seekers.**

    Captures simple user profile data (name, email, phone, location)
    and sends a 6-digit OTP to the provided email address via Supabase.
    """
    service = AuthService(db)
    return await service.register_user(payload)



@router.post(
    "/verify-registration",
    response_model=TokenResponse,
    status_code=201,
    summary="Complete registration — verify OTP",
)
async def verify_registration(
    payload: VerifyRegistrationRequest, db: DbSession
) -> TokenResponse:
    """
    **Step 2 of registration.**

    Verifies the OTP sent to the user's email.
    On success: creates the user account and returns JWT access + refresh tokens.
    """
    service = AuthService(db)
    return await service.verify_registration(payload)


# ── Login ─────────────────────────────────────────────────────────────────────

from typing import Union

@router.post(
    "/login",
    response_model=Union[TokenResponse, MessageResponse],
    summary="Sign in with email and optional password",
)
async def login(payload: LoginRequest, db: DbSession) -> Union[TokenResponse, MessageResponse]:
    """
    **Login flow.**

    If password is provided, signs in directly. Otherwise, sends OTP.
    """
    service = AuthService(db)
    return await service.login(payload)


@router.post(
    "/verify-login",
    response_model=TokenResponse,
    summary="Complete login — verify OTP",
)
async def verify_login(payload: VerifyLoginRequest, db: DbSession) -> TokenResponse:
    """
    **Step 2 of login.**

    Verifies the OTP. On success returns JWT access + refresh tokens.
    """
    service = AuthService(db)
    return await service.verify_login(payload)


# ── Utility ───────────────────────────────────────────────────────────────────

@router.post(
    "/resend-otp",
    response_model=MessageResponse,
    summary="Resend OTP",
)
async def resend_otp(payload: ResendOTPRequest, db: DbSession) -> MessageResponse:
    """Resend a fresh OTP for login or registration. Invalidates any previous OTP."""
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
async def get_me(current_user: CurrentUser) -> UserPublic:
    """Return the currently authenticated user's profile. Requires a valid JWT."""
    return UserPublic.model_validate(current_user)

