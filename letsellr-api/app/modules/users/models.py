"""
Module: Users
ORM Models — User and AgencyProfile

Uses SQLAlchemy 2.0 mapped_column style with full type hints.
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.properties.models import Property
    from app.modules.admin.models import VerificationRequest


class User(UUIDMixin, TimestampMixin, Base):
    """
    Platform users — owners, agencies, and admins.
    Seekers/clients are NOT stored here (they enquire anonymously).
    """
    __tablename__ = "users"

    # ── Identity ──────────────────────────────────────────────────────────────
    auth_provider_uid: Mapped[str] = mapped_column(
        String(256), unique=True, nullable=False, index=True,
        comment="Firebase UID or Supabase UUID",
    )
    role: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True,
        comment="owner | agency | admin",
    )

    # ── Profile ───────────────────────────────────────────────────────────────
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str] = mapped_column(String(256), unique=True, nullable=False, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    preference_type: Mapped[str] = mapped_column(
        String(255), nullable=False,
        comment="e.g. 'residential'",
    )
    location_city: Mapped[str] = mapped_column(String(100), nullable=False)
    location_area: Mapped[str] = mapped_column(String(200), nullable=False)

    # ── Verification & Status ─────────────────────────────────────────────────
    verification_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="unverified", index=True,
        comment="unverified | review_request | verified | rejected",
    )
    verification_note: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="Admin rejection reason",
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", index=True,
        comment="active | suspended",
    )

    # ── Relationships ─────────────────────────────────────────────────────────
    agency_profile: Mapped["AgencyProfile | None"] = relationship(
        "AgencyProfile", back_populates="user", uselist=False, cascade="all, delete-orphan",
        lazy="selectin",
    )
    properties: Mapped[list["Property"]] = relationship(
        "Property",
        back_populates="owner",
        cascade="all, delete-orphan",
        foreign_keys="[Property.owner_id]"
    )
    verification_requests: Mapped[list["VerificationRequest"]] = relationship(
        "VerificationRequest",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="VerificationRequest.user_id",
    )

    def __repr__(self) -> str:
        return f"<User id={self.id} role={self.role} email={self.email}>"


class AgencyProfile(UUIDMixin, TimestampMixin, Base):
    """Extended profile for agency accounts (1-to-1 with User)."""
    __tablename__ = "agency_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        unique=True, nullable=False, index=True,
    )
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    about: Mapped[str] = mapped_column(Text, default="", nullable=False)
    logo_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    areas_served: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="agency_profile")

    def __repr__(self) -> str:
        return f"<AgencyProfile user_id={self.user_id} name={self.display_name}>"
