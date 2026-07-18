from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.depends.auth import CurrentUser, require_owner_or_agency
from app.depends.db import DbSession
from app.modules.properties.schemas import PropertyCreate, PropertyResponse, PropertyUpdate
from app.modules.properties.service import PropertyService
from app.modules.users.models import User

router = APIRouter(tags=["Properties"])


@router.get("", response_model=List[PropertyResponse])
async def list_properties(
    db: DbSession,
    intent: Optional[str] = None,
    category: Optional[str] = None,
    city: Optional[str] = None,
    lat: Optional[float] = Query(None, ge=-90.0, le=90.0, description="Latitude range: -90 to 90"),
    lng: Optional[float] = Query(None, ge=-180.0, le=180.0, description="Longitude range: -180 to 180"),
    radius: Optional[float] = Query(20.0, ge=0.0, description="Radius in kilometers"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """Public property browse."""
    service = PropertyService(db)
    return await service.list_public_properties(
        intent=intent,
        category=category,
        city=city,
        lat=lat,
        lng=lng,
        radius=radius,
        page=page,
        limit=limit,
    )


@router.post("", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    data: PropertyCreate,
    db: DbSession,
    current_user: User = Depends(require_owner_or_agency()),
):
    """Create a property listing (owner/agency only)."""
    service = PropertyService(db)
    return await service.create_property(data, current_user)


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(property_id: UUID, db: DbSession):
    """Get property details."""
    service = PropertyService(db)
    return await service.get_property(property_id)


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: UUID,
    data: PropertyUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Edit own listing."""
    service = PropertyService(db)
    return await service.update_property(property_id, data, current_user)


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Remove own listing."""
    service = PropertyService(db)
    await service.delete_property(property_id, current_user)


@router.get("/ref/{ref}/enquiry-link")
async def get_enquiry_link(ref: str, db: DbSession):
    """Returns wa.me deep link (PG/Hostel only)."""
    service = PropertyService(db)
    return await service.get_enquiry_link(ref)


@router.get("/owner/me", response_model=List[PropertyResponse])
async def get_owner_properties(current_user: CurrentUser, db: DbSession):
    """Own listings + stats."""
    service = PropertyService(db)
    return await service.list_owner_properties(current_user.id)
