"""
Module: Admin
ORM Models — VerificationRequest
"""

import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class VerificationRequest(UUIDMixin, TimestampMixin, Base):
    """Admin verification request for owner/agency identity."""
    __tablename__ = "verification_requests"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True,
        comment="pending | approved | rejected",
    )
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True,
    )

    # Documents/evidence uploaded (R2 keys)
    from sqlalchemy.dialects.postgresql import ARRAY
    from sqlalchemy import String as Str
    document_keys: Mapped[list[str]] = mapped_column(ARRAY(Str), default=list, nullable=False)

    user: Mapped["User"] = relationship(  # type: ignore
        "User", back_populates="verification_requests", foreign_keys=[user_id],
    )
