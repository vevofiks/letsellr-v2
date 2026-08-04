import uuid
from typing import List
from fastapi import APIRouter, Depends, status

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.reviews.schemas import ReviewCreate, ReviewResponse, ReviewUpdate
from app.modules.reviews.service import ReviewService

router = APIRouter(tags=["Reviews"])


@router.get("/properties/{property_id}/reviews", response_model=List[ReviewResponse])
async def list_property_reviews(property_id: uuid.UUID, db: DbSession):
    """Get all reviews for a property in descending order of creation."""
    service = ReviewService(db)
    return await service.get_reviews_by_target("property", property_id)


@router.post(
    "/properties/{property_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_property_review(
    property_id: uuid.UUID,
    data: ReviewCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Create a new property review. Requires user to be logged in."""
    service = ReviewService(db)
    return await service.create_review("property", property_id, data, current_user)


@router.patch("/reviews/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Edit own review comment or rating."""
    service = ReviewService(db)
    return await service.update_review(review_id, data, current_user)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    review_id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Delete own review."""
    service = ReviewService(db)
    await service.delete_review(review_id, current_user)
