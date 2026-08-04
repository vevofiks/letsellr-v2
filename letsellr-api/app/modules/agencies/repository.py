"""
Module: Agencies
Repository — DB queries for agencies (User with role='agency' + AgencyProfile)
"""

from typing import Any, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSession
from app.modules.properties.models import Property
from app.modules.users.models import AgencyProfile, User


class AgencyRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_agencies(
        self,
        city: Optional[str] = None,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Any]:
        """
        Return all active, verified agency users with their profiles
        and live listing counts.
        """
        # Sub-query: count live properties per owner
        live_count_sq = (
            select(Property.owner_id, func.count(Property.id).label("cnt"))
            .where(Property.status == "live")
            .group_by(Property.owner_id)
            .subquery()
        )

        stmt = (
            select(
                User,
                AgencyProfile,
                func.coalesce(live_count_sq.c.cnt, 0).label("listing_count"),
            )
            .join(AgencyProfile, AgencyProfile.user_id == User.id)
            .outerjoin(live_count_sq, live_count_sq.c.owner_id == User.id)
            .where(User.role == "agency")
            .where(User.status == "active")
        )

        if city and city != "My Location":
            search_pattern = f"%{city}%"
            from sqlalchemy import or_

            stmt = stmt.where(
                or_(
                    User.location_city.ilike(search_pattern),
                    User.location_area.ilike(search_pattern),
                    func.array_to_string(AgencyProfile.areas_served, ",").ilike(
                        search_pattern
                    ),
                )
            )

        stmt = stmt.order_by(User.created_at.desc()).limit(limit).offset(offset)
        result = await self.db.execute(stmt)
        return list(result.all())

    async def get_agency_by_id(self, user_id: UUID) -> Optional[Any]:
        """Return a single agency by User ID with listing count."""
        live_count_sq = (
            select(Property.owner_id, func.count(Property.id).label("cnt"))
            .where(Property.status == "live")
            .group_by(Property.owner_id)
            .subquery()
        )

        stmt = (
            select(
                User,
                AgencyProfile,
                func.coalesce(live_count_sq.c.cnt, 0).label("listing_count"),
            )
            .join(AgencyProfile, AgencyProfile.user_id == User.id)
            .outerjoin(live_count_sq, live_count_sq.c.owner_id == User.id)
            .where(User.id == user_id)
            .where(User.role == "agency")
        )

        result = await self.db.execute(stmt)
        return result.first()
