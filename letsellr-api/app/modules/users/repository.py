"""
Module: Users
Repository — All DB queries for the users module

Pattern: Repository encapsulates all SQLAlchemy queries.
Services call the repository; routers call services.
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.users.models import User


class UserRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user: User) -> User:
        self.db.add(user)
        await self.db.flush()   # get ID without committing (session handles commit)
        await self.db.refresh(user)
        return user

    async def get_by_id(self, user_id: uuid.UUID | str) -> User | None:
        stmt = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.agency_profile))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_phone(self, phone: str) -> User | None:
        stmt = (
            select(User)
            .where(User.phone == phone)
            .options(selectinload(User.agency_profile))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_provider_uid(self, uid: str) -> User | None:
        stmt = (
            select(User)
            .where(User.auth_provider_uid == uid)
            .options(selectinload(User.agency_profile))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_users(
        self,
        role: str | None = None,
        status: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        """Paginated user list with optional filters."""
        stmt = select(User)
        if role:
            stmt = stmt.where(User.role == role)
        if status:
            stmt = stmt.where(User.status == status)

        # Count total
        from sqlalchemy import func
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await self.db.execute(count_stmt)).scalar_one()

        # Apply pagination
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        rows = (await self.db.execute(stmt)).scalars().all()

        return list(rows), total

    async def update(self, user: User, **kwargs) -> User:
        for key, value in kwargs.items():
            setattr(user, key, value)
        await self.db.flush()
        await self.db.refresh(user)
        return user
