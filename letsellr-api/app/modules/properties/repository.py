import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSession
from app.modules.properties.models import Property


class PropertyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, property_data: dict) -> Property:
        db_obj = Property(**property_data)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def get_by_id(self, property_id: str | uuid.UUID) -> Optional[Property]:
        stmt = select(Property).where(Property.id == property_id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_ref(self, ref: str) -> Optional[Property]:
        stmt = select(Property).where(Property.ref == ref)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, db_obj: Property, update_data: Dict[str, Any]) -> Property:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        await self.db.flush()
        await self.db.refresh(db_obj)
        return db_obj

    async def delete(self, db_obj: Property) -> None:
        await self.db.delete(db_obj)
        await self.db.flush()

    async def list_public(self, filters: Dict[str, Any], limit: int = 20, offset: int = 0) -> List[Property]:
        stmt = select(Property).where(Property.status == "live")
        
        if "category" in filters:
            stmt = stmt.where(Property.category == filters["category"])
        if "intent" in filters:
            stmt = stmt.where(Property.intent == filters["intent"])
        if "city" in filters:
            stmt = stmt.where(Property.location_city.ilike(f"%{filters['city']}%"))
            
        stmt = stmt.limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def list_by_owner(self, owner_id: uuid.UUID) -> List[Property]:
        stmt = select(Property).where(Property.owner_id == owner_id)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
