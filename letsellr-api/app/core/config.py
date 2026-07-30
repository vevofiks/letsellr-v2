"""
Core Configuration — pydantic-settings BaseSettings

All environment variables are defined here with type hints and validation.
Load order: OS env → .env file (via python-dotenv).
"""

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "Letsellr API"
    APP_VERSION: str = "0.1.0"
    DEBUG: bool = False
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str  # postgresql+asyncpg://...

    # ── Security ─────────────────────────────────────────────────────────────
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # ── Auth Provider ─────────────────────────────────────────────────────────
    AUTH_PROVIDER: Literal["firebase", "supabase"] = "supabase"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    # ── Cloudflare R2 ─────────────────────────────────────────────────────────
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = "letsellr-media"
    R2_PUBLIC_URL: str = "https://cdn.letsellr.in"

    # ── SMTP (Email / OTP) ────────────────────────────────────────────────────
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""        # your sender email address
    SMTP_PASSWORD: str = ""        # app-specific password
    SMTP_FROM_NAME: str = "Letsellr"
    SMTP_FROM_EMAIL: str = ""      # same as SMTP_USERNAME usually
    SMTP_USE_TLS: bool = True

    # ── OTP ──────────────────────────────────────────────────────────────────
    OTP_EXPIRE_MINUTES: int = 10   # OTP validity window
    OTP_LENGTH: int = 6            # digit count

    # ── WhatsApp ──────────────────────────────────────────────────────────────
    WHATSAPP_PLATFORM_NUMBER: str = ""
    WHATSAPP_API_TOKEN: str = ""
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: str = ""
    FREE_CONTACT_LIMIT: int = 3

    # ── Server-to-Server Auth (n8n) ───────────────────────────────────────────
    N8N_API_KEY: str = "letsellr_n8n_sec_key_98324798327498"


    # ── Map / Places API ──────────────────────────────────────────────────────
    PLACES_API_KEY: str = ""

    # ── CORS ─────────────────────────────────────────────────────────────
    # Stored as a raw string in .env (comma-separated); parsed by validator.
    CORS_ORIGINS_STR: str = "http://localhost:3000,http://localhost:5173"
    ALLOWED_HOSTS_STR: str = "letsellr.com,*.letsellr.com"

    @field_validator("CORS_ORIGINS_STR", mode="before")
    @classmethod
    def _coerce_cors(cls, v: object) -> str:
        """Allow list input too (e.g. from tests)."""
        if isinstance(v, list):
            return ",".join(v)
        return str(v)

    @field_validator("ALLOWED_HOSTS_STR", mode="before")
    @classmethod
    def _coerce_hosts(cls, v: object) -> str:
        """Allow list input too (e.g. from tests)."""
        if isinstance(v, list):
            return ",".join(v)
        return str(v)

    @property
    def CORS_ORIGINS(self) -> list[str]:  # noqa: N802
        """Parsed list of allowed CORS origins."""
        return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]

    @property
    def ALLOWED_HOSTS(self) -> list[str]:  # noqa: N802
        """Parsed list of allowed hosts."""
        return [o.strip() for o in self.ALLOWED_HOSTS_STR.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings singleton. Fast on repeated calls."""
    return Settings()


# Module-level convenience — import `settings` directly.
settings = get_settings()
