import uuid
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.core.config import settings
from app.modules.media.service import MediaService
from app.modules.users.models import User

from .models import Testimonial
from .schemas import TestimonialCreate, TestimonialUpdate, TestimonialResponse

# Admin endpoints router
admin_router = APIRouter()

# Public endpoints router
public_router = APIRouter()


def require_admin(user: User) -> None:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")


def _add_avatar_url(item: Testimonial) -> TestimonialResponse:
    resp = TestimonialResponse.model_validate(item)
    if resp.avatar_key:
        base_url = settings.R2_PUBLIC_URL.rstrip("/")
        resp.avatar_url = f"{base_url}/{resp.avatar_key}"
    return resp


# ── Public ────────────────────────────────────────────────────────────────────


@public_router.get("", response_model=List[TestimonialResponse])
async def get_public_testimonials(
    db: DbSession,
    featured: bool = Query(False, description="Returns only featured testimonials"),
):
    """Public endpoint to fetch approved and active testimonials."""
    query = select(Testimonial).where(
        Testimonial.status == "approved", Testimonial.is_active == True
    )
    if featured:
        query = query.where(Testimonial.is_featured == True)
    query = query.order_by(
        Testimonial.display_order.asc(), Testimonial.created_at.desc()
    )

    result = await db.execute(query)
    items = result.scalars().all()
    return [_add_avatar_url(item) for item in items]


# ── Admin ─────────────────────────────────────────────────────────────────────


@admin_router.get("", response_model=List[TestimonialResponse])
async def get_admin_testimonials(
    current_user: CurrentUser,
    db: DbSession,
    status_filter: Optional[str] = Query(None, alias="status"),
    author_role: Optional[str] = None,
    is_featured: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    require_admin(current_user)
    query = select(Testimonial).where(Testimonial.is_active == True)

    if status_filter:
        query = query.where(Testimonial.status == status_filter)
    if author_role:
        query = query.where(Testimonial.author_role == author_role)
    if is_featured is not None:
        query = query.where(Testimonial.is_featured == is_featured)

    offset = (page - 1) * limit
    query = (
        query.order_by(Testimonial.display_order.asc(), Testimonial.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    items = result.scalars().all()
    return [_add_avatar_url(item) for item in items]


@admin_router.post(
    "", response_model=TestimonialResponse, status_code=status.HTTP_201_CREATED
)
async def create_testimonial(
    data: TestimonialCreate,
    current_user: CurrentUser,
    db: DbSession,
):
    """Admin creates a testimonial directly (defaults to approved)."""
    require_admin(current_user)
    testi = Testimonial(**data.model_dump(), status="approved")
    db.add(testi)
    await db.commit()
    await db.refresh(testi)
    return _add_avatar_url(testi)


@admin_router.patch("/{id}", response_model=TestimonialResponse)
async def update_testimonial(
    id: uuid.UUID,
    data: TestimonialUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    require_admin(current_user)
    result = await db.execute(
        select(Testimonial).where(Testimonial.id == id, Testimonial.is_active == True)
    )
    testi = result.scalar_one_or_none()
    if not testi:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(testi, k, v)

    await db.commit()
    await db.refresh(testi)
    return _add_avatar_url(testi)


@admin_router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_testimonial(
    id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Hard delete if not approved; soft delete (is_active=False) if approved."""
    require_admin(current_user)
    result = await db.execute(select(Testimonial).where(Testimonial.id == id))
    testi = result.scalar_one_or_none()
    if not testi:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    old_avatar_key = testi.avatar_key
    if testi.status != "approved":
        await db.delete(testi)
    else:
        testi.is_active = False

    await db.commit()

    if old_avatar_key:
        base_url = settings.R2_PUBLIC_URL.rstrip("/")
        await MediaService().delete_files_by_url([f"{base_url}/{old_avatar_key}"])


@admin_router.post("/{id}/avatar")
async def get_avatar_presigned_url(
    id: uuid.UUID,
    current_user: CurrentUser,
    db: DbSession,
):
    """Returns a presigned R2 PUT URL for avatar upload and updates avatar_key."""
    require_admin(current_user)
    result = await db.execute(
        select(Testimonial).where(Testimonial.id == id, Testimonial.is_active == True)
    )
    testi = result.scalar_one_or_none()
    if not testi:
        raise HTTPException(status_code=404, detail="Testimonial not found")

    service = MediaService()
    if not service.s3:
        raise HTTPException(status_code=503, detail="R2 is not configured")

    new_key = f"uploads/{uuid.uuid4()}.jpg"

    try:
        url = service.s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": settings.R2_BUCKET_NAME,
                "Key": new_key,
                "ContentType": "image/jpeg",
            },
            ExpiresIn=3600,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Could not generate presigned URL: {str(e)}"
        )

    old_avatar_key = testi.avatar_key
    testi.avatar_key = new_key
    await db.commit()

    base_url = settings.R2_PUBLIC_URL.rstrip("/")
    if old_avatar_key:
        await service.delete_files_by_url([f"{base_url}/{old_avatar_key}"])

    return {
        "upload_url": url,
        "avatar_key": new_key,
        "avatar_url": f"{base_url}/{new_key}",
    }
