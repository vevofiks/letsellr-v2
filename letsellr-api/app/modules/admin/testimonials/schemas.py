from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

class TestimonialBase(BaseModel):
    author_name: str
    author_role: str
    author_location: Optional[str] = None
    content: str = Field(..., max_length=300)
    rating: Optional[int] = Field(None, ge=1, le=5)
    is_featured: bool = False
    display_order: int = 0

class TestimonialCreate(TestimonialBase):
    pass

class TestimonialUpdate(BaseModel):
    author_name: Optional[str] = None
    author_role: Optional[str] = None
    author_location: Optional[str] = None
    content: Optional[str] = Field(None, max_length=300)
    rating: Optional[int] = Field(None, ge=1, le=5)
    is_featured: Optional[bool] = None
    display_order: Optional[int] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None

class TestimonialResponse(TestimonialBase):
    id: UUID
    avatar_key: Optional[str] = None
    avatar_url: Optional[str] = None
    status: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
