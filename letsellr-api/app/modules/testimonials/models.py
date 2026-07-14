"""Module: Testimonials — ORM Model"""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, UUIDMixin


class Testimonial(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "testimonials"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(200), nullable=False)  # e.g. "Property Owner, Kochi"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    photo_key: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False, index=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
