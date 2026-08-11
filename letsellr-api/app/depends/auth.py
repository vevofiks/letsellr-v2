"""
Dependency — Authentication & Authorization

Token strategy: internal JWT only (HS256, SECRET_KEY).
Service key (N8N_API_KEY) is also supported for server-to-server calls.

Usage in routes:
    async def my_route(current_user: CurrentUser) -> ...:
        ...

    async def admin_route(current_user: CurrentUser, db: DbSession):
        require_admin(current_user)  # inline check
"""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.config import settings
from app.core.security import decode_token
from app.depends.db import DbSession
from app.modules.users.models import User
from app.modules.users.repository import UserRepository

security = HTTPBearer()


# ── Internal JWT ──────────────────────────────────────────────────────────────


def _try_internal_jwt(token: str) -> dict | str | None:
    """
    Try decoding as an internally issued JWT (HS256 signed with SECRET_KEY).
    Returns the user UUID string (sub claim) on success, None on failure.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") in ("access", "service"):
            return payload["sub"]
        return None
    except (JWTError, KeyError):
        return None


# ── Server-to-Server / Service Auth ──────────────────────────────────────────


def is_valid_service_key(token_or_key: str | None) -> bool:
    """Check if provided string matches N8N_API_KEY."""
    if not token_or_key or not settings.N8N_API_KEY:
        return False
    return token_or_key.strip() == settings.N8N_API_KEY.strip()


# ── Main Dependency ───────────────────────────────────────────────────────────


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DbSession,
) -> User:
    """
    Extract Bearer token → verify → load User from DB.

    Resolution order:
    1. Check if token matches N8N_API_KEY (Server-to-Server auth)
    2. Internal JWT (issued by our own /auth/verify-login)
    """
    token = credentials.credentials
    repo = UserRepository(db)

    # ── 0. Service API Key ────────────────────────────────────────────────────
    if is_valid_service_key(token):
        return User(
            id="00000000-0000-0000-0000-000000000000",
            phone="0000000000",
            role="admin",
            status="active",
        )

    # ── 1. Internal JWT ───────────────────────────────────────────────────────
    user_id = _try_internal_jwt(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
        )

    # Service/system pseudo-user
    if user_id in ("n8n-service", "00000000-0000-0000-0000-000000000000"):
        return User(
            id="00000000-0000-0000-0000-000000000000",
            phone="0000000000",
            role="admin",
            status="active",
        )

    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    if user.status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Contact support.",
        )
    if (
        user.status == "pending"
        or user.verification_status in ("review_request", "pending", "unverified")
    ) and user.role in ("owner", "agency"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is currently under review. Access will be enabled once verified and approved by an administrator.",
        )

    return user


# ── Reusable type alias ────────────────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]

security_optional = HTTPBearer(auto_error=False)


async def get_optional_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_optional)],
    db: DbSession,
) -> User | None:
    """Extract Bearer token if present and valid; returns None if missing or invalid."""
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None


OptionalCurrentUser = Annotated[User | None, Depends(get_optional_current_user)]


# ── Role Guard ─────────────────────────────────────────────────────────────────
def require_role(*roles: str):
    """
    Factory for a role-checking dependency.
    Usage: Depends(require_role("admin")) or Depends(require_role("owner", "agency"))
    """

    async def _check(current_user: CurrentUser) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}.",
            )
        return current_user

    return _check


# ── Convenience aliases ────────────────────────────────────────────────────────
def require_admin():
    return require_role("admin")


def require_owner_or_agency():
    return require_role("owner", "agency")
