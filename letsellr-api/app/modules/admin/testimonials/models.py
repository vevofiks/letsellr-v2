import uuid
from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, UUIDMixin

class Testimonial(UUIDMixin, TimestampMixin, Base):
    """Testimonials displayed on the platform."""
    __tablename__ = "testimonials"

    author_name: Mapped[str] = mapped_column(String(100), nullable=False)
    author_role: Mapped[str] = mapped_column(String(50), nullable=False, comment="owner, seeker, agency")
    author_location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    content: Mapped[str] = mapped_column(String(300), nullable=False)
    avatar_key: Mapped[str | None] = mapped_column(String(500), nullable=True, comment="R2 object key")
    rating: Mapped[int | None] = mapped_column(Integer, nullable=True, comment="1-5")
    
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False, comment="pending, approved, rejected")
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, comment="False for soft deleted")

    def __repr__(self) -> str:
        return f"<Testimonial {self.author_name} role={self.author_role} status={self.status}>"
