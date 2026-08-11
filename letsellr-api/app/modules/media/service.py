"""
Module: Media
Service — Cloudflare R2 object storage upload/delete
"""

import asyncio
import io
import uuid
from functools import partial

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

# Presigned direct-to-R2 upload (property galleries): the client compresses,
# watermarks, and converts to WebP itself, so these endpoints skip the
# server-side Pillow pipeline entirely. Whitelisted since key/content-type
# are now client-influenced.
PRESIGN_ALLOWED_FOLDERS = {"properties", "uploads"}
PRESIGN_ALLOWED_CONTENT_TYPES = {"image/webp", "image/jpeg"}
PRESIGN_EXPIRES_IN = 3600


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
    def _to_webp(contents: bytes, add_watermark: bool = False) -> bytes:
        """
        Re-encodes raster image bytes as WebP. Flattens transparency onto a
        white background only for modes WebP can't store directly.
        """
        with Image.open(io.BytesIO(contents)) as img:
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            if img.width > MAX_DIMENSION or img.height > MAX_DIMENSION:
                img.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)
                
            if add_watermark:
                try:
                    watermark_path = "/home/mhdasjad/Sandbox/letsellr-v2/frontend/public/images/logo.png"
                    with Image.open(watermark_path) as wm:
                        # Make the watermark size 25% of the image width
                        wm_width = int(img.width * 0.25)
                        wm_ratio = wm_width / wm.width
                        wm_height = int(wm.height * wm_ratio)
                        wm = wm.resize((wm_width, wm_height), Image.Resampling.LANCZOS)
                        
                        if wm.mode != "RGBA":
                            wm = wm.convert("RGBA")
                            
                        # Padding of 2% from the edges
                        padding = int(img.width * 0.02)
                        pos_x = img.width - wm_width - padding
                        pos_y = img.height - wm_height - padding
                        
                        # Create a transparent layer to paste the watermark
                        transparent = Image.new("RGBA", img.size, (0,0,0,0))
                        transparent.paste(img.convert("RGBA"), (0,0))
                        transparent.paste(wm, (pos_x, pos_y), mask=wm)
                        
                        img = transparent.convert(img.mode)
                except Exception as e:
                    print(f"Failed to add watermark: {e}")

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
                loop = asyncio.get_running_loop()
                add_watermark = folder in ("uploads", "properties")
                contents = await loop.run_in_executor(None, partial(self._to_webp, contents, add_watermark))
                ext = "webp"
                content_type = "image/webp"
            except UnidentifiedImageError:
                # Not actually a decodable image despite the extension/content-type — upload as-is.
                pass

        unique_id = str(uuid.uuid4())
        key = f"{folder}/{unique_id}.{ext}"

        # Upload file contents
        try:
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

    def _require_s3(self) -> None:
        if not self.s3:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Cloudflare R2 is not configured on the server.",
            )

    @staticmethod
    def _validate_presign(folder: str, content_type: str) -> None:
        if folder not in PRESIGN_ALLOWED_FOLDERS:
            raise HTTPException(status_code=400, detail=f"Unsupported folder: {folder}")
        if content_type not in PRESIGN_ALLOWED_CONTENT_TYPES:
            raise HTTPException(status_code=400, detail=f"Unsupported content type: {content_type}")

    @staticmethod
    def _build_key(filename: str, folder: str) -> str:
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "webp"
        return f"{folder}/{uuid.uuid4()}.{ext}"

    def _public_url(self, key: str) -> str:
        return f"{settings.R2_PUBLIC_URL.rstrip('/')}/{key}"

    async def generate_presigned_put(
        self, filename: str, content_type: str, folder: str
    ) -> tuple[str, str, str]:
        """Single-shot presigned PUT for files under the multipart threshold."""
        self._require_s3()
        self._validate_presign(folder, content_type)
        key = self._build_key(filename, folder)
        loop = asyncio.get_running_loop()
        upload_url = await loop.run_in_executor(
            None,
            partial(
                self.s3.generate_presigned_url,
                ClientMethod="put_object",
                Params={"Bucket": settings.R2_BUCKET_NAME, "Key": key, "ContentType": content_type},
                ExpiresIn=PRESIGN_EXPIRES_IN,
            ),
        )
        return upload_url, key, self._public_url(key)

    async def initiate_multipart(
        self, filename: str, content_type: str, folder: str
    ) -> tuple[str, str, str]:
        self._require_s3()
        self._validate_presign(folder, content_type)
        key = self._build_key(filename, folder)
        loop = asyncio.get_running_loop()
        try:
            resp = await loop.run_in_executor(
                None,
                partial(
                    self.s3.create_multipart_upload,
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=key,
                    ContentType=content_type,
                ),
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initiate multipart upload: {str(e)}")
        return key, resp["UploadId"], self._public_url(key)

    async def generate_part_urls(
        self, key: str, upload_id: str, part_numbers: list[int]
    ) -> dict[int, str]:
        self._require_s3()
        loop = asyncio.get_running_loop()

        def _generate() -> dict[int, str]:
            return {
                n: self.s3.generate_presigned_url(
                    ClientMethod="upload_part",
                    Params={
                        "Bucket": settings.R2_BUCKET_NAME,
                        "Key": key,
                        "UploadId": upload_id,
                        "PartNumber": n,
                    },
                    ExpiresIn=PRESIGN_EXPIRES_IN,
                )
                for n in part_numbers
            }

        return await loop.run_in_executor(None, _generate)

    async def complete_multipart(
        self, key: str, upload_id: str, parts: list[dict]
    ) -> str:
        self._require_s3()
        loop = asyncio.get_running_loop()
        sorted_parts = sorted(parts, key=lambda p: p["PartNumber"])
        try:
            await loop.run_in_executor(
                None,
                partial(
                    self.s3.complete_multipart_upload,
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=key,
                    UploadId=upload_id,
                    MultipartUpload={"Parts": sorted_parts},
                ),
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to complete multipart upload: {str(e)}")
        return self._public_url(key)

    async def abort_multipart(self, key: str, upload_id: str) -> None:
        self._require_s3()
        loop = asyncio.get_running_loop()
        try:
            await loop.run_in_executor(
                None,
                partial(
                    self.s3.abort_multipart_upload,
                    Bucket=settings.R2_BUCKET_NAME,
                    Key=key,
                    UploadId=upload_id,
                ),
            )
        except Exception as e:
            # Best-effort cleanup — an already-aborted/expired upload_id shouldn't
            # surface as an error to a client that's already handling a failure.
            print(f"Failed to abort multipart upload {upload_id} for {key}: {str(e)}")
