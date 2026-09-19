// Pure Supabase Storage URL helpers — client-safe (no server imports).
// `storage.ts` re-exports these so server code keeps importing from one place.

const STORAGE_MARKER = "/object/public/media/"

export function isSupabaseStorageUrl(url: string) {
  return url.includes("supabase.co/storage/v1/object/public/media/")
}

export function storagePathFromUrl(url: string): string | null {
  const idx = url.indexOf(STORAGE_MARKER)
  if (idx === -1) return null
  const rest = url.slice(idx + STORAGE_MARKER.length).split("?")[0]
  return rest || null
}

export function toTransformedUrl(
  urlOrPath: string,
  opts: { width?: number; quality?: number; resize?: "cover" | "contain" } = {}
): string {
  const { width = 640, quality = 70, resize = "cover" } = opts
  if (!urlOrPath) return urlOrPath
  if (/^https?:\/\//i.test(urlOrPath)) {
    if (!isSupabaseStorageUrl(urlOrPath)) return urlOrPath
    const clean = urlOrPath.split("?")[0]
    return `${clean.replace("/object/public/", "/render/image/public/")}?width=${width}&quality=${quality}&resize=${resize}`
  }
  // Bucket path without origin — needs NEXT_PUBLIC_SUPABASE_URL at runtime.
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  if (!base) return urlOrPath
  return `${base}/storage/v1/render/image/public/media/${urlOrPath}?width=${width}&quality=${quality}&resize=${resize}`
}

// OG/social preview: crawlers fetch this per share, so serve a 1200w
// transform of the raw cover instead of the multi-MB original.
export function toOgImageUrl(urlOrPath: string): string {
  return toTransformedUrl(urlOrPath, { width: 1200, quality: 70, resize: "cover" })
}
