import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeName(name: string): string {
  return (
    name
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, " ")
      .trim() || "Tamu"
  )
}

function fileExt(url: string): string {
  const clean = url.split("?")[0]
  const match = clean.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : "jpg"
}

// Manifest-only endpoint: the browser fetches each original and zips locally
// (fflate), so the 2GB VPS never holds hundreds of megabytes in memory.
// Chunked via `offset`/`limit` so 400–600-photo events stay responsive.
export async function GET(req: NextRequest) {
  const weddingProfileId = req.nextUrl.searchParams.get("wedding_profile_id")
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10) || 0)
  const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "200", 10) || 200))

  if (!weddingProfileId) {
    return new Response("wedding_profile_id diperlukan", { status: 400 })
  }

  const { data: photos, error, count } = await supabaseAdmin
    .from("guest_photos")
    .select("id, image_url, uploader_name, category, caption, created_at, guests(name)", { count: "exact" })
    .eq("wedding_profile_id", weddingProfileId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return new Response(error.message, { status: 500 })
  }
  if ((!photos || photos.length === 0) && offset === 0) {
    return new Response("Belum ada foto untuk diunduh", { status: 404 })
  }

  const manifest = (photos || []).map((photo) => {
    const guest = Array.isArray(photo.guests) ? photo.guests[0] : (photo.guests as { name?: string } | null)
    const rawName = (photo.uploader_name as string | null) || guest?.name || "Tamu"
    const displayName = sanitizeName(rawName)
    const ext = fileExt(photo.image_url)
    return {
      url: photo.image_url,
      name: `${displayName}/${photo.id}.${ext}`,
      caption: (photo.caption as string | null) || "",
      category: (photo.category as string | null) || "",
      created_at: photo.created_at,
    }
  })

  // Captions sidecar so stories travel with the ZIP (one file per chunk).
  const captions = manifest
    .map((m) => `[${m.name}]${m.category ? ` (${m.category})` : ""}\n${m.caption || "(tanpa caption)"}`)
    .join("\n\n")

  return NextResponse.json({ photos: manifest, captions, total: count || 0, offset, limit })
}
