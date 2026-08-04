"""
Module: Media
Service — Local Storage File Handling (Cloudflare R2 commented out)
"""

import os
import uuid
import boto3
from botocore.config import Config
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


class MediaService:
    def __init__(self):
        if (
            not getattr(settings, "R2_ACCOUNT_ID", None)
            or not getattr(settings, "R2_ACCESS_KEY_ID", None)
            or not getattr(settings, "R2_SECRET_ACCESS_KEY", None)
        ):
            self.s3 = None
        else:
            self.s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto",
            )

    async def upload_file(
        self, file: UploadFile, folder: str = "uploads", base_url: str | None = None
    ) -> tuple[str, str]:
        """
        Uploads a file to Cloudflare R2 storage and returns the public URL and key.
        """
        if not self.s3:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare R2 is not configured on the server.",
            )

        # Generate a unique key
        filename = file.filename or ""
        ext = filename.split(".")[-1] if "." in filename else "bin"
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.{ext}"

        # Use the specified folder (defaults to 'uploads')
        key = f"{folder}/{filename}"

        # Read and upload file contents
        try:
            contents = await file.read()
            self.s3.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
                Body=contents,
                ContentType=file.content_type or "application/octet-stream",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file to R2 storage: {str(e)}",
            )

        # Construct public URL using R2_PUBLIC_URL
        base_url = settings.R2_PUBLIC_URL.rstrip("/")
        public_url = f"{base_url}/{key}"

        return public_url, key

    async def delete_file_by_url(self, url: str) -> bool:
        """
        Deletes a file from Cloudflare R2 by its public URL.
        """
        if not self.s3:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare R2 is not configured on the server.",
            )

        base_url = settings.R2_PUBLIC_URL.rstrip("/")

        # We need to extract the key from the url
        # E.g. url = "https://cdn.letsellr.com/properties/uuid.jpg"
        # base_url = "https://cdn.letsellr.com"
        # key should be "properties/uuid.jpg"

        if not url.startswith(base_url):
            # Not a recognized URL or doesn't match our bucket
            return False

        # Extract the key
        key = url[len(base_url) :].lstrip("/")

        if not key:
            return False

        try:
            self.s3.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=key)
            return True
        except Exception as e:
            # We don't want to necessarily crash if deletion fails, but logging would be good
            print(f"Failed to delete {key} from R2: {str(e)}")
            return False
