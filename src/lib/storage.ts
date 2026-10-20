import { supabaseAdmin } from "./supabase"
import {
  thumbPathFor,
  thumbPathsFor,
  thumbWidthsForPath,
  toTransformedUrl,
} from "./storageUrl"

export {
  isSupabaseStorageUrl,
  storagePathFromUrl,
  thumbPathFor,
  thumbPathsFor,
  thumbWidthsForPath,
  toTransformedUrl,
  toOgImageUrl,
} from "./storageUrl"

const BUCKET = "media"

// Desired bucket config. `ensureBucket` reconciles an existing bucket so new
// MIME types (e.g. HEIC from iPhones) take effect without a manual migration.
const BUCKET_FILE_SIZE_LIMIT = 20 * 1024 * 1024 // 20 MB
const BUCKET_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "image/heif",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  // Internal manifests (e.g. thumbnail backfill skip list) live in the bucket.
  "application/json",
]

// Guest photos: sharp normalizes server-side so the stored original stays
// sharp enough for the keepsake book / downloadable originals while keeping
// storage + egress sane. 1800px is ~250dpi at A5.
export const GUEST_PHOTO_MAX_DIMENSION = 1800
export const GUEST_PHOTO_MAX_BYTES = 1.5 * 1024 * 1024
const THUMB_QUALITY = 72

const IMAGE_EXT = /\.(jpe?g|png|webp|avif|bmp|tiff?|heic|heif)$/i

function isGuestPhotoFolder(folder: string) {
  return folder === "guest-photos" || folder.startsWith("guest-photos/")
}

function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name)
}

// supabase-js validates upload bodies as ArrayBuffer/Blob in some runtimes and
// rejects Node Buffers with "SharedArrayBuffer is not allowed". Always hand it
// a Blob for in-process Buffer output (guest normalization + thumbnails).
function uploadBody(body: File | Buffer, contentType: string): File | Blob {
  if (body instanceof File || body instanceof Blob) return body
  return new Blob([new Uint8Array(body)], { type: contentType })
}

function replaceExt(name: string, ext: string) {
  return `${name.replace(/\.[^.]+$/, "")}.${ext}`
}

// Normalize guest uploads server-side (client compression can be skipped or
// fail for HEIC/in-app browsers). Never throws: returns null so the original
// file can still be uploaded and the caller gets the real size error.
async function normalizeGuestPhoto(
  file: File
): Promise<{ buffer: Buffer; ext: string; contentType: string } | null> {
  try {
    const { default: sharp } = await import("sharp")
    const input = Buffer.from(await file.arrayBuffer())
    let width = GUEST_PHOTO_MAX_DIMENSION
    let quality = 88
    for (let attempt = 0; attempt < 6; attempt++) {
      const out = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer()
      if (out.length <= GUEST_PHOTO_MAX_BYTES) {
        return { buffer: out, ext: "jpg", contentType: "image/jpeg" }
      }
      if (quality > 72) quality -= 8
      else width = Math.max(640, Math.round(width * 0.85))
    }
    return null
  } catch (err) {
    console.warn("[storage] guest normalize failed:", err instanceof Error ? err.message : String(err))
    return null
  }
}

// Generate every pre-defined WebP derivative for a stored object. Best-effort:
// a derivative failure must never make the original upload fail.
async function generateThumbnails(body: File | Buffer, path: string) {
  const widths = thumbWidthsForPath(path)
  if (!widths.length) return
  try {
    const { default: sharp } = await import("sharp")
    const input = body instanceof File ? Buffer.from(await body.arrayBuffer()) : body
    for (const width of widths) {
      const thumbPath = thumbPathFor(path, width)
      if (!thumbPath) continue
      const out = await sharp(input)
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY, effort: 4 })
        .toBuffer()
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(
        thumbPath,
        uploadBody(out, "image/webp"),
        {
          upsert: false,
          contentType: "image/webp",
          cacheControl: "31536000",
        }
      )
      // Concurrent/duplicate uploads are harmless — the derivative already
      // exists with identical content (timestamped source names).
      if (error && !/already exists|duplicate/i.test(error.message)) {
        console.warn(`[storage] thumb ${thumbPath} failed:`, error.message)
      }
    }
  } catch (err) {
    console.warn("[storage] thumbnail generation failed:", err instanceof Error ? err.message : String(err))
  }
}

