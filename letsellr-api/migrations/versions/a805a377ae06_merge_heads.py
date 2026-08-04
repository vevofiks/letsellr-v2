"""merge_heads

Revision ID: a805a377ae06
Revises: 57a18659292a, ac52ee65b660
Create Date: 2026-07-20 16:20:27.257874
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "a805a377ae06"
down_revision: Union[str, None] = "ac52ee65b660"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
