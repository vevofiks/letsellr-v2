"""add slug to properties

Adds the URL slug used for listing detail pages and backfills every existing
row, so the sitemap and canonical URLs can switch over in one deploy rather
than emitting a mix of slugs and UUIDs.

The slug logic is duplicated here rather than imported from
app.modules.properties.slugs on purpose: a migration has to keep producing the
same output forever, and rebuilding the database from scratch must not depend
on application code that may since have moved or changed.

Revision ID: d7f2a4c9b118
Revises: aeceffdbb023
Create Date: 2026-08-12

"""

import re
import unicodedata
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d7f2a4c9b118"
down_revision: Union[str, None] = "aeceffdbb023"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

MAX_TITLE_LENGTH = 55


def _slugify(value: str) -> str:
    ascii_value = (
        unicodedata.normalize("NFKD", value or "")
        .encode("ascii", "ignore")
        .decode("ascii")
        .lower()
    )
    return re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")


def _build_slug(title, location_area, location_city, ref) -> str:
    title_words = [w for w in _slugify(title or "").split("-") if w]
    location_words = [
        w
        for part in (_slugify(location_area or ""), _slugify(location_city or ""))
        for w in part.split("-")
        if w
    ]

    kept: list[str] = []
    length = 0
    for word in title_words:
        extra = len(word) + (1 if kept else 0)
        if length + extra > MAX_TITLE_LENGTH:
            break
        kept.append(word)
        length += extra

    seen: set[str] = set()
    words: list[str] = []
    for word in kept + location_words:
        if word and word not in seen:
            seen.add(word)
            words.append(word)

    words_slug = "-".join(words)
    suffix = re.sub(r"[^a-z0-9]+", "", (ref or "").lower())
    if not words_slug:
        return suffix or "listing"
    return f"{words_slug}-{suffix}" if suffix else words_slug


def upgrade() -> None:
    op.add_column("properties", sa.Column("slug", sa.String(length=255), nullable=True))

    # Backfill before creating the unique index, so a duplicate would surface
    # here as a clear index failure rather than silently shipping two listings
    # on one URL. The slug embeds the (already unique) ref, so collisions should
    # not be reachable.
    connection = op.get_bind()
    rows = connection.execute(
        sa.text("SELECT id, title, location_area, location_city, ref FROM properties")
    ).fetchall()

    for row in rows:
        connection.execute(
            sa.text("UPDATE properties SET slug = :slug WHERE id = :id"),
            {
                "slug": _build_slug(
                    row.title, row.location_area, row.location_city, row.ref
                ),
                "id": row.id,
            },
        )

    op.create_index("ix_properties_slug", "properties", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_properties_slug", table_name="properties")
    op.drop_column("properties", "slug")
