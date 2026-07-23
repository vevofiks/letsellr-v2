"""Module: Admin — Router stub (Phase 6)"""

import uuid
from fastapi import APIRouter, HTTPException
from sqlalchemy import select

from app.depends.auth import CurrentUser
from app.depends.db import DbSession
from app.modules.users.models import User
from app.modules.admin.models import VerificationRequest
from app.modules.admin.schemas import (
    UserAdminResponse,
    VerificationRequestResponse,
    UpdateUserStatusRequest,
    VerificationActionRequest,
)

router = APIRouter()

def require_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")


@router.get("/users", response_model=list[UserAdminResponse])
async def list_users(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/users/{user_id}/status", response_model=UserAdminResponse)
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
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/verification-requests", response_model=list[VerificationRequestResponse])
async def list_verification_requests(current_user: CurrentUser, db: DbSession):
    require_admin(current_user)
    result = await db.execute(
        select(VerificationRequest).order_by(VerificationRequest.created_at.desc())
    )
    return result.scalars().all()


@router.post("/verification-requests/{request_id}/approve")
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

    await db.commit()
    return {"message": "Request approved"}


@router.post("/verification-requests/{request_id}/reject")
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

    await db.commit()
    return {"message": "Request rejected"}
