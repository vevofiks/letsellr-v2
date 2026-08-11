"""
Module: Media
Schemas — Request/Response models for media
"""

from pydantic import BaseModel


class MediaUploadResponse(BaseModel):
    url: str
    key: str
    message: str = "File uploaded successfully"


class MediaDeleteRequest(BaseModel):
    url: str


class PresignedPutRequest(BaseModel):
    filename: str
    content_type: str
    folder: str = "properties"


class PresignedPutResponse(BaseModel):
    upload_url: str
    key: str
    public_url: str


class MultipartInitiateRequest(BaseModel):
    filename: str
    content_type: str
    folder: str = "properties"


class MultipartInitiateResponse(BaseModel):
    key: str
    upload_id: str
    public_url: str


class MultipartPartUrlsRequest(BaseModel):
    key: str
    upload_id: str
    part_numbers: list[int]


class MultipartPartUrlsResponse(BaseModel):
    urls: dict[int, str]


class CompletedPart(BaseModel):
    part_number: int
    etag: str


class MultipartCompleteRequest(BaseModel):
    key: str
    upload_id: str
    parts: list[CompletedPart]


class MultipartCompleteResponse(BaseModel):
    public_url: str
    key: str


class MultipartAbortRequest(BaseModel):
    key: str
    upload_id: str
