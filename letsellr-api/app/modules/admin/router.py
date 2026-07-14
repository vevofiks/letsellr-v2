"""Module: Admin — Router stub (Phase 6)"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/users")
async def list_users():
    return {"message": "Admin user management — coming in Phase 6"}
