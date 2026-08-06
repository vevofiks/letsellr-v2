"""
Module: Admin
Service — platform settings (notification toggles) and admin credentials.

`admin_settings` holds exactly one row. It's created lazily on first read so
neither a migration nor a seed script has to insert it.
"""

import logging

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.core.whatsapp import admin_whatsapp_numbers, normalize_whatsapp_number
from app.modules.admin.models import AdminSettings
from app.modules.admin.schemas import (
    AdminCredentialsUpdate,
    AdminNotificationSettingsUpdate,
)
from app.modules.users.models import User

logger = logging.getLogger(__name__)


def _clean_recipients(raw: list[str]) -> list[str]:
    """Normalise to E.164 and drop duplicates, preserving the admin's order."""
    cleaned: list[str] = []
    for entry in raw:
        try:
            number = normalize_whatsapp_number(entry)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)
            )
        if number not in cleaned:
            cleaned.append(number)
    return cleaned


class AdminSettingsService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_settings(self) -> AdminSettings:
        """Return the singleton settings row, creating it with defaults if absent."""
        result = await self.db.execute(
            select(AdminSettings).order_by(AdminSettings.created_at.asc()).limit(1)
        )
        settings_row = result.scalar_one_or_none()

        if settings_row is None:
            settings_row = AdminSettings()
            self.db.add(settings_row)
            await self.db.flush()
            await self.db.refresh(settings_row)
            logger.info("Created default admin_settings row")

        return settings_row

    async def update_notifications(
        self, payload: AdminNotificationSettingsUpdate
    ) -> AdminSettings:
        settings_row = await self.get_settings()
        updates = payload.model_dump(exclude_unset=True)

        if "whatsapp_recipients" in updates:
            updates["whatsapp_recipients"] = _clean_recipients(
                updates["whatsapp_recipients"] or []
            )

        for field, value in updates.items():
            setattr(settings_row, field, value)
        await self.db.flush()
        await self.db.refresh(settings_row)
        logger.info(
            "Admin notification settings updated: users=%s properties=%s recipients=%s",
            settings_row.notify_pending_users,
            settings_row.notify_pending_properties,
            settings_row.whatsapp_recipients,
        )
        return settings_row

    async def update_credentials(
        self, admin: User, payload: AdminCredentialsUpdate
    ) -> User:
        """Change the admin's login email and/or password."""
        if not admin.auth_provider_uid or not verify_password(
            payload.current_password, admin.auth_provider_uid
        ):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Current password is incorrect.",
            )

        if not payload.new_email and not payload.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Provide a new email address or a new password.",
            )

        if payload.new_email:
            new_email = payload.new_email.strip().lower()
            if new_email != (admin.email or "").lower():
                taken = await self.db.execute(
                    select(User).where(
                        User.email == new_email, User.id != admin.id
                    )
                )
                if taken.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="That email address is already in use.",
                    )
                admin.email = new_email

        if payload.new_password:
            admin.auth_provider_uid = hash_password(payload.new_password)

        await self.db.flush()
        await self.db.refresh(admin)
        logger.info("Admin credentials updated: user_id=%s", admin.id)
        return admin


def effective_recipients(settings_row: AdminSettings) -> list[str]:
    """Saved recipients, falling back to the env default while none are set."""
    return list(settings_row.whatsapp_recipients or []) or admin_whatsapp_numbers()


async def admin_alert_targets(db: AsyncSession, kind: str) -> list[str]:
    """
    Who should receive a `kind` ("users" | "properties") alert right now —
    empty when the toggle is off or no recipient is configured.

    Called from request paths that are about to fire an alert. On an unexpected
    read failure we fall back to the env recipients rather than dropping the
    alert, which is how this behaved before the toggles existed.
    """
    field = {
        "users": "notify_pending_users",
        "properties": "notify_pending_properties",
    }[kind]

    try:
        settings_row = await AdminSettingsService(db).get_settings()
    except Exception as e:
        logger.error("Failed to read admin notification settings: %s", e)
        return admin_whatsapp_numbers()

    if not getattr(settings_row, field):
        return []
    return effective_recipients(settings_row)
