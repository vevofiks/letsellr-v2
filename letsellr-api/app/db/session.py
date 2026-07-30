"""
Database — Async SQLAlchemy Engine & Session Factory

Uses asyncpg driver for maximum performance.
Session is managed via FastAPI's dependency injection (see depends/db.py).
"""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# ── Async Engine ──────────────────────────────────────────────────────────────
# pool_pre_ping=True: test connections before use (guards against stale connections)
# pool_size / max_overflow: tune based on your hosting plan
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,                   # disabled SQL query logs in development
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600,            # recycle connections after 1 hour
)

# ── Session Factory ───────────────────────────────────────────────────────────
# expire_on_commit=False → objects remain usable after session.commit()
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)
