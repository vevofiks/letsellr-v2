"""Module: Admin — Router stub (Phase 6)"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.users.models import User
from app.modules.admin.models import VerificationRequest
from app.modules.admin.schemas import (
    UserAdminResponse,
    VerificationRequestResponse,
    UpdateUserStatusRequest,
    VerificationActionRequest,
    DashboardStatsResponse,
    PropertyReviewActionRequest,
    PropertyTypeResponse,
    PropertyTypeCreate,
    PropertyTypeUpdate,
    LocationDataResponse,
    LocationDataCreate,
    LocationDataUpdate,
)
from app.modules.properties.models import Property, PropertyType, LocationData
from app.modules.properties.schemas import PropertyResponse

router = APIRouter()

def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")


@router.get("/users", response_model=list[UserAdminResponse], tags=["Admin - Users"])
async def list_users(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(User).options(selectinload(User.agency_profile)).order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/users/{user_id}/status", response_model=UserAdminResponse, tags=["Admin - Users"])
async def update_user_status(
    user_id: uuid.UUID,
    payload: UpdateUserStatusRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = payload.status
    if payload.status == "active":
        user.verification_status = "verified"
        res = await db.execute(
            select(VerificationRequest).where(
                VerificationRequest.user_id == user.id,
                VerificationRequest.status == "pending"
            )
        )
        for v_req in res.scalars().all():
            v_req.status = "approved"
            v_req.reviewed_by = current_user.id
    elif payload.status == "pending":
        user.verification_status = "pending"
    elif payload.status == "suspended":
        user.verification_status = "rejected"

    await db.commit()
    await db.refresh(user)
    return user


@router.get("/verification-requests", response_model=list[VerificationRequestResponse], tags=["Admin - Verifications"])
async def list_verification_requests(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(VerificationRequest).order_by(VerificationRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post("/verification-requests/{request_id}/approve", tags=["Admin - Verifications"])
async def approve_verification_request(
    request_id: uuid.UUID,
    payload: VerificationActionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    req = await db.get(VerificationRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Verification request not found")

    req.status = "approved"
    req.note = payload.note
    req.reviewed_by = current_user.id

    user = await db.get(User, req.user_id)
    if user:
        user.verification_status = "verified"
        user.verification_note = payload.note
        user.status = "active"

    await db.commit()
    return {"message": "Request approved"}


@router.post("/verification-requests/{request_id}/reject", tags=["Admin - Verifications"])
async def reject_verification_request(
    request_id: uuid.UUID,
    payload: VerificationActionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    req = await db.get(VerificationRequest, request_id)
    if not req:
        raise HTTPException(status_code=404, detail="Verification request not found")

    req.status = "rejected"
    req.note = payload.note
    req.reviewed_by = current_user.id

    user = await db.get(User, req.user_id)
    if user:
        user.verification_status = "rejected"
        user.verification_note = payload.note
        user.status = "suspended"

    await db.commit()
    return {"message": "Request rejected"}


@router.get("/dashboard-stats", response_model=DashboardStatsResponse, tags=["Admin - Dashboard"])
async def get_dashboard_stats(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)

    pending_properties = await db.scalar(select(func.count(Property.id)).where(Property.status == "pending_review"))
    pending_kyc = await db.scalar(
        select(func.count(User.id)).where(
            (User.verification_status.in_(["pending", "review_request"])) | (User.status == "pending")
        )
    )
    total_users = await db.scalar(select(func.count(User.id)))
    total_properties = await db.scalar(select(func.count(Property.id)))
    active_properties = await db.scalar(select(func.count(Property.id)).where(Property.status == "live"))
    
    seekers_count = await db.scalar(select(func.count(User.id)).where(User.role == "user"))
    agencies_count = await db.scalar(select(func.count(User.id)).where(User.role == "agency"))
    owners_count = await db.scalar(select(func.count(User.id)).where(User.role == "owner"))
    admins_count = await db.scalar(select(func.count(User.id)).where(User.role == "admin"))

    # Assuming no disputes model exists yet, defaulting to 0
    open_disputes = 0

    return DashboardStatsResponse(
        pending_property_reviews=pending_properties or 0,
        pending_kyc_reviews=pending_kyc or 0,
        open_disputes=open_disputes,
        total_users=total_users or 0,
        total_properties=total_properties or 0,
        active_properties=active_properties or 0,
        seekers_count=seekers_count or 0,
        agencies_count=agencies_count or 0,
        owners_count=owners_count or 0,
        admins_count=admins_count or 0,
    )


@router.get("/properties/pending", response_model=list[PropertyResponse], tags=["Admin - Properties"])
async def list_pending_properties(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(Property).where(Property.status == "pending_review").order_by(Property.created_at.asc())
    )
    return result.scalars().all()

@router.get("/properties/live", response_model=list[PropertyResponse], tags=["Admin - Properties"])
async def list_live_properties(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(Property).where(Property.status == "live").order_by(Property.created_at.desc())
    )
    return result.scalars().all()


@router.get("/properties/rejected", response_model=list[PropertyResponse], tags=["Admin - Properties"])
async def list_rejected_properties(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(Property).where(Property.status == "rejected").order_by(Property.created_at.desc())
    )
    return result.scalars().all()


@router.get("/reports", tags=["Admin - Reports"])
async def list_property_reports(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    from app.modules.properties.models import PropertyReport
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(PropertyReport)
        .options(selectinload(PropertyReport.property))
        .order_by(PropertyReport.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/reports/{report_id}/status", tags=["Admin - Reports"])
async def update_report_status(report_id: uuid.UUID, status: str, current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    from app.modules.properties.models import PropertyReport
    
    report = await db.get(PropertyReport, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    if status not in ["pending", "resolved", "dismissed"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    report.status = status
    await db.commit()
    return {"message": "Report status updated"}



@router.post("/properties/{property_id}/approve", tags=["Admin - Properties"])
async def approve_property(
    property_id: uuid.UUID,
    payload: PropertyReviewActionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    property_obj = await db.get(Property, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    property_obj.status = "live"
    property_obj.admin_reviewed_by = current_user.id
    property_obj.admin_reviewed_at = datetime.now(timezone.utc)
    property_obj.admin_review_reason = payload.reason

    await db.commit()
    return {"message": "Property approved successfully"}


@router.post("/properties/{property_id}/reject", tags=["Admin - Properties"])
async def reject_property(
    property_id: uuid.UUID,
    payload: PropertyReviewActionRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    property_obj = await db.get(Property, property_id)
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    property_obj.status = "rejected"
    property_obj.admin_reviewed_by = current_user.id
    property_obj.admin_reviewed_at = datetime.now(timezone.utc)
    property_obj.admin_review_reason = payload.reason

    await db.commit()
    return {"message": "Property rejected successfully"}


@router.get("/property-types", response_model=list[PropertyTypeResponse], tags=["Admin - Property Types"])
async def list_property_types(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(select(PropertyType).order_by(PropertyType.created_at.asc()))
    return result.scalars().all()


@router.post("/property-types", response_model=PropertyTypeResponse, tags=["Admin - Property Types"])
async def create_property_type(
    payload: PropertyTypeCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    
    # Check if slug exists
    existing = await db.execute(select(PropertyType).where(PropertyType.slug == payload.slug))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="Property type with this slug already exists")

    new_type = PropertyType(**payload.model_dump())
    db.add(new_type)
    await db.commit()
    await db.refresh(new_type)
    return new_type


@router.patch("/property-types/{type_id}", response_model=PropertyTypeResponse, tags=["Admin - Property Types"])
async def update_property_type(
    type_id: uuid.UUID,
    payload: PropertyTypeUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    property_type = await db.get(PropertyType, type_id)
    if not property_type:
        raise HTTPException(status_code=404, detail="Property type not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != property_type.slug:
        existing = await db.execute(select(PropertyType).where(PropertyType.slug == update_data["slug"]))
        if existing.scalars().first():
            raise HTTPException(status_code=400, detail="Property type with this slug already exists")

    for key, value in update_data.items():
        setattr(property_type, key, value)
    
    await db.commit()
    await db.refresh(property_type)
    return property_type


@router.delete("/property-types/{type_id}", tags=["Admin - Property Types"])
async def delete_property_type(
    type_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    property_type = await db.get(PropertyType, type_id)
    if not property_type:
        raise HTTPException(status_code=404, detail="Property type not found")

    await db.delete(property_type)
    await db.commit()
    return {"message": "Property type deleted successfully"}


@router.get("/locations", response_model=list[LocationDataResponse], tags=["Admin - Locations"])
async def list_locations(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(select(LocationData).order_by(LocationData.created_at.desc()))
    return result.scalars().all()


@router.post("/locations", response_model=LocationDataResponse, tags=["Admin - Locations"])
async def create_location(
    payload: LocationDataCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    new_location = LocationData(**payload.model_dump())
    db.add(new_location)
    await db.commit()
    await db.refresh(new_location)
    return new_location


@router.patch("/locations/{location_id}", response_model=LocationDataResponse, tags=["Admin - Locations"])
async def update_location(
    location_id: uuid.UUID,
    payload: LocationDataUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    location = await db.get(LocationData, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(location, key, value)
    
    await db.commit()
    await db.refresh(location)
    return location


@router.delete("/locations/{location_id}", tags=["Admin - Locations"])
async def delete_location(
    location_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    location = await db.get(LocationData, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    await db.delete(location)
    await db.commit()
    return {"message": "Location deleted successfully"}
