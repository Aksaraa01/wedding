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

export async function compressImage(file: File, options: CompressImageOptions = {}): Promise<File> {
  const { maxBytes = 1.8 * 1024 * 1024, maxDimension = 2000, initialQuality = 0.85 } = options

  if (!file.type.startsWith("image/")) return file
  // Vector/animated formats: re-encoding would destroy them, and they are small.
  if (file.type === "image/svg+xml" || file.type === "image/gif") return file
  if (file.size <= maxBytes) return file

  const url = URL.createObjectURL(file)
  try {
    const img = await loadImage(url)
    const srcW = img.naturalWidth || img.width
    const srcH = img.naturalHeight || img.height
    if (!srcW || !srcH) return file

    const scale = Math.min(1, maxDimension / Math.max(srcW, srcH))
    let width = Math.max(1, Math.round(srcW * scale))
    let height = Math.max(1, Math.round(srcH * scale))
    let quality = initialQuality

    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) return file

    let blob: Blob | null = null
    for (let i = 0; i < 16; i++) {
      canvas.width = width
      canvas.height = height
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, 0, 0, width, height)
      blob = await canvasToBlob(canvas, "image/jpeg", quality)
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

    // If compression did not help (already optimized, or output larger), keep
    // the original and let the server respond with its size error.
    if (!blob || blob.size >= file.size) return file

    const base = file.name.replace(/\.[^.]+$/, "") || "image"
    return new File([blob], `${base}.jpg`, { type: "image/jpeg", lastModified: Date.now() })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}
