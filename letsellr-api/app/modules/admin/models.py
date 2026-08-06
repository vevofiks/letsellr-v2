"""
Module: Admin
ORM Models — VerificationRequest, AdminSettings
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class VerificationRequest(UUIDMixin, TimestampMixin, Base):
    """Admin verification request for owner/agency identity."""

    __tablename__ = "verification_requests"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
        comment="pending | approved | rejected",
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Documents/evidence uploaded (R2 keys)
    from sqlalchemy.dialects.postgresql import ARRAY
    from sqlalchemy import String as Str

    document_keys: Mapped[list[str]] = mapped_column(
        ARRAY(Str), default=list, nullable=False
    )

    user: Mapped["User"] = relationship(  # type: ignore
        "User",
        back_populates="verification_requests",
        foreign_keys=[user_id],
    )


class AdminSettings(UUIDMixin, TimestampMixin, Base):
    """
    Platform-wide admin preferences. Single row — read/created lazily via
    `AdminSettingsService.get_settings`, never inserted by a migration.
    """

    __tablename__ = "admin_settings"

    notify_pending_users: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        comment="WhatsApp the admin when an owner/agency awaits approval",
    )
    notify_pending_properties: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default="true",
        comment="WhatsApp the admin when a listing enters the review queue",
    )
    whatsapp_recipients: Mapped[list[str]] = mapped_column(
        ARRAY(String),
        nullable=False,
        default=list,
        server_default="{}",
        comment="Alert recipients in E.164; empty falls back to ADMIN_WHATSAPP_NUMBERS",
    )
