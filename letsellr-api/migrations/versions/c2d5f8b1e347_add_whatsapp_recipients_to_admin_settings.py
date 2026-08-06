"""add_whatsapp_recipients_to_admin_settings

Revision ID: c2d5f8b1e347
Revises: b1c4e7a9d203
Create Date: 2026-08-06 11:15:00.000000
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c2d5f8b1e347"
down_revision: Union[str, None] = "b1c4e7a9d203"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "admin_settings",
        sa.Column(
            "whatsapp_recipients",
            postgresql.ARRAY(sa.String()),
            nullable=False,
            server_default="{}",
            comment="Alert recipients in E.164; empty falls back to ADMIN_WHATSAPP_NUMBERS",
        ),
    )


def downgrade() -> None:
    op.drop_column("admin_settings", "whatsapp_recipients")
