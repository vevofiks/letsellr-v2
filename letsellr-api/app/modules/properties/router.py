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
    PropertyReportCreate,
)
from app.modules.properties.service import PropertyService
from app.modules.users.models import User

router = APIRouter(tags=["Properties"])


# ── Public Browse ──────────────────────────────────────────────────────────────

@router.get("/featured", response_model=List[PropertyResponse])
async def get_featured_properties(db: DbSession, limit: int = Query(8, ge=1, le=20)):
    """
    Public endpoint to fetch admin-featured properties for landing page showcase.
    Orders featured properties first, followed by recent live listings.
    """
    from sqlalchemy import select
    from sqlalchemy.orm import selectinload
    from app.modules.properties.models import Property
    
    query = (
        select(Property)
        .options(selectinload(Property.owner))
        .where(Property.status == "live")
        .order_by(Property.is_featured.desc(), Property.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("", response_model=PropertyBrowseResponse)
async def list_properties(
    db: DbSession,
    intent: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    owner_id: Optional[UUID] = None,
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

    **Filters:** category, intent, city (case-insensitive partial), min/max price, owner_id.
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
async def get_enquiry_link(ref: str, db: DbSession, current_user: CurrentUser):
    """
    Generate a WhatsApp deep-link (wa.me URL) for a PG / Hostel listing.

    Requires authentication via Bearer token.
    Increments the property's `enquiries` and `views` stat counters on each call.
    """
    service = PropertyService(db)
    return await service.get_enquiry_link(ref, current_user.id)


@router.get("/nearby-locations", response_model=NearbyLocationsResponse)
async def get_nearby_locations(
    db: DbSession,
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    radius: float = Query(5000, description="Radius in meters (e.g. 5000 = 5km) or kilometers"),
):
    """
    Get live properties and places within a given preferred radius (in meters or km) from coordinates.
    """
    service = PropertyService(db)
    return await service.get_nearby_locations(lat, lng, radius)


@router.get("/owner/me", response_model=List[PropertyResponse])
async def get_owner_properties(current_user: CurrentUser, db: DbSession):
    """Own listings + stats for the authenticated owner/agency."""
    service = PropertyService(db)
    return await service.list_owner_properties(current_user.id)


# ── Single property by UUID or Property Code (ref) ───────────────────────────

@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: str,
    db: DbSession,
):
    """
    Full details for a single property listing (by UUID or Property Ref Code e.g. PROP-AB12CD).
    Public access — no authentication required.

    Returns 404 if the property is not found.
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


@router.post("/{property_id}/report", status_code=status.HTTP_201_CREATED)
async def report_property(
    property_id: UUID,
    data: PropertyReportCreate,
    db: DbSession,
    current_user: CurrentUser,
):
    """Report a property listing."""
    service = PropertyService(db)
    await service.report_property(property_id, data.reason, data.description, current_user.id)
    return {"message": "Report submitted successfully"}

@router.get("/config/types", tags=["Properties"])
async def list_active_property_types(db: DbSession):
    """Get active property types for listing form."""
    from sqlalchemy import select
    from app.modules.properties.models import PropertyType
    from app.modules.admin.schemas import PropertyTypeResponse
    
    result = await db.execute(select(PropertyType).where(PropertyType.is_active == True).order_by(PropertyType.label.asc()))
    types = result.scalars().all()
    return [PropertyTypeResponse.model_validate(t) for t in types]

@router.get("/config/locations", tags=["Properties"])
async def list_active_locations(db: DbSession):
    """Get all locations for the landing page showcase."""
    from sqlalchemy import select
    from app.modules.properties.models import LocationData
    from app.modules.admin.schemas import LocationDataResponse
    
    result = await db.execute(select(LocationData).order_by(LocationData.is_important.desc(), LocationData.title.asc()))
    locations = result.scalars().all()
    return [LocationDataResponse.model_validate(loc) for loc in locations]


@router.get("/autocomplete/locations", response_model=list[str], tags=["Properties"])
async def autocomplete_locations(
    q: str,
    db: DbSession,
    limit: int = 10
):
    """Get location suggestions based on prefix search."""
    from sqlalchemy import select, or_
    from app.modules.properties.models import Property, LocationData
    
    if len(q) < 2:
        return []

    stmt = (
        select(Property.location_area, Property.location_city)
        .where(
            or_(
                Property.location_area.ilike(f"{q}%"),
                Property.location_city.ilike(f"{q}%"),
                Property.location_area.ilike(f"% {q}%"),
                Property.location_city.ilike(f"% {q}%")
            )
        )
        .where(Property.status == "live")
        .distinct()
        .limit(limit)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    locations = set()
    for area, city in rows:
        if area and city and area.lower() != city.lower() and area.lower() != "n/a":
            locations.add(f"{area}, {city}")
        elif city:
            locations.add(city)
            
    # Also fetch from LocationData table
    loc_stmt = (
        select(LocationData.title)
        .where(LocationData.title.ilike(f"%{q}%"))
        .limit(limit)
    )
    loc_result = await db.execute(loc_stmt)
    loc_rows = loc_result.scalars().all()
    
    for title in loc_rows:
        locations.add(title)
        
    return sorted(list(locations))[:limit]
