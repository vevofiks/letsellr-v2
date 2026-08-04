"""add_limits_to_users

Revision ID: 3d4cadbd5a57
Revises: f20c6fef8f58
Create Date: 2026-07-28 00:04:37.872165
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3d4cadbd5a57"
down_revision: Union[str, None] = "f20c6fef8f58"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS msg_limit INTEGER NOT NULL DEFAULT 3,
      ADD COLUMN IF NOT EXISTS msg_usage INTEGER NOT NULL DEFAULT 0;
    """)

    op.execute("""
    CREATE TABLE IF NOT EXISTS limit_overrides (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      old_limit   INTEGER NOT NULL,
      new_limit   INTEGER NOT NULL,
      old_usage   INTEGER NOT NULL,
      new_usage   INTEGER NOT NULL,
      reset_usage BOOLEAN NOT NULL DEFAULT FALSE,
      note        TEXT NOT NULL,
      payment_ref TEXT,
      done_by     UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at  TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_limit_overrides_user_id ON limit_overrides (user_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_limit_overrides_created_at ON limit_overrides (created_at);"
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS limit_overrides;")
    op.execute("""
    ALTER TABLE users
      DROP COLUMN IF EXISTS msg_limit,
      DROP COLUMN IF EXISTS msg_usage;
    """)
