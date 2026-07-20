"""
Module: Reviews
Schemas — Pydantic models for reviews
"""

import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ReviewerUserResponse(BaseModel):
    id: uuid.UUID
    name: str
    role: str
    model_config = {"from_attributes": True}


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str


class ReviewUpdate(BaseModel):
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = None


class ReviewResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    target_type: str
    target_id: uuid.UUID
    reviewer_name: str
    rating: int
    comment: str
    status: str
    created_at: datetime
    updated_at: datetime
    user: ReviewerUserResponse | None = None

    model_config = {"from_attributes": True}
