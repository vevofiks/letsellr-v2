"""add_report_fields_to_property_reports

Revision ID: f3fb6dbbac20
Revises: a1b2c3d4e5f6
Create Date: 2026-08-18 00:00:00.000000
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "f3fb6dbbac20"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "property_reports", sa.Column("property_ref", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "property_reports", sa.Column("reporter_phone", sa.String(length=20), nullable=True)
    )
    op.add_column(
        "property_reports", sa.Column("reporter_ip", sa.String(length=45), nullable=True)
    )
    op.alter_column(
        "property_reports",
        "reason",
        existing_type=sa.String(length=100),
        type_=sa.String(length=150),
        existing_nullable=False,
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    op.alter_column(
        "property_reports",
        "reason",
        existing_type=sa.String(length=150),
        type_=sa.String(length=100),
        existing_nullable=False,
    )
    op.drop_column("property_reports", "reporter_ip")
    op.drop_column("property_reports", "reporter_phone")
    op.drop_column("property_reports", "property_ref")
    # ### end Alembic commands ###
