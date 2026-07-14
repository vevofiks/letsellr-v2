"""Module: Agencies — Router stub"""
from fastapi import APIRouter
router = APIRouter()

@router.get("")
async def list_agencies():
    return {"message": "Agencies endpoint — coming in Phase 4"}
