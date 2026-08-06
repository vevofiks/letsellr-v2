"""add_admin_settings

Revision ID: b1c4e7a9d203
Revises: cc9d0971985c
Create Date: 2026-08-06 10:00:00.000000
"""

from __future__ import annotations

import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b1c4e7a9d203"
down_revision: Union[str, None] = "cc9d0971985c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_settings",
        sa.Column("id", sa.UUID(as_uuid=True), nullable=False, default=uuid.uuid4),
        sa.Column(
            "notify_pending_users",
            sa.Boolean(),
            nullable=False,
            server_default="true",
            comment="WhatsApp the admin when an owner/agency awaits approval",
        ),
        sa.Column(
            "notify_pending_properties",
            sa.Boolean(),
            nullable=False,
            server_default="true",
            comment="WhatsApp the admin when a listing enters the review queue",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_admin_settings_id"), "admin_settings", ["id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_admin_settings_id"), table_name="admin_settings")
    op.drop_table("admin_settings")
