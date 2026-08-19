"""add is_verified to properties

Revision ID: 322a3e67ee1c
Revises: f3fb6dbbac20
Create Date: 2026-08-19 14:30:00.000000
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "322a3e67ee1c"
down_revision: Union[str, None] = "f3fb6dbbac20"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "properties",
        sa.Column(
            "is_verified", sa.Boolean(), server_default=sa.text("false"), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_column("properties", "is_verified")
