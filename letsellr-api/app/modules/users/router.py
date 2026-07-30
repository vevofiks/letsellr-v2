"""
Module: Users
Router — owner/agency profile management
"""

from fastapi import APIRouter

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.users.schemas import UserProfileResponse, UserUpdateRequest, VerificationSubmitRequest

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
    if payload.location_city is not None:
        current_user.location_city = payload.location_city
    if payload.preference_type is not None:
        current_user.preference_type = payload.preference_type
    
    await db.commit()
    await db.refresh(current_user)
    return UserProfileResponse.model_validate(current_user)


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
        raise HTTPException(status_code=400, detail="Verification already requested or approved")

    # Create request
    req = VerificationRequest(
        user_id=current_user.id,
        status="pending",
        document_keys=payload.document_keys
    )
    db.add(req)

    # Update user status
    current_user.verification_status = "review_request"
    
    await db.commit()
    return {"message": "Verification request submitted successfully"}

