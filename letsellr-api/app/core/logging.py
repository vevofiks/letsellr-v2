"""
Structured Logging Configuration

Uses Python's built-in logging with a clean format for dev
and JSON-ready format for production.
"""

import logging
import sys

from app.core.config import settings


def configure_logging() -> None:
    """Configure root logger. Call once at app startup."""
    level = logging.DEBUG if settings.DEBUG else logging.INFO

    fmt = (
        "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d — %(message)s"
        if settings.DEBUG
        else "%(levelname)s | %(name)s — %(message)s"
    )

    logging.basicConfig(
        level=level,
        format=fmt,
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[logging.StreamHandler(sys.stdout)],
    )

    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )
