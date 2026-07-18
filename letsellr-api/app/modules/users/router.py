"""
Module: Users
Router — owner/agency profile management
"""

from fastapi import APIRouter

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.users.schemas import UserProfileResponse, UserUpdateRequest

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

