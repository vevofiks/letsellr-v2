"""
Module: Agencies
Router — Public agency directory endpoints

GET /api/agencies          → list all agencies (filterable by city)
GET /api/agencies/{id}     → single agency public profile
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.depends.db import DbSession
from app.modules.agencies.schemas import AgencyPublicResponse
from app.modules.agencies.service import AgencyService

router = APIRouter(tags=["Agencies"])


@router.get("", response_model=List[AgencyPublicResponse])
async def list_agencies(
    db: DbSession,
    city: Optional[str] = Query(
        None, description="Filter by city name (partial match)"
    ),
    q: Optional[str] = Query(
        None, description="Search by agency name or location"
    ),
    page: int = Query(1, ge=1),
):
    """
    Public directory of all active agencies on the platform.

    Supports optional `city` filter and pagination via `page`.
    Each agency entry includes their display name, areas served,
    verification badge status, and live listing count.
    """
    service = AgencyService(db)
    return await service.list_agencies(city=city, q=q, page=page)

@router.get("/autocomplete")
async def autocomplete_agencies(
    q: str, db: DbSession, limit: int = 10
):
    """
    Autocomplete for agency display names or locations.
    """
    service = AgencyService(db)
    rows = await service.repo.list_agencies(q=q, limit=limit)
    
    results = []
    for user, profile, count in rows:
        results.append({
            "label": profile.display_name,
            "subtext": user.location_city
        })
    return results


@router.get("/{agency_id}", response_model=AgencyPublicResponse)
async def get_agency(agency_id: UUID, db: DbSession):
    """
    Public profile page for a single agency.

    Returns agency display info, areas served, verification status,
    and count of live listings on the platform.
    """
    service = AgencyService(db)
    return await service.get_agency(agency_id)