export async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  const existing = buckets?.find((b) => b.name === BUCKET)
  if (!existing) {
    await supabaseAdmin.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: BUCKET_FILE_SIZE_LIMIT,
      allowedMimeTypes: BUCKET_ALLOWED_MIME_TYPES,
    })
    return
  }
  const currentMime = existing.allowed_mime_types ?? null
  const inSync =
    existing.file_size_limit === BUCKET_FILE_SIZE_LIMIT &&
    Array.isArray(currentMime) &&
    currentMime.length === BUCKET_ALLOWED_MIME_TYPES.length &&
    BUCKET_ALLOWED_MIME_TYPES.every((mime) => currentMime.includes(mime))
  if (!inSync) {
    await supabaseAdmin.storage.updateBucket(BUCKET, {
      public: true,
      fileSizeLimit: BUCKET_FILE_SIZE_LIMIT,
      allowedMimeTypes: BUCKET_ALLOWED_MIME_TYPES,
    })
  }
}

export function getPublicUrl(path: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function getTransformedUrl(path: string, width = 640) {
  return toTransformedUrl(path, { width })
}

// --- Ingestion guardrails (Phase 2) ---
// Single source of truth for per-folder upload caps. uploadFile() enforces
// them server-side (never trust client pre-compression alone).

export const UPLOAD_LIMITS = {
  // Couple gallery/cover/portrait + template previews: display max 430px, so
  // 2MB source is plenty (thumbnails serve 400-1200w from it).
  images: 2 * 1024 * 1024,
  // Background music: 128kbps x 4min ≈ 3.8MB. Re-encode offline if larger.
  audio: 8 * 1024 * 1024,
} as const

const IMAGE_PREFIXES = ["general", "template-media", "templates", "guest-photos", "seeded", "bank-logos"]

function limitForFolder(folder: string, mime: string) {
  if (mime.startsWith("audio/")) return UPLOAD_LIMITS.audio
  if (mime.startsWith("image/") || IMAGE_PREFIXES.some((p) => folder === p || folder.startsWith(`${p}/`))) {
    return UPLOAD_LIMITS.images
  }
  return 5 * 1024 * 1024
}

export async function uploadFile(file: File, folder: string, name: string) {
  const guestPhoto = isGuestPhotoFolder(folder) && isImageFile(file)

  let body: File | Buffer = file
  let uploadName = name
  let contentType = file.type || "application/octet-stream"

  if (guestPhoto) {
    const normalized = await normalizeGuestPhoto(file)
    if (normalized) {
      body = normalized.buffer
      uploadName = replaceExt(name, normalized.ext)
      contentType = normalized.contentType
    }
  }

  const size = body instanceof File ? body.size : body.length
  // Guest originals get the tighter post-normalization cap; every other
  // folder keeps its existing limit.
  const limit = guestPhoto ? GUEST_PHOTO_MAX_BYTES : limitForFolder(folder, contentType)
  if (size > limit) {
    const mb = (limit / 1024 / 1024).toFixed(1)
    throw new Error(
      contentType.startsWith("audio/")
        ? `Audio terlalu besar (maks ${mb}MB — kompres ke 96-128kbps MP3 dulu)`
        : `Gambar terlalu besar (maks ${mb}MB — kecilkan / kompres dulu)`
    )
  }

  const path = `${folder}/${uploadName}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(
    path,
    uploadBody(body, contentType),
    {
      upsert: false,
      contentType,
      // Immutable content (timestamped names): 1y browser + CDN cache maximizes
      // hit rate and minimizes cached-egress revalidation.
      cacheControl: "31536000",
    }
  )
  if (error) throw error

  await generateThumbnails(body, path)
  return getPublicUrl(path)
}

export async function deleteFile(path: string) {
  // Always remove derivatives with the original; otherwise thumbs leak
  // storage forever after cleanup/clearance.
  const paths = [...new Set([path, ...thumbPathsFor(path)])]
  await supabaseAdmin.storage.from(BUCKET).remove(paths)
}

export async function uploadFromUrl(url: string, folder: string, name: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  const blob = await res.blob()
  const contentType = res.headers.get("content-type") || blob.type || "application/octet-stream"
  const file = new File([blob], name, { type: contentType })
  return uploadFile(file, folder, name)
}
