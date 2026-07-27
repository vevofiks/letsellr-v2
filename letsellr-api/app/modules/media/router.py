"""Module: Media — Router"""
from fastapi import APIRouter, UploadFile, File, Form, Depends
from app.depends.auth import CurrentUser
from app.modules.media.schemas import MediaUploadResponse
from app.modules.media.service import MediaService

router = APIRouter()

@router.post("/upload", response_model=MediaUploadResponse, tags=["Media"])
async def upload_file(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    folder: str = Form("uploads")
):
    """
    Upload a file to Cloudflare R2 object storage.
    Returns the public CDN URL.
    """
    service = MediaService()
    url, key = await service.upload_file(file, folder=folder)
    return MediaUploadResponse(url=url, key=key)

@router.post("/upload-url")
async def get_upload_url():
    """Fallback for presigned URLs if needed in the future."""
    return {"message": "Direct upload via /upload is recommended."}
