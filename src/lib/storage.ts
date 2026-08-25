import { supabaseAdmin } from "./supabase"

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

export function getTransformedUrl(path: string, width = 640, quality = 75) {
  const base = getPublicUrl(path)
  if (base.includes("supabase.co/storage")) {
    return `${base.replace("/object/public/", "/render/image/public/")}?width=${width}&quality=${quality}&resize=contain`
  }
  return base
}

export async function uploadFile(file: File, folder: string, name: string) {
  if (file.size > 5 * 1024 * 1024) throw new Error("File too large (max 5MB)")
  const path = `${folder}/${name}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error
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
