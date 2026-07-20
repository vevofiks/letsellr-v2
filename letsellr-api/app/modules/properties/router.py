"""
Module: Properties
Router — REST endpoints for property listings

Route order matters — FastAPI matches top-to-bottom.
Static path segments (/ref/{ref}/enquiry-link, /owner/me) MUST come
before parameterised routes (/{property_id}) to avoid collision.
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.depends.auth import CurrentUser, require_owner_or_agency
from app.depends.db import DbSession
from app.modules.properties.schemas import (
    EnquiryLinkResponse,
    PropertyBrowseResponse,
    PropertyCreate,
    PropertyResponse,
    PropertyUpdate,
    NearbyLocationsResponse,
)
from app.modules.properties.service import PropertyService
from app.modules.users.models import User

router = APIRouter(tags=["Properties"])


# ── Public Browse ──────────────────────────────────────────────────────────────

@router.get("", response_model=PropertyBrowseResponse)
async def list_properties(
    db: DbSession,
    intent: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    owner_id: Optional[UUID] = Query(None, description="Filter by agency or owner user ID"),
    min_price: Optional[int] = Query(None, ge=0),
    max_price: Optional[int] = Query(None, ge=0),
    sort_by: Optional[str] = Query(None, description="newest, price_asc, price_desc"),
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude range: -90 to 90"),
    lng: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude range: -180 to 180"),
    radius: Optional[float] = Query(20.0, ge=0.0, description="Radius in kilometers"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Public property browse — returns paginated live listings.

    **Filters:** category, intent, city (case-insensitive partial), owner_id, min/max price.
    **Sorting:** newest (default), price_asc, price_desc.
    """
    service = PropertyService(db)
    return await service.list_public_properties(
        intent=intent,
        category=category,
        city=city,
        owner_id=owner_id,
        min_price=min_price,
        max_price=max_price,
        sort_by=sort_by,
        lat=lat,
        lng=lng,
        radius=radius,
        page=page,
        limit=limit,
    )


# ── Static sub-paths — must be declared BEFORE /{property_id} ─────────────────

@router.get("/ref/{ref}/enquiry-link", response_model=EnquiryLinkResponse)
async def get_enquiry_link(ref: str, db: DbSession):
    """
    Generate a WhatsApp deep-link (wa.me URL) for a PG / Hostel listing.

    **How it works:**
    - Looks up the property by its human-readable `ref` code (e.g. `PROP-AB12CD`).
    - Validates the property is a `pg` or `hostel` (only these categories use
      WhatsApp-bot enquiry flow; other categories use in-platform chat).
    - Constructs a pre-filled `https://wa.me/<phone>?text=...` URL that opens
      the owner's WhatsApp with a greeting message referencing the property ref.

    This allows seekers to contact the owner directly — zero brokerage.
    The `enquiries` stat counter is incremented each time this endpoint is called.
    """
    service = PropertyService(db)
    return await service.get_enquiry_link(ref)


@router.get("/nearby-locations", response_model=NearbyLocationsResponse)
async def get_nearby_locations(
    db: DbSession,
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: int = Query(5000, description="Radius in meters (default 5000 = 5km)"),
):
    """
    Get up to 5 nearby locations (Places) within a given radius using Google Places API.
    """
    service = PropertyService(db)
    return await service.get_nearby_locations(lat, lng, radius)


@router.get("/owner/me", response_model=List[PropertyResponse])
async def get_owner_properties(current_user: CurrentUser, db: DbSession):
    """Own listings + stats for the authenticated owner/agency."""
    service = PropertyService(db)
    return await service.list_owner_properties(current_user.id)


# ── Single property by UUID ────────────────────────────────────────────────────

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: UUID, db: DbSession):
    """
    Full public details for a single property listing.

    Increments the `views` stat counter on every call.
    Returns 404 if the property is not found or not live.
    """
    service = PropertyService(db)
    return await service.get_property(property_id)


# ── Authenticated mutations ────────────────────────────────────────────────────

@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    db: DbSession,
    current_user: User = Depends(require_owner_or_agency()),
):
    """Create a property listing. Requires owner or agency role."""
    service = PropertyService(db)
    return await service.create_property(data, current_user)


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: UUID,
    data: PropertyUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Edit own listing. Only the listing owner or an admin may update."""
    service = PropertyService(db)
    return await service.update_property(property_id, data, current_user)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Remove own listing. Only the listing owner or an admin may delete."""
    service = PropertyService(db)
    await service.delete_property(property_id, current_user)
