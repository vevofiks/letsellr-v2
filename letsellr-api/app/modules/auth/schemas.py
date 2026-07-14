"""
Module: Auth
Schemas — Pydantic request/response models for all auth flows
"""

import uuid
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


# ── Registration ──────────────────────────────────────────────────────────────

class UserRegisterRequest(BaseModel):
    """Registration payload for normal users/seekers."""
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    location: str = Field(..., min_length=2, max_length=200)


class RegisterRequest(BaseModel):
    """Step 1 of registration: collect profile, trigger OTP email."""
    role: Literal["owner", "agency"]
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    preference_type: list[str] = Field(..., min_length=1)
    location_city: str = Field(..., min_length=2, max_length=100)
    location_area: str = Field(..., min_length=2, max_length=200)

    # Agency-only (optional for owners)
    agency_display_name: str | None = None
    agency_about: str | None = None
    agency_areas_served: list[str] = []


class VerifyRegistrationRequest(BaseModel):
    """Step 2 of registration: submit OTP to activate account if email confirmation is enabled."""
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)

# ── Login ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Step 1 of login: send OTP to the given email."""
    email: EmailStr


class VerifyLoginRequest(BaseModel):
    """Step 2 of login: verify OTP."""
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)


# ── Responses ─────────────────────────────────────────────────────────────────

class RegisterResponse(BaseModel):
    """Returned after step 1: registration accepted."""
    message: str = "OTP sent to your email. Please verify to complete registration."
    email: str


class ResendOTPRequest(BaseModel):
    email: EmailStr
    purpose: Literal["register", "login"]


class UserPublic(BaseModel):
    """Public-safe user representation returned after auth."""
    id: uuid.UUID
    role: str
    name: str
    email: str
    email_verified: bool
    phone: str
    preference_type: list[str]
    location_city: str
    location_area: str
    verification_status: str
    status: str

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    """JWT tokens returned after successful OTP verification."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


class MessageResponse(BaseModel):
    """Generic message response."""
    message: str


class ResendOTPRequest(BaseModel):
    """Resend an OTP for login or registration."""
    email: EmailStr
    purpose: Literal["login", "registration"] = "login"
