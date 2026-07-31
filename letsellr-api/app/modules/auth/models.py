"""
Module: Auth
OTP Model — stores hashed OTPs for phone-based WhatsApp verification

One row per pending OTP. Rows are deleted after successful verification
or replaced on resend (upsert by phone).
"""

import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, UUIDMixin


class OTPRecord(UUIDMixin, Base):
    """
    Stores a hashed OTP for a given phone number.
    - Created on send-otp (login or registration).
    - Deleted on successful verification.
    - Replaced if a new OTP is requested for the same phone.
    """
    __tablename__ = "otp_records"

    phone: Mapped[str] = mapped_column(
        String(20), nullable=False, index=True,
        comment="Target phone number (E.164 format preferred)",
    )
    hashed_otp: Mapped[str] = mapped_column(
        String(256), nullable=False,
        comment="HMAC-SHA256 hash of the 6-digit OTP",
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
    payload: Mapped[dict | None] = mapped_column(
        JSON, nullable=True,
        comment="JSON dictionary of pending registration data",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False,
    )

    def __repr__(self) -> str:
        return f"<OTPRecord phone={self.phone} purpose={self.purpose} expires_at={self.expires_at}>"
