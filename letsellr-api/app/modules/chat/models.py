"""
Module: Chat
ORM Models — Chat threads and Messages (for non-PG/Hostel enquiries)
"""

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class Chat(UUIDMixin, TimestampMixin, Base):
    """An enquiry chat thread between a seeker and an owner/agency."""

    __tablename__ = "chats"

    property_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Seeker is anonymous — store name + contact at initiation
    seeker_name: Mapped[str] = mapped_column(String(200), nullable=False)
    seeker_contact: Mapped[str] = mapped_column(String(256), nullable=False)
    seeker_session_id: Mapped[str] = mapped_column(
        String(256), nullable=False, index=True
    )

    status: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="open",
        comment="open | closed",
    )

    messages: Mapped[list["Message"]] = relationship(
        "Message",
        back_populates="chat",
        cascade="all, delete-orphan",
        order_by="Message.sent_at",
    )

    def __repr__(self) -> str:
        return (
            f"<Chat id={self.id} property_id={self.property_id} status={self.status}>"
        )


class Message(UUIDMixin, Base):
    """A single message within a chat thread."""

    __tablename__ = "messages"

    chat_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("chats.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        comment="seeker | owner",
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    from datetime import datetime
    from sqlalchemy import DateTime, func

    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    chat: Mapped["Chat"] = relationship("Chat", back_populates="messages")

    def __repr__(self) -> str:
        return f"<Message id={self.id} sender={self.sender}>"
