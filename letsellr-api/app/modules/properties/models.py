"""
Module: Properties
ORM Models — Property and PropertyType
"""

import uuid
from typing import TYPE_CHECKING

from datetime import datetime
from sqlalchemy import Float, ForeignKey, Integer, String, Text, CheckConstraint, DateTime
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.users.models import User


OWNER_ALLOWED_CATEGORIES = {"pg", "hostel", "apartment", "villa_house", "land", "commercial"}
AGENCY_ALLOWED_CATEGORIES = {"apartment", "villa_house", "land", "commercial"}


class PropertyType(UUIDMixin, TimestampMixin, Base):
    """Admin-managed list of property categories shown on the platform."""
    __tablename__ = "property_types"

    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    # Roles allowed to list in this category
    allowed_roles: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    def __repr__(self) -> str:
        return f"<PropertyType slug={self.slug}>"


class Property(UUIDMixin, TimestampMixin, Base):
    """A property listing posted by an owner or agency."""
    __tablename__ = "properties"
    __table_args__ = (
        CheckConstraint(
            "owner_role != 'agency' OR category NOT IN ('pg', 'hostel')",
            name="agency_category_check"
        ),
    )

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    owner_role: Mapped[str] = mapped_column(String(20), nullable=False)  # "owner" | "agency"

    # Human-readable reference code for WhatsApp enquiries e.g. "KL-EKM-0412"
    ref: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="pg | hostel | apartment | villa_house | land | commercial",
    )
    intent: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True,
        comment="rent | buy | lease",
    )
    enquiry_type: Mapped[str] = mapped_column(
        String(20), nullable=False,
        comment="whatsapp_bot | manual_chat",
    )

    # Details
    area: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="sq ft")
    bedrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    furnishing: Mapped[str | None] = mapped_column(
        String(20), nullable=True, comment="unfurnished | semi | furnished"
    )
    extra_details: Mapped[dict | None] = mapped_column(JSONB, nullable=True, comment="Flexible field for PG sharing, vacancies, etc.")

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
    photos: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    video_link: Mapped[str | None] = mapped_column(String(1000), nullable=True, comment="Direct URL or iframe embed code")
    amenities: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    # Owner contact
    owner_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_whatsapp: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Status & Review
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="draft", index=True,
        comment="draft | pending_review | live | rejected | expired | inactive",
    )
    admin_reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    admin_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    admin_review_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Availability
    availability_confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    availability_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    stats: Mapped[dict] = mapped_column(
        JSONB, default=lambda: {"views": 0, "enquiries": 0, "saves": 0}, nullable=False,
    )

    owner: Mapped["User"] = relationship("User", back_populates="properties", foreign_keys=[owner_id])

    def __repr__(self) -> str:
        return f"<Property ref={self.ref} category={self.category} status={self.status}>"
