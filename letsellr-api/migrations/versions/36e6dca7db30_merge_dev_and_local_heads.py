"""merge_dev_and_local_heads

Revision ID: 36e6dca7db30
Revises: 55a48a0834f8, a9e8b7c6d5e4
Create Date: 2026-07-29 21:51:24.404661
"""
from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '36e6dca7db30'
down_revision: Union[str, None] = ('55a48a0834f8', 'a9e8b7c6d5e4')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
