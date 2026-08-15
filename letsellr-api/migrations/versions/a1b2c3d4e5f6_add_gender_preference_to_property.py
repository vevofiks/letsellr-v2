"""add gender_preference to property

Revision ID: a1b2c3d4e5f6
Revises: f5a1c8e3b904
Create Date: 2026-08-15 00:00:00.000000
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "f5a1c8e3b904"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column(
            "gender_preference",
            sa.String(length=20),
            nullable=True,
            comment="any | ladies | men | family",
        ),
    )


def downgrade() -> None:
    op.drop_column("properties", "gender_preference")
