import { api } from "@/lib/api";
import { processPropertyImage } from "@/lib/imageProcessing";

export type UploadFolder = "properties" | "uploads";

// R2/S3 requires every part but the last to be >= 5MB; 8MB gives margin.
const MULTIPART_THRESHOLD = 10 * 1024 * 1024;
const PART_SIZE = 8 * 1024 * 1024;
// Shared across the whole gallery batch so N files x M parts can't flood
// the browser/R2 with dozens of simultaneous PUTs.
const MAX_INFLIGHT_PARTS_GLOBAL = 6;

class Semaphore {
  private active = 0;
  private queue: Array<() => void> = [];
  private readonly max: number;

  constructor(max: number) {
    this.max = max;
  }

  async acquire(): Promise<() => void> {
    if (this.active < this.max) {
      this.active++;
      return () => this.release();
    }
    return new Promise((resolve) => {
      this.queue.push(() => {
        this.active++;
        resolve(() => this.release());
      });
    });
  }

  private release() {
    this.active--;
    const next = this.queue.shift();
    if (next) next();
  }
}

async function putToR2(url: string, body: Blob, contentType: string, retriesLeft = 1): Promise<Response> {
  try {
    const res = await fetch(url, { method: "PUT", headers: { "Content-Type": contentType }, body });
    if (!res.ok) throw new Error(`R2 upload failed with status ${res.status}`);
    return res;
  } catch (err) {
    if (retriesLeft > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      return putToR2(url, body, contentType, retriesLeft - 1);
    }
    throw err;
  }
}

async function uploadSingle(file: File, folder: UploadFolder, semaphore: Semaphore): Promise<string> {
  const { data } = await api.post("/api/media/presign", {
    filename: file.name,
    content_type: file.type,
    folder,
  });

  const release = await semaphore.acquire();
  try {
    await putToR2(data.upload_url, file, file.type);
  } finally {
    release();
  }
  return data.public_url;
}

async function uploadMultipart(file: File, folder: UploadFolder, semaphore: Semaphore): Promise<string> {
  const { data: init } = await api.post("/api/media/multipart/initiate", {
    filename: file.name,
    content_type: file.type,
    folder,
  });
  const { key, upload_id: uploadId } = init;

  const partCount = Math.ceil(file.size / PART_SIZE);
  const partNumbers = Array.from({ length: partCount }, (_, i) => i + 1);

  try {
    const { data: partsData } = await api.post("/api/media/multipart/parts", {
      key,
      upload_id: uploadId,
      part_numbers: partNumbers,
    });
    const urls: Record<string, string> = partsData.urls;

    const completedParts = await Promise.all(
      partNumbers.map(async (partNumber) => {
        const start = (partNumber - 1) * PART_SIZE;
        const end = Math.min(start + PART_SIZE, file.size);
        const chunk = file.slice(start, end);
        const url = urls[String(partNumber)];

        const release = await semaphore.acquire();
        let etag: string | null;
        try {
          const res = await putToR2(url, chunk, file.type);
          etag = res.headers.get("ETag");
        } finally {
          release();
        }
        if (!etag) {
          throw new Error(
            `Missing ETag for part ${partNumber} - check R2 bucket CORS exposes the ETag header`
          );
        }
        return { part_number: partNumber, etag };
      })
    );

    const { data: completeData } = await api.post("/api/media/multipart/complete", {
      key,
      upload_id: uploadId,
      parts: completedParts,
    });
    return completeData.public_url;
  } catch (err) {
    await api.post("/api/media/multipart/abort", { key, upload_id: uploadId }).catch(() => {});
    throw err;
  }
}

/**
 * Compresses/watermarks each file client-side, then uploads it directly to
 * R2 (bypassing the backend proxy) via a single presigned PUT or, for large
 * files, a concurrent multipart upload. Returns the public URLs in the same
 * order as `files`, skipping any that failed (reporting them via onFileError).
 */
export async function uploadGalleryFiles(
  files: File[],
  folder: UploadFolder,
  onFileError?: (file: File, err: unknown) => void
): Promise<string[]> {
  const semaphore = new Semaphore(MAX_INFLIGHT_PARTS_GLOBAL);

  const results = await Promise.all(
    files.map(async (file) => {
      try {
        const processed = await processPropertyImage(file);
        return processed.size >= MULTIPART_THRESHOLD
          ? await uploadMultipart(processed, folder, semaphore)
          : await uploadSingle(processed, folder, semaphore);
      } catch (err) {
        onFileError?.(file, err);
        return null;
      }
    })
  );

  return results.filter((url): url is string => Boolean(url));
}
