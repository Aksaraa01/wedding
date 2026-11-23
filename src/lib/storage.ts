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
// sharp enough for download/share/keepsake book while keeping storage + egress
// sane. 3000px keeps the full phone frame; 1.75MB caps storage/egress.
export const GUEST_PHOTO_MAX_DIMENSION = 3000
export const GUEST_PHOTO_MAX_BYTES = 1.75 * 1024 * 1024
// Decode ceiling: 60MP covers a 48MP phone photo, while a corrupt/giant file
// is rejected instead of decoding hundreds of MB inside a request.
const GUEST_PHOTO_MAX_INPUT_PIXELS = 60_000_000
const THUMB_QUALITY = 72

// sharp is the memory hog in this app (a 12MP decode is ~36-48MB of raw
// pixels). The process is a single PM2 fork, so an in-process semaphore is
// enough to bound it: at most 2 sharp pipelines at once, each with one libvips
// thread. Without this, 10 concurrent over-limit uploads pushed staging to
// 840MB and killed the process (2026-11-23).
const SHARP_CONCURRENCY = 2
type SharpGate = { active: number; queue: Array<() => void> }
// globalThis so a duplicated module chunk (route bundles) still shares the
// gate; two semaphores in one process would double the real concurrency.
const globalForSharp = globalThis as typeof globalThis & { __aksaraSharpGate?: SharpGate }
const sharpGate = (globalForSharp.__aksaraSharpGate ??= { active: 0, queue: [] })

async function acquireSharpSlot(): Promise<void> {
  if (sharpGate.active < SHARP_CONCURRENCY) {
    sharpGate.active += 1
    return
  }
  await new Promise<void>((resolve) => sharpGate.queue.push(resolve))
}

function releaseSharpSlot(): void {
  const next = sharpGate.queue.shift()
  if (next) next()
  else sharpGate.active = Math.max(0, sharpGate.active - 1)
}

async function withSharpSlot<T>(fn: () => Promise<T>): Promise<T> {
  await acquireSharpSlot()
  try {
    return await fn()
  } finally {
    releaseSharpSlot()
  }
}

let sharpConfigured = false
async function getSharp() {
  const { default: sharp } = await import("sharp")
  if (!sharpConfigured) {
    // Do not keep decoded-image caches around between requests; the upload
    // path is one-shot and the RSS never needs to grow with event traffic.
    sharp.cache(false)
    sharp.concurrency(1)
    sharpConfigured = true
  }
  return sharp
}

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
    const sharp = await getSharp()
    const input = Buffer.from(await file.arrayBuffer())
    // Already within both limits (and upright): upload the original untouched
    // instead of paying a re-encode (and losing detail) for nothing.
    const meta = await sharp(input, { limitInputPixels: GUEST_PHOTO_MAX_INPUT_PIXELS }).metadata()
    const longEdge = Math.max(meta.width || 0, meta.height || 0)
    const format = meta.format || ""
    const orientation = meta.orientation || 1
    if (
      ["jpeg", "png", "webp"].includes(format) &&
      orientation === 1 &&
      file.size <= GUEST_PHOTO_MAX_BYTES &&
      longEdge > 0 &&
      longEdge <= GUEST_PHOTO_MAX_DIMENSION
    ) {
      return null
    }
    if ((meta.width || 0) * (meta.height || 0) > GUEST_PHOTO_MAX_INPUT_PIXELS) {
      // Too many pixels to decode safely inside a request; the caller's byte
      // check turns this into a clear "too large" response instead of an OOM.
      return null
    }

    const overBytes = input.length > GUEST_PHOTO_MAX_BYTES
    let width = Math.min(GUEST_PHOTO_MAX_DIMENSION, longEdge || GUEST_PHOTO_MAX_DIMENSION)
    if (overBytes && longEdge > 0) {
      // Estimate the long edge that lands near the byte cap, then let the
      // quality loop absorb the rest. One or two passes instead of six.
      const scale = Math.sqrt(GUEST_PHOTO_MAX_BYTES / input.length)
      width = Math.max(1280, Math.min(width, Math.round(longEdge * scale)))
    }
    // Over-limit/oversized inputs start below q95; a full-size q95 pass on a
    // 12MP photo is what multiplied memory and latency under load.
    let quality = overBytes || longEdge > GUEST_PHOTO_MAX_DIMENSION ? 82 : 95

    return await withSharpSlot(async () => {
      // Decode + resize exactly once. Re-encoding the raw pixels avoids
      // re-decoding the 12MP source (and re-allocating it) on every quality
      // attempt, which is what spiked RSS to 776MB under 10 concurrent uploads.
      const { data, info } = await sharp(input, { limitInputPixels: GUEST_PHOTO_MAX_INPUT_PIXELS })
        .rotate()
        .resize({ width, height: width, fit: "inside", withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .toColourspace("srgb")
        .raw()
        .toBuffer({ resolveWithObject: true })
      for (let attempt = 0; attempt < 5; attempt++) {
        const out = await sharp(data, {
          raw: { width: info.width, height: info.height, channels: info.channels },
        })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
        if (out.length <= GUEST_PHOTO_MAX_BYTES) {
          return { buffer: out, ext: "jpg", contentType: "image/jpeg" }
        }
        if (quality <= 65) break
        quality = Math.max(65, quality - 7)
      }
      return null
    })
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
    const input = body instanceof File ? Buffer.from(await body.arrayBuffer()) : body
    const sharp = await getSharp()
    await withSharpSlot(async () => {
      for (const width of widths) {
        const thumbPath = thumbPathFor(path, width)
        if (!thumbPath) continue
        const out = await sharp(input, { limitInputPixels: GUEST_PHOTO_MAX_INPUT_PIXELS })
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
    })
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

const IMAGE_PREFIXES = ["general", "template-media", "templates", "guest-photos", "seeded", "bank-logos", "cs-uploads"]

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
