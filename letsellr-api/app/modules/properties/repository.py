import uuid
import math
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
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

    async def list_public(
        self,
        filters: Dict[str, Any],
        limit: int = 20,
        offset: int = 0,
        lat: Optional[float] = None,
        lng: Optional[float] = None,
        radius: Optional[float] = 20.0,
        sort_by: Optional[str] = None
    ) -> tuple[List[Property], int]:
        stmt = select(Property).where(Property.status == "live")
        
        if "category" in filters:
            stmt = stmt.where(Property.category == filters["category"])
        if "intent" in filters:
            stmt = stmt.where(Property.intent == filters["intent"])
        if "city" in filters:
            stmt = stmt.where(Property.location_city.ilike(f"%{filters['city']}%"))
        if "owner_id" in filters:
            stmt = stmt.where(Property.owner_id == filters["owner_id"])
        if "min_price" in filters:
            stmt = stmt.where(Property.price >= filters["min_price"])
        if "max_price" in filters:
            stmt = stmt.where(Property.price <= filters["max_price"])
            
        if lat is not None and lng is not None:
            radius = radius or 20.0
            # Prevent DivisionByZero or invalid input if lat/lng is null
            stmt = stmt.where(Property.latitude.isnot(None)).where(Property.longitude.isnot(None))
            
            # 1. Cheap bounding box pre-filtering
            # 1 degree of latitude is ~111 km
            d_lat = radius / 111.0
            
            # 1 degree of longitude is ~111 * cos(rad(lat)) km
            cos_lat = math.cos(math.radians(lat))
            if cos_lat > 0.01:
                d_lng = radius / (111.0 * cos_lat)
            else:
                d_lng = 360.0
                
            stmt = stmt.where(
                Property.latitude >= lat - d_lat,
                Property.latitude <= lat + d_lat,
                Property.longitude >= lng - d_lng,
                Property.longitude <= lng + d_lng
            )
            
            # 2. Clamped Haversine distance formula filtering & ordering
            rad_lat = func.radians(lat)
            rad_lng = func.radians(lng)
            
            inner_expr = (
                func.cos(rad_lat) * func.cos(func.radians(Property.latitude)) * 
                func.cos(func.radians(Property.longitude) - rad_lng) + 
                func.sin(rad_lat) * func.sin(func.radians(Property.latitude))
            )
            clamped_inner = func.greatest(-1.0, func.least(1.0, inner_expr))
            distance_expr = 6371.0 * func.acos(clamped_inner)
            
            stmt = stmt.where(distance_expr <= radius)
            
            if sort_by == "price_asc":
                stmt = stmt.order_by(Property.price.asc())
            elif sort_by == "price_desc":
                stmt = stmt.order_by(Property.price.desc())
            else:
                stmt = stmt.order_by(distance_expr.asc())
        else:
            if sort_by == "price_asc":
                stmt = stmt.order_by(Property.price.asc())
            elif sort_by == "price_desc":
                stmt = stmt.order_by(Property.price.desc())
            else:
                stmt = stmt.order_by(Property.created_at.desc())

        # Count total
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt) or 0

        stmt = stmt.limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        items = list(result.scalars().all())

        return items, total

    async def list_by_owner(self, owner_id: uuid.UUID) -> List[Property]:
        stmt = (
            select(Property)
            .where(Property.owner_id == owner_id)
            .order_by(Property.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
