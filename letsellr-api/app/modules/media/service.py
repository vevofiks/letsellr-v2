"""
Module: Media
Service — Cloudflare R2 integration
"""
import uuid
import boto3
from botocore.config import Config
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

class MediaService:
    def __init__(self):
        if not settings.R2_ACCOUNT_ID or not settings.R2_ACCESS_KEY_ID or not settings.R2_SECRET_ACCESS_KEY:
            self.s3 = None
        else:
            self.s3 = boto3.client(
                "s3",
                endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                config=Config(signature_version="s3v4"),
                region_name="auto"
            )

    async def upload_file(self, file: UploadFile, folder: str = "uploads") -> tuple[str, str]:
        """
        Uploads a file to Cloudflare R2 and returns the public URL and key.
        """
        if not self.s3:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare R2 is not configured on the server."
            )

        # Generate a unique key
        ext = file.filename.split(".")[-1] if "." in file.filename else "bin"
        unique_id = str(uuid.uuid4())
        key = f"{folder}/{unique_id}.{ext}"

        # Read file contents
        contents = await file.read()
        
        content_type = file.content_type or "application/octet-stream"

        try:
            # Upload to R2
            self.s3.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=key,
                Body=contents,
                ContentType=content_type,
                # Cloudflare R2 does not support ACLs if using custom domains, so we don't pass ACL='public-read'
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload file to storage: {str(e)}"
            )

        # Construct public URL using the custom domain
        # Ensure R2_PUBLIC_URL does not have a trailing slash
        base_url = settings.R2_PUBLIC_URL.rstrip('/')
        public_url = f"{base_url}/{key}"

        return public_url, key
