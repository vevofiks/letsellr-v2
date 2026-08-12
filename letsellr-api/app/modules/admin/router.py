"""Module: Admin — Router stub (Phase 6)"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, UploadFile, File
from sqlalchemy.orm import selectinload
from sqlalchemy import select, func

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.users.models import User
from app.modules.admin.models import AdminSettings, VerificationRequest
from app.modules.admin.service import AdminSettingsService, effective_recipients
from app.modules.admin.schemas import (
    AdminAccountResponse,
    AdminCredentialsUpdate,
    AdminNotificationSettingsResponse,
    AdminNotificationSettingsUpdate,
    UserAdminResponse,
    VerificationRequestResponse,
    UpdateUserStatusRequest,
    VerificationActionRequest,
    DashboardStatsResponse,
    PropertyReviewActionRequest,
    PropertyTypeResponse,
    PropertyTypeCreate,
    PropertyTypeUpdate,
    PropertyTypeReorderRequest,
    LocationDataResponse,
    LocationDataCreate,
    LocationDataUpdate,
)
from app.modules.properties.models import Property, PropertyType, LocationData
from app.modules.properties.schemas import PropertyResponse, AdminPropertyCreate
from app.modules.properties.service import PropertyService
from app.modules.reviews.models import Review
from app.modules.webhooks.revucrm import dispatch_revucrm_property_webhook

router = APIRouter()


def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")


@router.get("/users", response_model=list[UserAdminResponse], tags=["Admin - Users"])
async def list_users(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(User)
        .options(selectinload(User.agency_profile))
        .order_by(User.created_at.desc())
    )
    return result.scalars().all()


@router.patch(
    "/users/{user_id}/status", response_model=UserAdminResponse, tags=["Admin - Users"]
)
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
                VerificationRequest.status == "pending",
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


@router.get(
    "/verification-requests",
    response_model=list[VerificationRequestResponse],
    tags=["Admin - Verifications"],
)
async def list_verification_requests(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(VerificationRequest).order_by(VerificationRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/verification-requests/{request_id}/approve", tags=["Admin - Verifications"]
)
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
        if user.status in ("suspended", "pending"):
            user.status = "active"

    await db.commit()
    return {"message": "Request approved"}


@router.post(
    "/verification-requests/{request_id}/reject", tags=["Admin - Verifications"]
)
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


@router.get(
    "/dashboard-stats",
    response_model=DashboardStatsResponse,
    tags=["Admin - Dashboard"],
)
async def get_dashboard_stats(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)

    pending_properties = await db.scalar(
        select(func.count(Property.id)).where(Property.status == "pending_review")
    )
    pending_kyc = await db.scalar(
        select(func.count(User.id)).where(
            (User.verification_status.in_(["pending", "review_request"]))
            | (User.status == "pending")
        )
    )
    total_users = await db.scalar(select(func.count(User.id)))
    total_properties = await db.scalar(select(func.count(Property.id)))
    active_properties = await db.scalar(
        select(func.count(Property.id)).where(Property.status == "live")
    )

    seekers_count = await db.scalar(
        select(func.count(User.id)).where(User.role == "user")
    )
    agencies_count = await db.scalar(
        select(func.count(User.id)).where(User.role == "agency")
    )
    owners_count = await db.scalar(
        select(func.count(User.id)).where(User.role == "owner")
    )
    admins_count = await db.scalar(
        select(func.count(User.id)).where(User.role == "admin")
    )

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


@router.post(
    "/properties",
    response_model=PropertyResponse,
    status_code=201,
    tags=["Admin - Properties"],
)
async def admin_create_property(
    data: AdminPropertyCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Admin creates a listing, attributed to an owner, an agency, or the admin itself."""
    require_admin(current_user)

    if data.listing_party == "admin":
        owner_user = current_user
    else:
        if not data.owner_id:
            raise HTTPException(
                status_code=400,
                detail="owner_id is required when listing_party is 'owner' or 'agency'",
            )
        owner_user = await db.get(User, data.owner_id)
        if not owner_user or owner_user.role != data.listing_party:
            raise HTTPException(
                status_code=400,
                detail=f"Selected user is not a valid {data.listing_party}",
            )

    service = PropertyService(db)
    return await service.create_property(data, current_user, owner_user=owner_user)


@router.get(
    "/properties/pending",
    response_model=list[PropertyResponse],
    tags=["Admin - Properties"],
)
async def list_pending_properties(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.owner))
        .where(Property.status == "pending_review")
        .order_by(Property.created_at.asc())
    )
    return result.scalars().all()


