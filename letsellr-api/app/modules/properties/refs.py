"""Property reference code generation.

Codes read ``LSR26-080001``:

    LSR    Letsellr
    26     year, last two digits (2026)
    08     month (August)
    0001   sequence within that month

The sequence restarts at 1 on every month boundary, so September 2026 begins
at ``LSR26-090001`` and January 2027 at ``LSR27-010001``.
"""

import re
from datetime import datetime
from zoneinfo import ZoneInfo

# The business and its listings are in India, so the month has to turn over at
# midnight IST. The application servers do not run on IST — production rows
# carry a +02:00 offset — so deriving the period from local or UTC time would
# roll the counter over at the wrong moment and mislabel listings created in
# the evening.
BUSINESS_TIMEZONE = ZoneInfo("Asia/Kolkata")

REF_PREFIX = "LSR"
SEQUENCE_WIDTH = 4

# Legacy random codes (PROP-9O77Z6) plus the current sequential format. Used to
# tell a reference apart from a slug, since both contain a hyphen.
REF_PATTERN = re.compile(rf"^(PROP-[A-Z0-9]+|{REF_PREFIX}\d{{2}}-\d{{2}}\d+)$", re.IGNORECASE)


def current_period(now: datetime | None = None) -> tuple[int, int]:
    """(year, month) in the business timezone."""
    moment = (now or datetime.now(BUSINESS_TIMEZONE)).astimezone(BUSINESS_TIMEZONE)
    return moment.year, moment.month


def period_key(year: int, month: int) -> str:
    """Counter key for a month, e.g. 2026-08 -> "202608"."""
    return f"{year:04d}{month:02d}"


def format_ref(year: int, month: int, sequence: int) -> str:
    """Renders a reference code.

    A month that runs past 9999 listings widens the sequence rather than
    wrapping, because truncating it would collide with an existing code.
    """
    return f"{REF_PREFIX}{year % 100:02d}-{month:02d}{sequence:0{SEQUENCE_WIDTH}d}"


def looks_like_ref(value: str) -> bool:
    """True for a legacy or current reference code."""
    return bool(REF_PATTERN.match((value or "").strip()))
