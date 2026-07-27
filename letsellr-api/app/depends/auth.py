"""
Dependency — Authentication & Authorization

Validates the Bearer token from the Authorization header.

Token strategy (in priority order):
  1. Internal JWT  — issued by our own /auth/verify-login endpoint (HS256, SECRET_KEY)
  2. Firebase JWT  — when AUTH_PROVIDER=firebase
  3. Supabase JWT  — when AUTH_PROVIDER=supabase

The internal JWT is always checked first so the OTP auth flow works
regardless of which external provider is configured.

Usage in routes:
    async def my_route(current_user: CurrentUser) -> ...:
        ...

    @router.get("/admin-only")
    async def admin_route(current_user: CurrentUser = Depends(require_role("admin"))):
        ...
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


# ── Internal JWT (OTP-based auth & Service tokens) ───────────────────────────

def _try_internal_jwt(token: str) -> dict | str | None:
    """
    Try decoding as an internally issued JWT (HS256 signed with SECRET_KEY).
    Returns the user UUID string (sub claim) or service payload on success, None on failure.
    """
    try:
        payload = decode_token(token)
        if payload.get("type") in ("access", "service"):
            return payload["sub"]
        return None
    except (JWTError, KeyError):
        return None


# ── External Auth Providers ───────────────────────────────────────────────────

async def _verify_firebase_token(token: str) -> str:
    """Verify a Firebase ID token and return the UID."""
    try:
        import firebase_admin.auth as firebase_auth
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Firebase token: {e}",
        ) from e


async def _verify_supabase_token(token: str) -> str:
    """Verify a Supabase JWT and return the user UID."""
    import asyncio
    from app.core.supabase import get_supabase_client

    try:
        client = get_supabase_client()
        # Verify the token using the Supabase client (makes a network call)
        res = await asyncio.to_thread(client.auth.get_user, token)
        if not res.user:
            raise ValueError("No user returned")
        return res.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Supabase token: {e}",
        ) from e


# ── Server-to-Server / Service Auth Dependency ─────────────────────────────

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
    2. Try internal JWT (issued by /auth/verify-login or service generator)
    3. Try external provider (firebase / supabase) as fallback
    """
    token = credentials.credentials
    repo = UserRepository(db)

    # ── 0. Service API Key direct Bearer token check ─────────────────────────
    if is_valid_service_key(token):
        # Return synthetic system user for service requests
        return User(
            id="00000000-0000-0000-0000-000000000000",
            phone="0000000000",
            role="admin",
            status="active",
        )

    # ── 1. Try internal JWT first ──────────────────────────────────────────────
    user_id = _try_internal_jwt(token)
    if user_id:
        if user_id == "n8n-service" or user_id == "00000000-0000-0000-0000-000000000000":
            return User(
                id="00000000-0000-0000-0000-000000000000",
                phone="0000000000",
                role="admin",
                status="active",
            )
        user = await repo.get_by_id(user_id)
        if user:
            if user.status == "suspended" or user.verification_status in ("review_request", "pending"):
                if user.verification_status in ("review_request", "unverified", "pending"):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Your account is currently under review by our admin team. Access will be enabled once verified.",
                    )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Your account has been suspended. Contact support.",
                )
            return user

    # ── 2. Fall back to external provider ─────────────────────────────────────
    if settings.AUTH_PROVIDER == "firebase":
        provider_uid = await _verify_firebase_token(token)
    else:
        provider_uid = await _verify_supabase_token(token)

    user = await repo.get_by_provider_uid(provider_uid)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found. Please complete registration.",
        )

    if user.status == "suspended" or user.verification_status in ("review_request", "pending"):
        if user.verification_status in ("review_request", "unverified", "pending"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your account is currently under review by our admin team. Access will be enabled once verified.",
            )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended. Contact support.",
        )

    return user



# ── Reusable type alias ────────────────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]


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
