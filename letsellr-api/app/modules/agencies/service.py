"""
Module: Agencies
Service — Business logic for agency profile reads
"""

from typing import Optional
from uuid import UUID

from fastapi import HTTPException, status

from app.db.session import AsyncSession
from app.modules.agencies.repository import AgencyRepository
from app.modules.agencies.schemas import AgencyPublicResponse
from app.modules.users.models import AgencyProfile, User


def _build_response(user: User, profile: AgencyProfile, listing_count: int) -> AgencyPublicResponse:
    return AgencyPublicResponse(
        id=user.id,
        display_name=profile.display_name,
        about=profile.about,
        logo_key=profile.logo_key,
        areas_served=profile.areas_served,
        location_city=user.location_city,
        location_area=user.location_area,
        verification_status=user.verification_status,
        member_since=user.created_at,
        total_listings=listing_count,
    )


class AgencyService:
    def __init__(self, db: AsyncSession):
        self.repo = AgencyRepository(db)

    async def list_agencies(
        self,
        city: Optional[str] = None,
        page: int = 1,
    ) -> list[AgencyPublicResponse]:
        limit = 20
        offset = (page - 1) * limit
        rows = await self.repo.list_agencies(city=city, limit=limit, offset=offset)
        return [_build_response(user, profile, count) for user, profile, count in rows]

    async def get_agency(self, agency_id: UUID) -> AgencyPublicResponse:
        row = await self.repo.get_agency_by_id(agency_id)
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Agency not found.",
            )
        user, profile, count = row
        return _build_response(user, profile, count)
