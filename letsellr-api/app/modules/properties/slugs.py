"""URL slug generation for property listings.

A listing URL should read as the listing: ``/properties/luxury-4-bhk-villa-near-
lulu-mall-edappally-kochi-prop9o77z6`` instead of a bare UUID. The words carry
the query terms people actually search ("villa", "edappally", "kochi"), and the
trailing reference code makes the slug unique by construction, so generation
never has to probe the database or retry on collision.
"""

import re
import unicodedata
import uuid

from app.modules.properties.refs import looks_like_ref

# Long URLs get truncated in search results, and the tail words carry the least
# weight anyway. Only the title is capped: the location is budgeted separately
# below so a rambling title can never push the city out of the slug, which is
# the single most valuable term for local search.
MAX_TITLE_LENGTH = 55


def _transliterate(value: str) -> str:
    """Best-effort ASCII form. Accents fold; non-Latin scripts drop out."""
    decomposed = unicodedata.normalize("NFKD", value)
    return decomposed.encode("ascii", "ignore").decode("ascii")


def slugify(value: str) -> str:
    """Lowercase, ASCII, hyphen-separated. Empty string if nothing survives."""
    ascii_value = _transliterate(value or "").lower()
    ascii_value = re.sub(r"[^a-z0-9]+", "-", ascii_value)
    return ascii_value.strip("-")


def _dedupe_words(words: list[str]) -> list[str]:
    """Drops repeated words, keeping first occurrence.

    Titles routinely repeat the location ("2BHK in Kochi" with city "Kochi"),
    and a slug reading ``...-kochi-kochi`` looks like spam to a reader and adds
    nothing for a crawler.
    """
    seen: set[str] = set()
    result: list[str] = []
    for word in words:
        if word and word not in seen:
            seen.add(word)
            result.append(word)
    return result


def ref_suffix(ref: str) -> str:
    """The reference code reduced to a URL-safe token, e.g. PROP-9O77Z6 -> prop9o77z6."""
    return re.sub(r"[^a-z0-9]+", "", (ref or "").lower())


def build_property_slug(
    title: str,
    location_area: str | None,
    location_city: str | None,
    ref: str,
) -> str:
    """Builds the canonical slug for a listing.

    The reference suffix is always present, so two listings sharing a title and
    location still get distinct slugs. If the descriptive part transliterates to
    nothing — a title written entirely in Malayalam, for instance — the slug
    degrades to just the reference rather than producing an empty path segment.
    """
    title_words = [w for w in slugify(title).split("-") if w]
    location_words = [
        w
        for part in (slugify(location_area or ""), slugify(location_city or ""))
        for w in part.split("-")
        if w
    ]

    # Trim the title to its budget a whole word at a time, then let the location
    # words through unconditionally. Deduping across both means a title that
    # already names the city does not produce "...-kochi-kochi".
    kept_title: list[str] = []
    length = 0
    for word in title_words:
        extra = len(word) + (1 if kept_title else 0)
        if length + extra > MAX_TITLE_LENGTH:
            break
        kept_title.append(word)
        length += extra

    words = _dedupe_words(kept_title + location_words)
    words_slug = "-".join(words)

    suffix = ref_suffix(ref)
    if not words_slug:
        return suffix or "listing"
    return f"{words_slug}-{suffix}" if suffix else words_slug


def looks_like_slug(value: str) -> bool:
    """True for values that can only be a slug, never a UUID or a reference code.

    UUIDs and reference codes are hyphenated too (LSR26-080001), so the presence
    of a hyphen proves nothing on its own.
    """
    if not value or "-" not in value:
        return False
    if looks_like_ref(value):
        return False
    try:
        uuid.UUID(value)
    except ValueError:
        return True
    return False