@router.get(
    "/properties/live",
    response_model=list[PropertyResponse],
    tags=["Admin - Properties"],
)
async def list_live_properties(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.owner))
        .where(Property.status == "live")
        .order_by(Property.created_at.desc())
    )
    return result.scalars().all()


@router.get(
    "/properties/rejected",
    response_model=list[PropertyResponse],
    tags=["Admin - Properties"],
)
async def list_rejected_properties(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.owner))
        .where(Property.status == "rejected")
        .order_by(Property.created_at.desc())
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
async def update_report_status(
    report_id: uuid.UUID, status: str, current_user: CurrentUser, db: DbSession
):
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

    # Owner/agency listing accepted out of review — push to revucrm now
    # (admin direct listings are pushed at creation time instead; see
    # PropertyService.create_property).
    dispatch_revucrm_property_webhook(property_obj)

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


@router.post(
    "/properties/{property_id}/toggle-feature",
    response_model=PropertyResponse,
    tags=["Admin - Properties"],
)
async def toggle_feature_property(
    property_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Admin toggle to feature / unfeature a property listing on the landing page."""
    require_admin(current_user)
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Property)
        .options(selectinload(Property.owner))
        .where(Property.id == property_id)
    )
    property_obj = result.scalars().first()
    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    property_obj.is_featured = not property_obj.is_featured
    await db.commit()

    result_updated = await db.execute(
        select(Property)
        .options(selectinload(Property.owner))
        .where(Property.id == property_id)
    )
    return result_updated.scalars().first()


@router.get(
    "/property-types",
    response_model=list[PropertyTypeResponse],
    tags=["Admin - Property Types"],
)
async def list_property_types(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(PropertyType).order_by(
            PropertyType.display_order.asc(), PropertyType.created_at.asc()
        )
    )
    return result.scalars().all()


@router.post(
    "/property-types/reorder",
    response_model=list[PropertyTypeResponse],
    tags=["Admin - Property Types"],
)
async def reorder_property_types(
    payload: PropertyTypeReorderRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    for item in payload.items:
        pt = await db.get(PropertyType, item.id)
        if pt:
            pt.display_order = item.display_order
    await db.commit()

    result = await db.execute(
        select(PropertyType).order_by(
            PropertyType.display_order.asc(), PropertyType.created_at.asc()
        )
    )
    return result.scalars().all()


@router.post(
    "/property-types",
    response_model=PropertyTypeResponse,
    tags=["Admin - Property Types"],
)
async def create_property_type(
    payload: PropertyTypeCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)

    # Check if slug exists
    existing = await db.execute(
        select(PropertyType).where(PropertyType.slug == payload.slug)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=400, detail="Property type with this slug already exists"
        )

    new_type = PropertyType(**payload.model_dump())
    db.add(new_type)
    await db.commit()
    await db.refresh(new_type)
    return new_type


@router.patch(
    "/property-types/{type_id}",
    response_model=PropertyTypeResponse,
    tags=["Admin - Property Types"],
)
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
        existing = await db.execute(
            select(PropertyType).where(PropertyType.slug == update_data["slug"])
        )
        if existing.scalars().first():
            raise HTTPException(
                status_code=400, detail="Property type with this slug already exists"
            )

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


@router.post(
    "/property-types/{type_id}/image",
    response_model=PropertyTypeResponse,
    tags=["Admin - Property Types"],
)
async def upload_property_type_image(
    type_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
):
    require_admin(current_user)
    property_type = await db.get(PropertyType, type_id)
    if not property_type:
        raise HTTPException(status_code=404, detail="Property type not found")

    from app.modules.media.service import MediaService

    media_service = MediaService()
    public_url, key = await media_service.upload_file(file, folder="category")

    if property_type.image_url:
        await media_service.delete_file_by_url(property_type.image_url)

    property_type.image_url = public_url
    await db.commit()
    await db.refresh(property_type)
    return property_type


@router.get(
    "/locations", response_model=list[LocationDataResponse], tags=["Admin - Locations"]
)
async def list_locations(current_user: CurrentUser, db: DbSession):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    result = await db.execute(
        select(LocationData).order_by(LocationData.created_at.desc())
    )
    return result.scalars().all()


@router.post(
    "/locations", response_model=LocationDataResponse, tags=["Admin - Locations"]
)
async def create_location(
    payload: LocationDataCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    new_location = LocationData(**payload.model_dump())
    db.add(new_location)
    await db.commit()
    await db.refresh(new_location)
    return new_location


@router.patch(
    "/locations/{location_id}",
    response_model=LocationDataResponse,
    tags=["Admin - Locations"],
)
async def update_location(
    location_id: uuid.UUID,
    payload: LocationDataUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
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
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    location = await db.get(LocationData, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    await db.delete(location)
    await db.commit()
    return {"message": "Location deleted successfully"}


@router.post(
    "/locations/{location_id}/image",
    response_model=LocationDataResponse,
    tags=["Admin - Locations"],
)
async def upload_location_image(
    location_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin required")
    location = await db.get(LocationData, location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    from app.modules.media.service import MediaService

    media_service = MediaService()
    public_url, key = await media_service.upload_file(file, folder="location")

    # Optionally delete old image if exists
    if location.image_url:
        await media_service.delete_file_by_url(location.image_url)

    location.image_url = public_url
    await db.commit()
    await db.refresh(location)
    return location


# ── User Limits Management ──────────────────────────────────────

from app.modules.users.models import User, LimitOverride
from app.modules.admin.schemas import UserLimitResponse, UserLimitUpdate


@router.get(
    "/users/{user_id}/limit", response_model=UserLimitResponse, tags=["Admin - Users"]
)
async def get_user_limit(
    user_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": user.id,
        "name": user.name,
        "phone": user.phone,
        "msg_limit": user.msg_limit,
        "msg_usage": user.msg_usage,
        "remaining": user.msg_limit - user.msg_usage,
        "limit_reached": user.msg_usage >= user.msg_limit,
    }


@router.patch(
    "/users/{user_id}/limit", response_model=UserLimitResponse, tags=["Admin - Users"]
)
async def update_user_limit(
    user_id: uuid.UUID,
    payload: UserLimitUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not payload.reset_usage and payload.msg_limit < user.msg_usage:
        raise HTTPException(
            status_code=400,
            detail="msg_limit cannot be less than current usage unless reset_usage is true",
        )

    old_limit = user.msg_limit
    old_usage = user.msg_usage

    new_limit = payload.msg_limit
    new_usage = 0 if payload.reset_usage else old_usage

    user.msg_limit = new_limit
    user.msg_usage = new_usage

    override = LimitOverride(
        user_id=user.id,
        old_limit=old_limit,
        new_limit=new_limit,
        old_usage=old_usage,
        new_usage=new_usage,
        reset_usage=payload.reset_usage,
        note=payload.note,
        payment_ref=payload.payment_ref,
        done_by=current_user.id,
    )
    db.add(override)
    await db.commit()
    await db.refresh(user)

    return {
        "user_id": user.id,
        "name": user.name,
        "phone": user.phone,
        "msg_limit": user.msg_limit,
        "msg_usage": user.msg_usage,
        "remaining": user.msg_limit - user.msg_usage,
        "limit_reached": user.msg_usage >= user.msg_limit,
    }


@router.delete("/reviews/{review_id}", status_code=204, tags=["Admin - Reviews"])
async def delete_property_review_admin(
    review_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    await db.delete(review)
    await db.commit()


# ── Settings ─────────────────────────────────────────────────────────────────


def _notification_response(
    settings_row: AdminSettings,
) -> AdminNotificationSettingsResponse:
    return AdminNotificationSettingsResponse(
        notify_pending_users=settings_row.notify_pending_users,
        notify_pending_properties=settings_row.notify_pending_properties,
        whatsapp_recipients=effective_recipients(settings_row),
        using_server_default=not settings_row.whatsapp_recipients,
    )


@router.get(
    "/settings/notifications",
    response_model=AdminNotificationSettingsResponse,
    tags=["Admin - Settings"],
)
async def get_notification_settings(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    settings_row = await AdminSettingsService(db).get_settings()
    await db.commit()
    return _notification_response(settings_row)


@router.patch(
    "/settings/notifications",
    response_model=AdminNotificationSettingsResponse,
    tags=["Admin - Settings"],
)
async def update_notification_settings(
    payload: AdminNotificationSettingsUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    settings_row = await AdminSettingsService(db).update_notifications(payload)
    await db.commit()
    return _notification_response(settings_row)


@router.get(
    "/settings/account", response_model=AdminAccountResponse, tags=["Admin - Settings"]
)
async def get_admin_account(current_user: CurrentUser):
    require_admin(current_user)
    return current_user


@router.patch(
    "/settings/account", response_model=AdminAccountResponse, tags=["Admin - Settings"]
)
async def update_admin_account(
    payload: AdminCredentialsUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Change the signed-in admin's login email and/or password."""
    require_admin(current_user)
    admin = await AdminSettingsService(db).update_credentials(current_user, payload)
    await db.commit()
    return admin
