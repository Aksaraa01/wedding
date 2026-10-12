import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const PAGE_SIZE = 30

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")
    const guestId = searchParams.get("guest_id")

    if (guestId) {
      const { data } = await supabaseAdmin
        .from("guest_photos")
        .select("id, image_url, source, caption, created_at")
        .eq("guest_id", guestId)
        .order("created_at", { ascending: true })
      const photos = data || []
      return NextResponse.json({ exists: photos.length > 0, photos })
    }

    if (!weddingProfileId) {
      return NextResponse.json({ error: "wedding_profile_id diperlukan" }, { status: 400 })
    }

    // Paginated owner listing. Without `page`/`q` params the first page is
    // returned plus the total, so old callers keep working.
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1)
    const q = (searchParams.get("q") || "").trim().slice(0, 60)
    const source = searchParams.get("source") || ""

    let query = supabaseAdmin
      .from("guest_photos")
      .select("id, image_url, created_at, guest_id, device_id, uploader_name, category, caption, source, guests(name, category, is_checked_in, rsvp_message)", { count: "exact" })
      .eq("wedding_profile_id", weddingProfileId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    // Pill filter on the owner gallery: "gallery" = guest uploads,
    // "selfie" = check-in photos. Anything else = everything.
    if (source === "gallery" || source === "selfie") {
      query = query.eq("source", source)
    }

    if (q) {
      const like = `%${q.replace(/[%_]/g, "")}%`
      query = query.or(`uploader_name.ilike.${like},caption.ilike.${like}`)
    }

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const retention = await getRetention(weddingProfileId)

    return NextResponse.json({
      photos: data,
      total: count || 0,
      page,
      page_size: PAGE_SIZE,
      has_more: (count || 0) > page * PAGE_SIZE,
      ...retention,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

async function getRetention(weddingProfileId: string) {
  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("sessions, package_type, galeri_addon, gallery_end_at")
    .eq("id", weddingProfileId)
    .single()

  // Galeri Tamu: 7-day dashboard access from the event end
  // ("Masa Aktif Foto 7 Hari").
  if (
    (profile?.package_type === "gt" || (profile as any)?.galeri_addon === true) &&
    profile?.gallery_end_at
  ) {
    const end = new Date(profile.gallery_end_at as string)
    if (!Number.isNaN(end.getTime())) {
      const deletion = new Date(end)
      deletion.setDate(deletion.getDate() + 7)
      const iso = (d: Date) => d.toISOString().slice(0, 10)
      return { hasEventDate: true, latestEventDate: iso(end), deletionDate: iso(deletion), retentionDays: 7 }
    }
  }

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
