import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    const guestId = searchParams.get("guest_id")

    if (guestId) {
      const { data } = await supabaseAdmin
        .from("guest_photos")
        .select("id, image_url")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: true })
      const photos = data || []
      return NextResponse.json({ exists: photos.length > 0, photos })
    }

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("guest_photos")
      .select("id, image_url, created_at, guest_id, guests(name, category)")
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const retention = await getRetention(weddingProfileId)

    return NextResponse.json({ photos: data, ...retention })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function getRetention(weddingProfileId: string) {
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("sessions")
    .eq("id", weddingProfileId)
    .single()

  const sessions = Array.isArray(profile?.sessions) ? (profile.sessions as { date?: string }[]) : []
  const dates = sessions.map(s => s.date).filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
  const latest = dates.length ? dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime()).pop() : null

  if (!latest) {
    return { hasEventDate: false, latestEventDate: null, deletionDate: null }
  }

  const deletion = new Date(latest)
  deletion.setDate(deletion.getDate() + 7)
  deletion.setHours(23, 59, 0, 0)

  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    hasEventDate: true,
    latestEventDate: iso(latest),
    deletionDate: iso(deletion),
  }
}
