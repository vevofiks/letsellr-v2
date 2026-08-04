"""add_payload_to_otp_records

Revision ID: cc9d0971985c
Revises: 1df743668921
Create Date: 2026-08-01 04:21:02.948485
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "cc9d0971985c"
down_revision: Union[str, None] = "1df743668921"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "otp_records",
        sa.Column(
            "payload",
            sa.JSON(),
            nullable=True,
            comment="JSON dictionary of pending registration data",
        ),
    )


def downgrade() -> None:
    op.drop_column("otp_records", "payload")
