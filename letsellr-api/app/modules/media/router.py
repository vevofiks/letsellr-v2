"""Module: Media — Router"""

from fastapi import APIRouter, UploadFile, File, Form, Request, HTTPException
from app.depends.auth import CurrentUser
from app.modules.media.schemas import (
    MediaUploadResponse,
    MediaDeleteRequest,
    PresignedPutRequest,
    PresignedPutResponse,
    MultipartInitiateRequest,
    MultipartInitiateResponse,
    MultipartPartUrlsRequest,
    MultipartPartUrlsResponse,
    MultipartCompleteRequest,
    MultipartCompleteResponse,
    MultipartAbortRequest,
)
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
    Upload a file to Cloudflare R2 object storage.
    Returns the public CDN URL.
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


@router.post("/presign", response_model=PresignedPutResponse, tags=["Media"])
async def presign_upload(payload: PresignedPutRequest, current_user: CurrentUser):
    """
    Single-shot presigned PUT URL for a direct browser-to-R2 upload
    (files under the multipart threshold, already compressed client-side).
    """
    service = MediaService()
    try:
        upload_url, key, public_url = await service.generate_presigned_put(
            payload.filename, payload.content_type, payload.folder
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")
    return PresignedPutResponse(upload_url=upload_url, key=key, public_url=public_url)


@router.post("/multipart/initiate", response_model=MultipartInitiateResponse, tags=["Media"])
async def multipart_initiate(payload: MultipartInitiateRequest, current_user: CurrentUser):
    """Starts a multipart upload for a large file and returns the upload_id/key."""
    service = MediaService()
    key, upload_id, public_url = await service.initiate_multipart(
        payload.filename, payload.content_type, payload.folder
    )
    return MultipartInitiateResponse(key=key, upload_id=upload_id, public_url=public_url)


@router.post("/multipart/parts", response_model=MultipartPartUrlsResponse, tags=["Media"])
async def multipart_part_urls(payload: MultipartPartUrlsRequest, current_user: CurrentUser):
    """Batch-generates presigned PUT URLs for the given part numbers of an in-progress multipart upload."""
    service = MediaService()
    try:
        urls = await service.generate_part_urls(payload.key, payload.upload_id, payload.part_numbers)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate part URLs: {str(e)}")
    return MultipartPartUrlsResponse(urls=urls)


@router.post("/multipart/complete", response_model=MultipartCompleteResponse, tags=["Media"])
async def multipart_complete(payload: MultipartCompleteRequest, current_user: CurrentUser):
    """Completes a multipart upload once all parts have been PUT to R2."""
    service = MediaService()
    public_url = await service.complete_multipart(
        payload.key,
        payload.upload_id,
        [{"PartNumber": p.part_number, "ETag": p.etag} for p in payload.parts],
    )
    return MultipartCompleteResponse(public_url=public_url, key=payload.key)


@router.post("/multipart/abort", tags=["Media"])
async def multipart_abort(payload: MultipartAbortRequest, current_user: CurrentUser):
    """Aborts an in-progress multipart upload, releasing any parts already uploaded to R2."""
    service = MediaService()
    await service.abort_multipart(payload.key, payload.upload_id)
    return {"message": "Multipart upload aborted"}


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
