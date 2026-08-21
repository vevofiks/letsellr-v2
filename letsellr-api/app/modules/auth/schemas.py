"""
Module: Auth
Schemas — Pydantic request/response models for phone+WhatsApp OTP auth flows
"""

import uuid
from typing import Literal, Optional

from pydantic import BaseModel, Field

# ── Registration ──────────────────────────────────────────────────────────────


class UserRegisterRequest(BaseModel):
    """Registration payload for normal users/seekers (phone-based)."""

    name: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=7, max_length=20)
    preference_type: str = Field(..., min_length=1)
    location: str = Field(..., min_length=2, max_length=200)
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$")


class RegisterRequest(BaseModel):
    """Step 1 of registration for owners/agencies: collect profile, trigger WhatsApp OTP."""

    role: Literal["owner", "agency"]
    name: str = Field(..., min_length=2, max_length=200)
    email: str | None = None
    phone: str = Field(..., min_length=7, max_length=20)
    preference_type: str = Field(..., min_length=1)
    location_city: str = Field(..., min_length=2, max_length=100)
    location_area: str = Field(..., min_length=2, max_length=200)
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$")

    # Agency-only (optional for owners)
    agency_display_name: str | None = None
    agency_about: str | None = None
    agency_areas_served: list[str] = []


class VerifyRegistrationRequest(BaseModel):
    """Step 2 of registration: submit OTP to activate account."""

    phone: str = Field(..., min_length=7, max_length=20)
    otp: str = Field(..., min_length=4, max_length=10)


# ── Login ─────────────────────────────────────────────────────────────────────


class LoginRequest(BaseModel):
    """Sign in using phone number + 4-digit PIN."""

    phone: str = Field(..., min_length=7, max_length=20)
    pin: str = Field(..., min_length=4, max_length=4, pattern="^[0-9]{4}$")


class VerifyLoginRequest(BaseModel):
    """Step 2 of login: verify OTP."""

    phone: str = Field(..., min_length=7, max_length=20)
    otp: str = Field(..., min_length=4, max_length=10)


class AdminLoginRequest(BaseModel):
    """Admin login: email + password."""

    email: str = Field(..., description="Admin email address")
    password: str = Field(..., min_length=6, max_length=100)


# ── Responses ─────────────────────────────────────────────────────────────────


class RegisterResponse(BaseModel):
    """Returned after step 1: registration accepted."""

    message: str = "OTP sent to your WhatsApp. Please verify to complete registration."
    phone: str


class AvailabilityResponse(BaseModel):
    """Returned by the live phone/email availability check used for inline form validation."""

    phone_taken: bool = False
    email_taken: bool = False


class ResendOTPRequest(BaseModel):
    """Resend an OTP for login or registration."""

    phone: str = Field(..., min_length=7, max_length=20)
    purpose: Literal["login", "registration"] = "login"


class UserPublic(BaseModel):
    """Public-safe user representation returned after auth."""

    id: uuid.UUID
    role: str
    name: str
    email_verified: bool
    phone: str
    preference_type: str
    location_city: str
    location_area: str
    verification_status: str
    status: str
    is_registered: bool = True
    msg_limit: int = 3
    msg_usage: int = 0

    model_config = {"from_attributes": True}


class UsageIncrementResponse(BaseModel):
    """
    Result of an atomic, limit-guarded usage increment.

    `allowed` is the only field callers should branch on: it is False when
    the increment was refused because msg_usage was already at msg_limit,
    distinguishing "refused" from "succeeded and landed exactly on the
    limit" (both leave msg_usage == msg_limit in the response).
    """

    allowed: bool
    msg_usage: int
    msg_limit: int
    phone: str


class TokenResponse(BaseModel):
    """JWT tokens returned after successful OTP verification."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


class MessageResponse(BaseModel):
    """Generic message response."""

    message: str


class RefreshTokenRequest(BaseModel):
    """Payload to exchange a refresh token for new access+refresh tokens."""

    refresh_token: str
