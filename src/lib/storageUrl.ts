// Pure Supabase Storage URL helpers — client-safe (no server imports).
// `storage.ts` re-exports these so server code keeps importing from one place.
//
// Image transformations are NOT used anymore: Supabase bills per distinct
// origin image transformed (100/month on Pro). Derivative WebP files are
// generated once at upload time (and backfilled for old objects) under
// `thumbs/{width}/{original-path}.webp`; serving is a plain object URL, so it
// costs storage/egress only.
//
// `toTransformedUrl()` keeps its historical name because ~15 call sites use
// it, but it now returns a pre-generated thumbnail URL. Non-Supabase URLs and
// formats we cannot safely re-encode (svg/gif/heic) pass through untouched.

const OBJECT_MARKER = "/storage/v1/object/public/media/"
// Older/local URLs may omit the `/storage/v1` prefix but still point at the
// media bucket. Keep parsing them so dev and legacy rows resolve too.
const LEGACY_MARKER = "/object/public/media/"
const THUMB_PREFIX = "thumbs"

const GUEST_PHOTO_WIDTHS = [400, 800] as const
const DEFAULT_WIDTHS = [400, 800, 1200] as const

// Vector/animated images must not be re-encoded. HEIC/HEIF uploads either
// stay original (browsers that can render them) or are normalized to JPEG
// server-side before reaching this helper.
const NON_DERIVABLE_EXT = /\.(svg|gif|heic|heif|mp3|wav|ogg|m4a|aac)$/i

function bucketPathFromUrl(url: string): string | null {
  if (url.includes(OBJECT_MARKER)) {
    const idx = url.indexOf(OBJECT_MARKER)
    return url.slice(idx + OBJECT_MARKER.length).split("?")[0] || null
  }
  const legacy = url.indexOf(LEGACY_MARKER)
  if (legacy === -1) return null
  return url.slice(legacy + LEGACY_MARKER.length).split("?")[0] || null
}

export function isSupabaseStorageUrl(url: string) {
  return url.includes(OBJECT_MARKER) || url.includes(LEGACY_MARKER)
}

export function storagePathFromUrl(url: string): string | null {
  return bucketPathFromUrl(url)
}

// Which pre-generated widths exist for a bucket path. Guest photos only need
// grid (400) and card (800); everything else also serves covers/OG (1200).
export function thumbWidthsForPath(path: string): readonly number[] {
  const clean = path.replace(/^\/+/, "").split("?")[0]
  if (!clean) return []
  if (clean.startsWith(`${THUMB_PREFIX}/`)) return []
  if (clean.startsWith("template-media/og/")) return []
  if (NON_DERIVABLE_EXT.test(clean)) return []
  if (clean.startsWith("guest-photos/")) return GUEST_PHOTO_WIDTHS
  return DEFAULT_WIDTHS
}

function pickThumbWidth(widths: readonly number[], requested: number): number {
  for (const w of widths) {
    if (w >= requested) return w
  }
  return widths[widths.length - 1]
}

export function thumbPathFor(pathOrUrl: string, width = 640): string | null {
  const path = pathOrUrl.includes("/") && /^https?:\/\//i.test(pathOrUrl)
    ? storagePathFromUrl(pathOrUrl)
    : pathOrUrl.replace(/^\/+/, "").split("?")[0]
  if (!path) return null
  const widths = thumbWidthsForPath(path)
  if (!widths.length) return null
  const w = pickThumbWidth(widths, width)
  const withoutExt = path.replace(/\.[^./]+$/, "")
  return `${THUMB_PREFIX}/${w}/${withoutExt}.webp`
}

// All derivative paths for cleanup/clearance. Empty for non-derivable files.
export function thumbPathsFor(pathOrUrl: string): string[] {
  const path = pathOrUrl.includes("/") && /^https?:\/\//i.test(pathOrUrl)
    ? storagePathFromUrl(pathOrUrl)
    : pathOrUrl.replace(/^\/+/, "").split("?")[0]
  if (!path) return []
  return thumbWidthsForPath(path).map((w) => {
    const withoutExt = path.replace(/\.[^./]+$/, "")
    return `${THUMB_PREFIX}/${w}/${withoutExt}.webp`
  })
}

export function toTransformedUrl(
  urlOrPath: string,
  opts: { width?: number; quality?: number; resize?: "cover" | "contain" } = {}
): string {
  const { width = 640 } = opts
  if (!urlOrPath) return urlOrPath
  // Data/blob URLs and same-origin public assets (`/defaults/...`,
  // `/images/...`) never live in the media bucket.
  if (/^(data:|blob:)/i.test(urlOrPath)) return urlOrPath
  if (urlOrPath.startsWith("/")) return urlOrPath

  let path: string | null = null
  let origin = ""
  if (/^https?:\/\//i.test(urlOrPath)) {
    path = storagePathFromUrl(urlOrPath)
    if (!path) return urlOrPath
    const idx = urlOrPath.indexOf(OBJECT_MARKER)
    origin = idx >= 0
      ? urlOrPath.slice(0, idx)
      : urlOrPath.slice(0, urlOrPath.indexOf(LEGACY_MARKER))
  } else {
    path = urlOrPath.split("?")[0].replace(/^\/+/, "") || null
    if (!path) return urlOrPath
  }

  const thumbPath = thumbPathFor(path, width)
  if (!thumbPath) return urlOrPath
  if (origin) return `${origin}${OBJECT_MARKER}${thumbPath}`
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  if (!base) return urlOrPath
  return `${base}${OBJECT_MARKER}${thumbPath}`
}

// OG/social preview: crawlers fetch this per share, so serve the 1200w
// derivative instead of the multi-MB original. Dedicated og variants pass
// through untouched — re-encoding them would only waste storage.
export function toOgImageUrl(urlOrPath: string): string {
  if (typeof urlOrPath === "string" && urlOrPath.includes("/template-media/og/")) {
    return urlOrPath.split("?")[0]
  }
  return toTransformedUrl(urlOrPath, { width: 1200, quality: 70, resize: "contain" })
}
