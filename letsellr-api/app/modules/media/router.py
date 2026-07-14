"""Module: Media — Router stub"""
from fastapi import APIRouter
router = APIRouter()

@router.post("/upload-url")
async def get_upload_url():
    return {"message": "R2 presigned URL — coming in Phase 7"}
