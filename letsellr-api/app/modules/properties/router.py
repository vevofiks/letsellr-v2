"""
Module: Properties — Router (stub for Phase 2+)
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_properties():
    """Public property browse — implemented in Phase 4."""
    return {"message": "Properties endpoint — coming in Phase 4"}
