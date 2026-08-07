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

export async function GET(req: NextRequest) {
  const weddingProfileId = req.nextUrl.searchParams.get("wedding_profile_id")

  if (!weddingProfileId) {
    return new Response("wedding_profile_id diperlukan", { status: 400 })
  }

  const { data: photos, error } = await supabaseAdmin
    .from("guest_photos")
    .select("id, image_url, guests(name)")
    .eq("wedding_profile_id", weddingProfileId)
    .order("created_at", { ascending: false })

  if (error) {
    return new Response(error.message, { status: 500 })
  }
  if (!photos || photos.length === 0) {
    return new Response("Belum ada foto untuk diunduh", { status: 404 })
  }

  const manifest = photos.map((photo) => {
    const guest = Array.isArray(photo.guests) ? photo.guests[0] : (photo.guests as { name?: string } | null)
    const guestName = sanitizeName(guest?.name || "Tamu")
    const ext = fileExt(photo.image_url)
    return {
      url: photo.image_url,
      name: `${guestName}/${photo.id}.${ext}`,
    }
  })

  return NextResponse.json({ photos: manifest })
}