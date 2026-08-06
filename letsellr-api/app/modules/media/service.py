"""
Module: Media
Service — Cloudflare R2 object storage upload/delete
"""

import io
import uuid
import boto3
from botocore.config import Config
from fastapi import UploadFile, HTTPException, status
from PIL import Image, UnidentifiedImageError
from app.core.config import settings

# Raster formats we convert to WebP on upload. SVG (vector) and animated GIF
# are left as-is — Pillow would flatten a GIF to its first frame.
CONVERTIBLE_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/bmp",
    "image/tiff",
}
WEBP_QUALITY = 82
# Property/profile photos never need to render larger than this — phone camera
# uploads (often 12MP+) would otherwise re-encode losslessly-large into WebP,
# multiplying storage/bandwidth for no visual benefit at listing/card sizes.
MAX_DIMENSION = 2048


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

    @staticmethod
    def _to_webp(contents: bytes) -> bytes:
        """
        Re-encodes raster image bytes as WebP. Flattens transparency onto a
        white background only for modes WebP can't store directly.
        """
        with Image.open(io.BytesIO(contents)) as img:
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            if img.width > MAX_DIMENSION or img.height > MAX_DIMENSION:
                img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
            buffer = io.BytesIO()
            img.save(buffer, format="WEBP", quality=WEBP_QUALITY, method=6)
            return buffer.getvalue()

    async def upload_file(
        self, file: UploadFile, folder: str = "uploads", base_url: str | None = None
    ) -> tuple[str, str]:
        """
        Uploads a file to Cloudflare R2 storage and returns the public URL and key.
        Raster images (PNG/JPEG/BMP/TIFF) are transcoded to WebP before upload.
        """
        if not self.s3:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare R2 is not configured on the server.",
            )

        filename = file.filename or ""
        ext = filename.split(".")[-1].lower() if "." in filename else "bin"
        content_type = (file.content_type or "application/octet-stream").lower()

        contents = await file.read()

        if content_type in CONVERTIBLE_CONTENT_TYPES or ext in {"png", "jpg", "jpeg", "bmp", "tiff", "tif"}:
            try:
                import asyncio
                loop = asyncio.get_running_loop()
                contents = await loop.run_in_executor(None, self._to_webp, contents)
                ext = "webp"
                content_type = "image/webp"
            except UnidentifiedImageError:
                # Not actually a decodable image despite the extension/content-type — upload as-is.
                pass

        unique_id = str(uuid.uuid4())
        key = f"{folder}/{unique_id}.{ext}"

        # Upload file contents
        try:
            import asyncio
            from functools import partial
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None,
                partial(
                    self.s3.put_object,
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=key,
                    Body=contents,
                    ContentType=content_type,
                )
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

    async def delete_files_by_url(self, urls: list[str]) -> None:
        """
        Best-effort cleanup for one or more R2 objects (e.g. photos replaced/removed
        on edit, or a listing's photos once the listing itself is deleted). Never
        raises — a storage hiccup or missing R2 config must not block the caller's
        primary DB operation, it should just leave the object as an orphan to be
        cleaned up later.
        """
        if not self.s3:
            return
        for url in urls:
            try:
                await self.delete_file_by_url(url)
            except Exception as e:
                print(f"Failed to clean up {url} from R2: {str(e)}")

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
