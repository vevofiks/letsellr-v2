"""
Module: Users
Router — owner/agency profile management
"""

from fastapi import APIRouter

from app.depends.auth import CurrentUser
from app.modules.users.schemas import UserProfileResponse

router = APIRouter()


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(current_user: CurrentUser) -> UserProfileResponse:
    """Get the authenticated user's full profile."""
    return UserProfileResponse.model_validate(current_user)
