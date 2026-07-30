import uuid
import re
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.session import AsyncSession
from app.modules.reviews.models import Review
from app.modules.reviews.schemas import ReviewCreate, ReviewUpdate
from app.modules.properties.models import Property
from app.modules.users.models import User


def validate_comment(comment: str) -> None:
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review comment cannot be empty."
        )
    trimmed = comment.strip()
    if not trimmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review comment cannot contain only whitespace."
        )
    
    # Check if the comment contains only symbols/punctuation/spaces
    if re.match(r"^[^a-zA-Z0-9]+$", trimmed):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review comment must contain actual text, not just symbols."
        )
    
    # Check for repeated characters/symbols (e.g. "aaaa", "-----", ".....")
    char_only = re.sub(r"\s+", "", trimmed)
    if len(char_only) > 1 and len(set(char_only)) == 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Review comment cannot contain only repeated characters."
        )


class ReviewService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_reviews_by_target(self, target_type: str, target_id: uuid.UUID) -> List[Review]:
        stmt = (
            select(Review)
            .where(Review.target_type == target_type)
            .where(Review.target_id == target_id)
            .options(selectinload(Review.user))
            .order_by(Review.created_at.desc())
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create_review(
        self, target_type: str, target_id: uuid.UUID, data: ReviewCreate, current_user: User
    ) -> Review:
        # Validate comment meaningfulness
        validate_comment(data.comment)

        # Enforce validation constraints based on target
        if target_type == "property":
            # 1. Fetch property to check ownership
            prop_stmt = select(Property).where(Property.id == target_id)
            prop_res = await self.db.execute(prop_stmt)
            property_obj = prop_res.scalar_one_or_none()
            if not property_obj:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Property not found."
                )
            
            # Property owners/agents cannot review their own properties
            if property_obj.owner_id == current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Property owners/agents cannot review their own properties."
                )

        # Ensure user can only submit ONE review per target
        dup_stmt = (
            select(Review)
            .where(Review.user_id == current_user.id)
            .where(Review.target_type == target_type)
            .where(Review.target_id == target_id)
        )
        dup_res = await self.db.execute(dup_stmt)
        if dup_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already submitted a review for this property."
            )

        # Create new review object
        review = Review(
            user_id=current_user.id,
            target_type=target_type,
            target_id=target_id,
            reviewer_name=current_user.name,
            rating=data.rating,
            comment=data.comment.strip(),
            status="approved" # Auto-approved by default
        )
        self.db.add(review)
        await self.db.flush()
        await self.db.refresh(review)
        
        # Load user relation for the response schema
        stmt = select(Review).where(Review.id == review.id).options(selectinload(Review.user))
        res = await self.db.execute(stmt)
        return res.scalar_one()

    async def update_review(
        self, review_id: uuid.UUID, data: ReviewUpdate, current_user: User
    ) -> Review:
        # Load review
        stmt = select(Review).where(Review.id == review_id).options(selectinload(Review.user))
        res = await self.db.execute(stmt)
        review = res.scalar_one_or_none()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found."
            )

        # Enforce that a user can only manage their own reviews
        if review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage your own reviews."
            )

        # Validate comment if provided
        if data.comment is not None:
            validate_comment(data.comment)
            review.comment = data.comment.strip()
        
        if data.rating is not None:
            review.rating = data.rating

        await self.db.flush()
        await self.db.refresh(review)
        return review

    async def delete_review(self, review_id: uuid.UUID, current_user: User) -> None:
        stmt = select(Review).where(Review.id == review_id)
        res = await self.db.execute(stmt)
        review = res.scalar_one_or_none()
        if not review:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found."
            )

        # Enforce ownership check or allow admin
        if current_user.role != "admin" and review.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only manage your own reviews."
            )

        await self.db.delete(review)
        await self.db.flush()
