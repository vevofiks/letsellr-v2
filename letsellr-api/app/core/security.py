"""
Security Utilities

Handles:
- JWT access/refresh token creation and decoding
- Password hashing (bcrypt via passlib, for user passwords)
- OTP hashing (HMAC-SHA256, for short-lived one-time codes)
"""

import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# ── Password Hashing (bcrypt) ─────────────────────────────────────────
import bcrypt


def hash_password(plain: str) -> str:
    pwd_bytes = plain.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    try:
        pwd_bytes = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(pwd_bytes, hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT Tokens ────────────────────────────────────────────────────────────────
def create_access_token(subject: str | Any, extra: dict | None = None) -> str:
    """Create a short-lived access JWT."""
    expire = datetime.now(UTC) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(subject), "exp": expire, "type": "access"}
    if extra:
        payload.update(extra)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: str | Any) -> str:
    """Create a long-lived refresh JWT."""
    expire = datetime.now(UTC) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(subject), "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT. Raises JWTError on failure."""
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError as e:
        raise JWTError(f"Token validation failed: {e}") from e


# ── OTP Hashing (HMAC-SHA256) ─────────────────────────────────────────────────────────────
# OTPs are short-lived numeric codes — HMAC-SHA256 is perfectly
# safe here and avoids passlib/bcrypt 72-byte bugs entirely.


def hash_otp(otp: str) -> str:
    """HMAC-SHA256 hash of a short OTP using SECRET_KEY as the key."""
    return hmac.new(
        settings.SECRET_KEY.encode(),
        otp.encode(),
        hashlib.sha256,
    ).hexdigest()


def verify_otp_hash(otp: str, stored_hash: str) -> bool:
    """Constant-time comparison of OTP against stored HMAC-SHA256 hash."""
    expected = hash_otp(otp)
    return secrets.compare_digest(expected, stored_hash)
