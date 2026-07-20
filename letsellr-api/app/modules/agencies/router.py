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
from app.modules.agencies.schemas import AgencyPublicResponse, AgencyBrowseResponse
from app.modules.agencies.service import AgencyService

router = APIRouter(tags=["Agencies"])


@router.get("", response_model=AgencyBrowseResponse)
async def list_agencies(
    db: DbSession,
    city: Optional[str] = Query(None, description="Filter by city name (partial match)"),
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=100),
):
    """
    Public directory of all active agencies on the platform.

    Supports optional `city` filter and pagination via `page` and `limit`.
    Each agency entry includes display info, areas served,
    verification status, and live listing count.
    """
    service = AgencyService(db)
    return await service.list_agencies(city=city, page=page, limit=limit)


@router.get("/{agency_id}", response_model=AgencyPublicResponse)
async def get_agency(agency_id: UUID, db: DbSession):
    """
    Public profile page for a single agency.

    Returns agency display info, areas served, verification status,
    and count of live listings on the platform.
    """
    service = AgencyService(db)
    return await service.get_agency(agency_id)
