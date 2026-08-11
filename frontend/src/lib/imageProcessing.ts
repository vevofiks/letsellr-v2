import imageCompression from "browser-image-compression";

// Mirrors letsellr-api/app/modules/media/service.py constants exactly, so
// client-compressed output matches what the server used to produce.
const MAX_DIMENSION = 2048;
const WEBP_QUALITY = 0.82;
const LOGO_URL = "/images/logo.png";

let logoPromise: Promise<ImageBitmap> | null = null;

function loadLogo(): Promise<ImageBitmap> {
  if (!logoPromise) {
    logoPromise = fetch(LOGO_URL)
      .then((res) => res.blob())
      .then((blob) => createImageBitmap(blob));
  }
  return logoPromise;
}

async function applyWatermark(blob: Blob): Promise<Blob> {
  const [logo, source] = await Promise.all([loadLogo(), createImageBitmap(blob)]);

  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;

  ctx.drawImage(source, 0, 0);

  const wmWidth = Math.round(source.width * 0.25);
  const wmHeight = Math.round(wmWidth * (logo.height / logo.width));
  const padding = Math.round(source.width * 0.02);
  const posX = source.width - wmWidth - padding;
  const posY = source.height - wmHeight - padding;
  ctx.drawImage(logo, posX, posY, wmWidth, wmHeight);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Failed to encode watermarked image"))),
      "image/webp",
      WEBP_QUALITY
    );
  });
}

function renameToWebp(filename: string): string {
  const base = filename.includes(".") ? filename.slice(0, filename.lastIndexOf(".")) : filename;
  return `${base}.webp`;
}

/**
 * Compresses, resizes (<=2048px longest side), watermarks, and re-encodes a
 * property photo as WebP entirely client-side before it ever reaches the
 * network, so the upload step itself is close to instantaneous.
 */
export async function processPropertyImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: MAX_DIMENSION,
    maxSizeMB: 3,
    initialQuality: WEBP_QUALITY,
    fileType: "image/webp",
    useWebWorker: true,
  });

  const watermarked = await applyWatermark(compressed);

  return new File([watermarked], renameToWebp(file.name), { type: "image/webp" });
}
