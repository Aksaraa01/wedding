// Client-side image downscaling/re-encoding so phone photos (typically 2-8MB)
// fit the server's 2MB ingestion cap without asking the couple to compress
// anything. Runs entirely in the browser; falls back to the original file when
// the browser cannot decode it (e.g. HEIC on non-Safari) so the server's own
// guard remains the final authority.

export interface CompressImageOptions {
  maxBytes?: number
  maxDimension?: number
  initialQuality?: number
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), type, quality))
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("Image decode failed"))
    img.src = url
  })
}

// Cheap 64x64 sample to know whether the source has any transparency.
function imageHasAlpha(img: HTMLImageElement): boolean {
  try {
    const size = 64
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")
    if (!ctx) return false
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) return true
    }
    return false
  } catch {
    return false
  }
}

// Downscale + re-encode until the blob fits maxBytes. Transparent sources are
// encoded as WebP (lossy with alpha); opaque sources as JPEG.
async function encodeWithinLimit(
  img: HTMLImageElement,
  maxDimension: number,
  maxBytes: number,
  initialQuality: number,
  transparent: boolean
): Promise<Blob | null> {
  const srcW = img.naturalWidth || img.width
  const srcH = img.naturalHeight || img.height
  const scale = Math.min(1, maxDimension / Math.max(srcW, srcH))
  let width = Math.max(1, Math.round(srcW * scale))
  let height = Math.max(1, Math.round(srcH * scale))
  let quality = initialQuality

  const type = transparent ? "image/webp" : "image/jpeg"
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) return null

  let blob: Blob | null = null
  for (let i = 0; i < 16; i++) {
    canvas.width = width
    canvas.height = height
    if (transparent) {
      ctx.clearRect(0, 0, width, height)
    } else {
      // JPEG drops alpha; paint white first so stray transparency isn't black.
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, width, height)
    }
    ctx.drawImage(img, 0, 0, width, height)
    blob = await canvasToBlob(canvas, type, quality)
    if (!blob) break
    if (blob.size <= maxBytes) break
    if (quality > 0.55) {
      quality = Math.max(0.55, quality - 0.1)
    } else {
      width = Math.max(1, Math.round(width * 0.85))
      height = Math.max(1, Math.round(height * 0.85))
      quality = 0.75
    }
  }
  return blob
}

const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
}

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const { maxBytes = 1.8 * 1024 * 1024, maxDimension = 2000, initialQuality = 0.85 } = options

  if (!file.type.startsWith("image/")) return file
  // Vector/animated formats: re-encoding would destroy them, and they are small.
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file
  if (file.size <= maxBytes) return file

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    if (!(img.naturalWidth || img.width) || !(img.naturalHeight || img.height)) return file

    const transparent = imageHasAlpha(img)
    let blob = await encodeWithinLimit(img, maxDimension, maxBytes, initialQuality, transparent)

    // A browser without WebP encode support returns PNG for the transparent
    // pass. If that still exceeds the cap, re-encode as white-filled JPEG
    // (alpha lost, but never black).
    if (transparent && blob && blob.type !== "image/webp" && blob.size > maxBytes) {
      blob = await encodeWithinLimit(img, maxDimension, maxBytes, initialQuality, false)
    }

    // If compression did not help (already optimized, or output larger), keep
    // the original and let the server respond with its size error.
    if (!blob || blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, "") || "image"
    const ext = EXT_BY_TYPE[blob.type] || "jpg"
    return new File([blob], `${base}.${ext}`, { type: blob.type || "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}
