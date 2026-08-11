"""add_display_order_to_property_types

Revision ID: aeceffdbb023
Revises: c2d5f8b1e347
Create Date: 2026-08-11 20:48:24.566676
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'aeceffdbb023'
down_revision: Union[str, None] = 'c2d5f8b1e347'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "property_types",
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
    )


def downgrade() -> None:
    op.drop_column("property_types", "display_order")

