"""
Dependency — Database Session

Provides an async SQLAlchemy session scoped to each HTTP request.
FastAPI closes and rolls back on errors automatically via the finally block.

Usage:
    async def my_route(db: DbSession) -> ...:
        result = await db.execute(...)
"""

from typing import Annotated, AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield a per-request DB session; close on exit."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Reusable type alias — use `DbSession` in route signatures
DbSession = Annotated[AsyncSession, Depends(get_db)]
