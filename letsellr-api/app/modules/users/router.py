"""
Module: Users
Router — owner/agency profile management
"""

from fastapi import APIRouter

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.users.schemas import (
    UserProfileResponse,
    UserUpdateRequest,
    VerificationSubmitRequest,
    ChangePinRequest,
)

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: CurrentUser) -> UserProfileResponse:
    """Get the authenticated user's full profile."""
    return UserProfileResponse.model_validate(current_user)


@router.put("/me", response_model=UserProfileResponse)
async def update_my_profile(
    payload: UserUpdateRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> UserProfileResponse:
    """Update the authenticated user's profile details."""
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.location_city is not None:
        current_user.location_city = payload.location_city
    if payload.preference_type is not None:
        current_user.preference_type = payload.preference_type

    if payload.agency_display_name is not None and current_user.role == "agency":
        if current_user.agency_profile:
            current_user.agency_profile.display_name = payload.agency_display_name
            db.add(current_user.agency_profile)
        else:
            from app.modules.users.models import AgencyProfile

            new_profile = AgencyProfile(
                user_id=current_user.id, display_name=payload.agency_display_name
            )
            current_user.agency_profile = new_profile
            db.add(new_profile)

    try:
        db.add(current_user)
        await db.commit()
    except Exception as e:
        await db.rollback()
        from fastapi import HTTPException

        if "users_phone_key" in str(e):
            raise HTTPException(
                status_code=400, detail="Phone number already registered."
            )
        raise HTTPException(status_code=400, detail="Error updating profile.")

    await db.refresh(current_user)
    return UserProfileResponse.model_validate(current_user)


@router.put("/me/pin")
async def change_pin(
    payload: ChangePinRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Change the authenticated user's 4-digit PIN."""
    from app.core.security import verify_password, hash_password
    from fastapi import HTTPException

    if not current_user.auth_provider_uid or not verify_password(
        payload.old_pin, current_user.auth_provider_uid
    ):
        raise HTTPException(status_code=400, detail="Incorrect current PIN.")

    current_user.auth_provider_uid = hash_password(payload.new_pin)
    await db.commit()
    return {"message": "PIN updated successfully"}


@router.post("/me/verification-request")
async def request_verification(
    payload: VerificationSubmitRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Submit a request to become a verified user/agency."""
    from app.modules.admin.models import VerificationRequest
    from sqlalchemy import select
    from fastapi import HTTPException

    # Check if already requested or verified
    if current_user.verification_status in ["review_request", "verified"]:
        raise HTTPException(
            status_code=400, detail="Verification already requested or approved"
        )

    # Create request
    req = VerificationRequest(
        user_id=current_user.id, status="pending", document_keys=payload.document_keys
    )
    db.add(req)

    # Update user status
    current_user.verification_status = "review_request"

    await db.commit()
    return {"message": "Verification request submitted successfully"}


from fastapi import UploadFile, File


@router.post("/me/agency/logo")
async def upload_agency_logo(
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
):
    """Upload agency logo to R2 storage."""
    from fastapi import HTTPException
    from app.modules.media.service import MediaService

    if not current_user.agency_profile:
        # Create an agency profile so owners can also have a logo/banner
        from app.modules.users.models import AgencyProfile

        current_user.agency_profile = AgencyProfile(
            display_name=current_user.name, about="", areas_served=[]
        )
        db.add(current_user.agency_profile)

    media_service = MediaService()
    public_url, key = await media_service.upload_file(file, folder="uploads")

    old_logo_url = current_user.agency_profile.logo_key
    current_user.agency_profile.logo_key = public_url
    db.add(current_user.agency_profile)
    await db.commit()

    if old_logo_url and old_logo_url != public_url:
        await media_service.delete_files_by_url([old_logo_url])

    return {"message": "Logo uploaded successfully", "url": public_url}


@router.post("/me/agency/banner")
async def upload_agency_banner(
    current_user: CurrentUser,
    db: DbSession,
    file: UploadFile = File(...),
):
    """Upload agency banner to R2 storage."""
    from fastapi import HTTPException
    from app.modules.media.service import MediaService

    if not current_user.agency_profile:
        from app.modules.users.models import AgencyProfile

        current_user.agency_profile = AgencyProfile(
            display_name=current_user.name, about="", areas_served=[]
        )
        db.add(current_user.agency_profile)

    media_service = MediaService()
    public_url, key = await media_service.upload_file(file, folder="uploads")

    old_banner_url = current_user.agency_profile.banner_key
    current_user.agency_profile.banner_key = public_url
    db.add(current_user.agency_profile)
    await db.commit()

    if old_banner_url and old_banner_url != public_url:
        await media_service.delete_files_by_url([old_banner_url])

    return {"message": "Banner uploaded successfully", "url": public_url}
