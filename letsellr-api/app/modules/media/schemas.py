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
