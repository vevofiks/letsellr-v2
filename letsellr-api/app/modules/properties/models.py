"""
Module: Properties
ORM Models — Property and PropertyType
"""

import uuid
from typing import TYPE_CHECKING

from datetime import datetime
from sqlalchemy import (
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    CheckConstraint,
    DateTime,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

from app.modules.users.models import User

OWNER_ALLOWED_CATEGORIES = {
    "pg",
    "hostel",
    "pg_hostel",
    "apartment",
    "flat_apartment",
    "villa_house",
    "land",
    "commercial",
    "coworking_space",
}
AGENCY_ALLOWED_CATEGORIES = {
    "apartment",
    "flat_apartment",
    "villa_house",
    "land",
    "commercial",
    "coworking_space",
}


class PropertyType(UUIDMixin, TimestampMixin, Base):
    """Admin-managed list of property categories shown on the platform."""

    __tablename__ = "property_types"

    slug: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    # Roles allowed to list in this category
    allowed_roles: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )

    def __repr__(self) -> str:
        return f"<PropertyType slug={self.slug}>"


class LocationData(UUIDMixin, TimestampMixin, Base):
    """Admin-managed list of important locations."""

    __tablename__ = "location_data"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    google_map_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_important: Mapped[bool] = mapped_column(default=False, nullable=False)

    def __repr__(self) -> str:
        return f"<LocationData title={self.title}>"


class PropertyReport(UUIDMixin, TimestampMixin, Base):
    """Reports submitted by users for fake, rogue, or unavailable properties."""

    __tablename__ = "property_reports"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    reporter_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    # Denormalized human-readable ref (e.g. "KL-EKM-0412") so admin can read
    # reports without joining, even if the property is later deleted.
    property_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)
    reason: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reporter_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # Captured silently server-side for abuse/rate-limiting, never shown to the reporter.
    reporter_ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="pending",
        index=True,
        comment="pending | resolved | dismissed",
    )

    property: Mapped["Property"] = relationship("Property", backref="reports")
    reporter: Mapped["User"] = relationship("User", foreign_keys=[reporter_id])

    def __repr__(self) -> str:
        return f"<PropertyReport property_id={self.property_id} reason={self.reason}>"


class Property(UUIDMixin, TimestampMixin, Base):
    """A property listing posted by an owner or agency."""

    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint(
            "owner_role != 'agency' OR category NOT IN ('pg', 'hostel')",
            name="agency_category_check",
        ),
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner_role: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # "owner" | "agency"

    # Human-readable reference code for WhatsApp enquiries e.g. "KL-EKM-0412"
    ref: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )

    # Which system created this listing: "web" | "crm".
    # Outbound sync reads this to avoid echoing a listing back to the CRM that
    # the CRM itself just sent us, which would otherwise loop indefinitely.
    source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="web", server_default="web", index=True
    )

    # The CRM's own identifier for this listing, when it originated there.
    # Unique so a retried or replayed webhook updates the existing row instead
    # of inserting a second copy of the same property under a new ref.
    external_id: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True, index=True
    )

    # URL slug, e.g. "luxury-4-bhk-villa-near-lulu-mall-edappally-kochi-prop9o77z6".
    # Written once at creation and deliberately not regenerated when the title
    # changes: a listing's URL is what gets indexed and shared, so it has to
    # stay put. Nullable so rows created before the backfill still load.
    slug: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True
    )

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
        comment="pg | hostel | apartment | villa_house | land | commercial | coworking_space",
    )
    intent: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True,
        comment="rent | buy | lease",
    )
    enquiry_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="whatsapp_bot | manual_chat",
    )

    # Details
    area: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="sq ft")
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    furnishing: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="unfurnished | semi | furnished"
    )
    gender_preference: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="any | ladies | men | family"
    )
    extra_details: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True, comment="Flexible field for PG sharing, vacancies, etc."
    )

    # Pricing
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    price_unit: Mapped[str] = mapped_column(
        String(20), nullable=False, default="total", comment="per_month | total"
    )
    deposit: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Location
    location_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    location_area: Mapped[str] = mapped_column(String(200), nullable=False)
    location_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location_pincode: Mapped[str] = mapped_column(String(20), nullable=False)
    location_state: Mapped[str] = mapped_column(String(100), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Media
    photos: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )
    video_link: Mapped[str | None] = mapped_column(
        String(1000), nullable=True, comment="Direct URL or iframe embed code"
    )
    amenities: Mapped[list[str]] = mapped_column(
        ARRAY(String), default=list, nullable=False
    )

    # Owner contact
    owner_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_whatsapp: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Status & Review
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="draft",
        index=True,
        comment="draft | pending_review | live | rejected | expired | inactive",
    )
    admin_reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    admin_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    admin_review_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Availability
    availability_confirmed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    availability_expires_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    is_featured: Mapped[bool] = mapped_column(default=False, nullable=False)

    stats: Mapped[dict] = mapped_column(
        JSONB,
        default=lambda: {"views": 0, "enquiries": 0, "saves": 0},
        nullable=False,
    )

    owner: Mapped["User"] = relationship(
        "User", back_populates="properties", foreign_keys=[owner_id]
    )

    def __repr__(self) -> str:
        return (
            f"<Property ref={self.ref} category={self.category} status={self.status}>"
        )


class PropertyRefCounter(Base):
    """Per-month counter behind the LSR26-080001 reference codes.

    One row per year+month. Kept in its own table rather than derived from
    MAX(properties.ref) so the next value can be claimed atomically: reading the
    highest existing code and adding one lets two concurrent submissions read
    the same number and collide on the unique ref index.
    """

    __tablename__ = "property_ref_counters"

    # "YYYYMM" — see refs.period_key.
    period: Mapped[str] = mapped_column(String(6), primary_key=True)
    last_value: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    def __repr__(self) -> str:
        return f"<PropertyRefCounter period={self.period} last_value={self.last_value}>"
