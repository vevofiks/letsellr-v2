"""
Module: Auth
OTP Model — stores hashed OTPs for email verification

One row per pending OTP. Rows are deleted after successful verification
or replaced on resend (upsert by email).
"""

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class OTPRecord(UUIDMixin, Base):
    """
    Stores a hashed OTP for a given email address.
    - Created on send-otp (login or registration).
    - Deleted on successful verification.
    - Replaced if a new OTP is requested for the same email.
    """
    __tablename__ = "otp_records"

    email: Mapped[str] = mapped_column(
        String(256), nullable=False, index=True,
        comment="Target email address",
    )
    hashed_otp: Mapped[str] = mapped_column(
        String(256), nullable=False,
        comment="bcrypt hash of the 6-digit OTP",
    )
    purpose: Mapped[str] = mapped_column(
        String(20), nullable=False, default="login",
        comment="login | registration",
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False,
        comment="OTP expiry timestamp",
    )
    # True once used — prevents replay attacks within the expiry window
    used: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )

    def __repr__(self) -> str:
        return f"<OTPRecord email={self.email} purpose={self.purpose} expires_at={self.expires_at}>"
