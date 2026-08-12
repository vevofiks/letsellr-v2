"""add property source and external_id

Supports two-way sync with the client's CRM.

`source` records which system created a listing, so outbound delivery can skip
listings that arrived from the CRM and avoid an echo loop.

`external_id` is the CRM's own identifier, unique so a retried or replayed
webhook resolves to the existing row instead of inserting a second copy of the
same property under a fresh reference code.

Revision ID: f5a1c8e3b904
Revises: e3b9c1d47a52
Create Date: 2026-08-12

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f5a1c8e3b904"
down_revision: Union[str, None] = "e3b9c1d47a52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # server_default backfills existing rows in one pass; every listing that
    # predates the CRM integration was created on the website.
    op.add_column(
        "properties",
        sa.Column(
            "source",
            sa.String(length=20),
            nullable=False,
            server_default="web",
        ),
    )
    op.add_column(
        "properties", sa.Column("external_id", sa.String(length=100), nullable=True)
    )
    op.create_index("ix_properties_source", "properties", ["source"])
    # Unique over non-null values only: many rows have no CRM identifier, and
    # Postgres treats NULLs as distinct so they do not collide with each other.
    op.create_index(
        "ix_properties_external_id",
        "properties",
        ["external_id"],
        unique=True,
        postgresql_where=sa.text("external_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_properties_external_id", table_name="properties")
    op.drop_index("ix_properties_source", table_name="properties")
    op.drop_column("properties", "external_id")
    op.drop_column("properties", "source")
