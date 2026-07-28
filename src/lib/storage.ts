import { supabaseAdmin } from "./supabase"

const BUCKET = "media"

export async function ensureBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets()
  if (buckets?.find((b) => b.name === BUCKET)) return
  await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: 20 * 1024 * 1024, // 20 MB
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "audio/mpeg", "audio/wav", "audio/ogg"],
  })
}

export function getPublicUrl(path: string) {
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function uploadFile(file: File, folder: string, name: string) {
  const path = `${folder}/${name}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, file, {
    upsert: true,
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
