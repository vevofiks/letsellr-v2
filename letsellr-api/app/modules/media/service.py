"""
Module: Media
Service — Local Storage File Handling (Cloudflare R2 commented out)
"""
import os
import uuid
from fastapi import UploadFile, HTTPException, status

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "uploads"))


class MediaService:
    def __init__(self):
        # Cloudflare R2 client initialization commented out in favor of local storage
        # if not getattr(settings, "R2_ACCOUNT_ID", None) or not getattr(settings, "R2_ACCESS_KEY_ID", None) or not getattr(settings, "R2_SECRET_ACCESS_KEY", None):
        #     self.s3 = None
        # else:
        #     self.s3 = boto3.client(
        #         "s3",
        #         endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        #         aws_access_key_id=settings.R2_ACCESS_KEY_ID,
        #         aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
        #         config=Config(signature_version="s3v4"),
        #         region_name="auto"
        #     )
        self.s3 = None

    async def upload_file(self, file: UploadFile, folder: str = "uploads", base_url: str | None = None) -> tuple[str, str]:
        """
        Uploads a file to local storage and returns the public URL and key.
        """
        # Generate a unique key
        ext = file.filename.split(".")[-1] if file.filename and "." in file.filename else "bin"
        unique_id = str(uuid.uuid4())
        filename = f"{unique_id}.{ext}"
        key = f"{folder}/{filename}"

        # Ensure folder directory exists
        target_dir = os.path.join(UPLOAD_DIR, folder)
        os.makedirs(target_dir, exist_ok=True)
        file_path = os.path.join(target_dir, filename)

        # Read and save file contents
        try:
            contents = await file.read()
            with open(file_path, "wb") as f:
                f.write(contents)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save file to local storage: {str(e)}"
            )

        # Construct public URL
        if base_url:
            clean_base = base_url.rstrip("/")
            public_url = f"{clean_base}/uploads/{key}"
        else:
            public_url = f"http://localhost:8000/uploads/{key}"

        return public_url, key
