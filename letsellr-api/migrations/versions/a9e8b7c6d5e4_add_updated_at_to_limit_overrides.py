"""add_updated_at_to_limit_overrides

Revision ID: a9e8b7c6d5e4
Revises: 3d4cadbd5a57
Create Date: 2026-07-28 17:30:00.000000
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "a9e8b7c6d5e4"
down_revision: Union[str, None] = "3d4cadbd5a57"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE limit_overrides
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    """)


def downgrade() -> None:
    op.execute("""
    ALTER TABLE limit_overrides
      DROP COLUMN IF EXISTS updated_at;
    """)
