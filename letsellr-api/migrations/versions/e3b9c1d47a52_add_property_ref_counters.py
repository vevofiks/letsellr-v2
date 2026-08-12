"""add property ref counters

Backing table for the sequential reference codes (LSR26-080001). One row per
year+month holds the last number handed out, claimed atomically at creation.

Existing listings keep their legacy PROP-XXXXXX codes. They are deliberately
not renumbered: the reference is embedded in each listing's slug, so rewriting
it would change every indexed URL and break links already shared over WhatsApp.

Revision ID: e3b9c1d47a52
Revises: d7f2a4c9b118
Create Date: 2026-08-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "e3b9c1d47a52"
down_revision: Union[str, None] = "d7f2a4c9b118"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "property_ref_counters",
        # "YYYYMM"
        sa.Column("period", sa.String(length=6), nullable=False),
        sa.Column("last_value", sa.Integer(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("period"),
    )


def downgrade() -> None:
    op.drop_table("property_ref_counters")
