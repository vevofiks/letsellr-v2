import uuid
import math
from typing import Any, Dict, List, Optional

from sqlalchemy import select, func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSession
from app.modules.properties.models import Property, PropertyRefCounter
from app.modules.users.models import User


class PropertyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, property_data: dict) -> Property:
        db_obj = Property(**property_data)
        self.db.add(db_obj)
        await self.db.flush()
        await self.db.refresh(db_obj)
        stmt = (
            select(Property)
            .options(selectinload(Property.owner).selectinload(User.agency_profile))
            .where(Property.id == db_obj.id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one()

    async def get_by_id(self, property_id: str | uuid.UUID) -> Optional[Property]:
        stmt = (
            select(Property)
            .options(selectinload(Property.owner).selectinload(User.agency_profile))
            .where(Property.id == property_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_ref(self, ref: str) -> Optional[Property]:
        stmt = (
            select(Property)
            .options(selectinload(Property.owner).selectinload(User.agency_profile))
            .where(Property.ref == ref)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def claim_ref_sequence(self, period: str) -> int:
        """Atomically claims and returns the next sequence number for a month.

        A single INSERT ... ON CONFLICT DO UPDATE ... RETURNING statement does
        the read, the increment and the write while holding the row lock, so
        concurrent submissions are handed distinct numbers. Doing this as a
        SELECT followed by an UPDATE would let two requests read the same value
        and then collide on the unique ref index.
        """
        stmt = (
            pg_insert(PropertyRefCounter)
            .values(period=period, last_value=1)
            .on_conflict_do_update(
                index_elements=[PropertyRefCounter.period],
                set_={"last_value": PropertyRefCounter.last_value + 1},
            )
            .returning(PropertyRefCounter.last_value)
        )
        result = await self.db.execute(stmt)
        return int(result.scalar_one())

    async def get_by_external_id(self, external_id: str) -> Optional[Property]:
        stmt = (
            select(Property)
            .options(selectinload(Property.owner).selectinload(User.agency_profile))
            .where(Property.external_id == external_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Property]:
        stmt = (
            select(Property)
            .options(selectinload(Property.owner).selectinload(User.agency_profile))
            .where(Property.slug == slug)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def update(self, db_obj: Property, update_data: Dict[str, Any]) -> Property:
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        await self.db.flush()
        await self.db.refresh(db_obj)
        stmt = (
            select(Property)
            .options(selectinload(Property.owner).selectinload(User.agency_profile))
            .where(Property.id == db_obj.id)
        )
        res = await self.db.execute(stmt)
        return res.scalar_one()

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
        sort_by: Optional[str] = None,
    ) -> tuple[List[Property], int]:
        stmt = select(Property).where(Property.status == "live")

        if "category" in filters:
            categories = [c for c in filters["category"].split(",") if c]
            if len(categories) > 1:
                stmt = stmt.where(Property.category.in_(categories))
            else:
                stmt = stmt.where(Property.category == categories[0])
        if "intent" in filters:
            stmt = stmt.where(Property.intent == filters["intent"])
        if "city" in filters:
            city_f = filters["city"].strip()
            if "," in city_f:
                p1, p2 = [p.strip() for p in city_f.split(",", 1)]
                stmt = stmt.where(
                    (Property.location_area.ilike(f"%{p1}%") & Property.location_city.ilike(f"%{p2}%")) |
                    (Property.location_city.ilike(f"%{p1}%") & Property.location_state.ilike(f"%{p2}%")) |
                    Property.location_area.ilike(f"%{p1}%") |
                    Property.location_city.ilike(f"%{p1}%")
                )
            else:
                stmt = stmt.where(
                    Property.location_city.ilike(f"%{city_f}%") | Property.location_area.ilike(f"%{city_f}%")
                )
        if "q" in filters and filters["q"]:
            q_term = f"%{filters['q']}%"
            stmt = stmt.where(
                Property.title.ilike(q_term)
                | Property.description.ilike(q_term)
                | Property.location_area.ilike(q_term)
                | Property.location_city.ilike(q_term)
            )
        if "owner_id" in filters:
            stmt = stmt.where(Property.owner_id == filters["owner_id"])
        if "min_price" in filters:
            stmt = stmt.where(Property.price >= filters["min_price"])
        if "max_price" in filters:
            stmt = stmt.where(Property.price <= filters["max_price"])
        if "gender_preference" in filters:
            stmt = stmt.where(Property.gender_preference == filters["gender_preference"])

        if lat is not None and lng is not None:
            radius = radius or 20.0
            # Prevent DivisionByZero or invalid input if lat/lng is null
            stmt = stmt.where(Property.latitude.isnot(None)).where(
                Property.longitude.isnot(None)
            )

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
                Property.longitude <= lng + d_lng,
            )

            # 2. Clamped Haversine distance formula filtering & ordering
            rad_lat = func.radians(lat)
            rad_lng = func.radians(lng)

            inner_expr = func.cos(rad_lat) * func.cos(
                func.radians(Property.latitude)
            ) * func.cos(func.radians(Property.longitude) - rad_lng) + func.sin(
                rad_lat
            ) * func.sin(
                func.radians(Property.latitude)
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

        # Count total using clean subquery (without eager loads)
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = await self.db.scalar(count_stmt) or 0

        # Execute item query with optimized eager loads
        fetch_stmt = (
            stmt.options(selectinload(Property.owner).selectinload(User.agency_profile))
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(fetch_stmt)
        items = list(result.scalars().all())

        return items, total

    async def list_by_owner(self, owner_id: uuid.UUID) -> List[Property]:
        stmt = (
            select(Property)
            .options(selectinload(Property.owner))
            .where(Property.owner_id == owner_id)
            .order_by(Property.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_properties_near_location(
        self, lat: float, lng: float, radius_km: float = 20.0, limit: int = 50
    ) -> List[Property]:
        stmt = (
            select(Property)
            .options(selectinload(Property.owner))
            .where(Property.status == "live")
            .where(Property.latitude.isnot(None))
            .where(Property.longitude.isnot(None))
        )
        d_lat = radius_km / 111.0
        cos_lat = math.cos(math.radians(lat))
        d_lng = radius_km / (111.0 * cos_lat) if cos_lat > 0.01 else 360.0

        stmt = stmt.where(
            Property.latitude >= lat - d_lat,
            Property.latitude <= lat + d_lat,
            Property.longitude >= lng - d_lng,
            Property.longitude <= lng + d_lng,
        )

        rad_lat = func.radians(lat)
        rad_lng = func.radians(lng)
        inner_expr = func.cos(rad_lat) * func.cos(
            func.radians(Property.latitude)
        ) * func.cos(func.radians(Property.longitude) - rad_lng) + func.sin(
            rad_lat
        ) * func.sin(
            func.radians(Property.latitude)
        )
        clamped_inner = func.greatest(-1.0, func.least(1.0, inner_expr))
        distance_expr = 6371.0 * func.acos(clamped_inner)

        stmt = (
            stmt.where(distance_expr <= radius_km)
            .order_by(distance_expr.asc())
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
