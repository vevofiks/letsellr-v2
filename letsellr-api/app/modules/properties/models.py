"""
Module: Properties
ORM Models — Property and PropertyType
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, String, Text
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

    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    owner_role: Mapped[str] = mapped_column(String(20), nullable=False)  # "owner" | "agency"

    # Human-readable reference code for WhatsApp enquiries e.g. "KL-EKM-0412"
    ref: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="", nullable=False)

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
        comment="whatsapp (pg/hostel) | chat (others)",
    )

    # Pricing
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    deposit: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Location
    location_area: Mapped[str] = mapped_column(String(200), nullable=False)
    location_city: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    location_pincode: Mapped[str] = mapped_column(String(20), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Media
    photos: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    amenities: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    # Owner contact (revealed only through WhatsApp bot for PG/Hostel)
    owner_phone: Mapped[str] = mapped_column(String(20), nullable=False)

    # Status & Review
    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="draft", index=True,
        comment="draft | pending_review | live | rejected | expired | inactive",
    )
    review_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    stats: Mapped[dict] = mapped_column(
        JSONB, default=lambda: {"views": 0, "enquiries": 0}, nullable=False,
    )

    owner: Mapped["User"] = relationship("User", back_populates="properties")

    def __repr__(self) -> str:
        return f"<Property ref={self.ref} category={self.category} status={self.status}>"
