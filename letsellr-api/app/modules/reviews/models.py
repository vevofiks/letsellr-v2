"""Module: Reviews — ORM Model"""

import uuid
from typing import TYPE_CHECKING
from sqlalchemy import Integer, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, UUIDMixin

if TYPE_CHECKING:
    from app.modules.users.models import User


class Review(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "reviews"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    target_type: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="property | agency"
    )
    target_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    reviewer_name: Mapped[str] = mapped_column(String(200), nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(
        String(20), default="approved", nullable=False, index=True
    )
    moderated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id])
