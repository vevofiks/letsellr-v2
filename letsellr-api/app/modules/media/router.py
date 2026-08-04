"""Module: Media — Router"""

from fastapi import APIRouter, UploadFile, File, Form, Depends, Request
from app.depends.auth import CurrentUser
from app.modules.media.schemas import MediaUploadResponse, MediaDeleteRequest
from app.modules.media.service import MediaService

router = APIRouter()


@router.post("/upload", response_model=MediaUploadResponse, tags=["Media"])
async def upload_file(
    request: Request,
    current_user: CurrentUser,
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
):
    """
    Upload a file to local storage.
    Returns the public static file URL.
    """
    service = MediaService()
    url, key = await service.upload_file(
        file, folder=folder, base_url=str(request.base_url)
    )
    return MediaUploadResponse(url=url, key=key)


@router.post("/upload-url")
async def get_upload_url():
    """Fallback for presigned URLs if needed in the future."""
    return {"message": "Direct upload via /upload is recommended."}


@router.post("/delete")
async def delete_file(
    payload: MediaDeleteRequest,
    current_user: CurrentUser,
):
    """
    Delete a file from Cloudflare R2 object storage using its public URL.
    """
    service = MediaService()
    success = await service.delete_file_by_url(payload.url)
    if success:
        return {"message": "File deleted successfully"}
    else:
        return {"message": "Failed to delete file or URL not recognized"}
