import { supabaseAdmin } from "./supabase"

export { isSupabaseStorageUrl, storagePathFromUrl, toTransformedUrl, toOgImageUrl } from "./storageUrl"

const BUCKET = "media"

export async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.find((b) => b.name === BUCKET)) return
  await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml", "audio/mpeg", "audio/wav", "audio/ogg"],
  })
}

export function getPublicUrl(path: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export function getTransformedUrl(path: string, width = 640, quality = 75, resize: "cover" | "contain" = "cover") {
  const base = getPublicUrl(path)
  if (base.includes("supabase.co/storage")) {
    return `${base.replace("/object/public/", "/render/image/public/")}?width=${width}&quality=${quality}&resize=${resize}`
  }
  return base
}

// --- Egress-safe serving helpers (Phase 1) ---
// Re-exported from ./storageUrl (client-safe). Raw /object/public/ URLs
// serve full original bytes on every hit; toTransformedUrl() rewrites any
// Supabase Storage URL to the /render/image/ transform at the width the UI
// actually displays. Non-Supabase URLs pass through untouched.

// --- Ingestion guardrails (Phase 2) ---
// Single source of truth for per-folder upload caps. uploadFile() enforces
// them server-side (never trust client pre-compression alone).

export const UPLOAD_LIMITS = {
  // Couple gallery/cover/portrait + template previews: display max 430px, so
  // 2MB source is plenty (transform serves 400-800w from it).
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
  const limit = limitForFolder(folder, file.type)
  if (file.size > limit) {
    const mb = (limit / 1024 / 1024).toFixed(0)
    throw new Error(
      file.type.startsWith("audio/")
        ? `Audio terlalu besar (maks ${mb}MB — kompres ke 96-128kbps MP3 dulu)`
        : `Gambar terlalu besar (maks ${mb}MB — kecilkan / kompres dulu)`
    )
  }
  const path = `${folder}/${name}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
    // Immutable content (timestamped names): 1y browser + CDN cache maximizes
    // hit rate and minimizes cached-egress revalidation.
    cacheControl: "31536000",
  })
  if (error) throw error
  // Phase 2 path-first: callers that need size variants should persist `path`
  // alongside the URL. The URL stays for backward compat with old rows.
  return getPublicUrl(path)
}

export async function deleteFile(path: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([path])
}

export async function uploadFromUrl(url: string, folder: string, name: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}`)
  const blob = await res.blob()
  const contentType = res.headers.get("content-type") || blob.type || "application/octet-stream"
  const file = new File([blob], name, { type: contentType })
  return uploadFile(file, folder, name)
}
