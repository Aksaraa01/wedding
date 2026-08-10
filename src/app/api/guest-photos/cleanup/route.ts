import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { deleteFile } from "@/lib/storage"

const TOKEN = process.env.GUEST_PHOTOS_CLEANUP_TOKEN || ""

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-cleanup-token") || ""
    if (!TOKEN || token !== TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, sessions")
      .not("sessions", "is", null)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()

    const expiredIds: string[] = []
    for (const profile of profiles || []) {
      const sessions = Array.isArray(profile.sessions) ? (profile.sessions as { date?: string }[]) : []
      const dates = sessions.map(s => s.date).filter((d): d is string => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d))
      if (!dates.length) continue
      const latest = dates.map(d => new Date(d)).sort((a, b) => a.getTime() - b.getTime()).pop()!
      const deletion = new Date(latest)
      deletion.setDate(deletion.getDate() + 7)
      const deletionStart = new Date(deletion.getFullYear(), deletion.getMonth(), deletion.getDate()).getTime()
      if (deletionStart <= todayStart) {
        expiredIds.push(profile.id)
      }
    }

    let deletedPhotos = 0
    for (const profileId of expiredIds) {
      const { data: photos } = await supabaseAdmin
        .from("guest_photos")
        .select("id, image_url")
        .eq("wedding_profile_id", profileId)

      for (const photo of photos || []) {
        const path = extractStoragePath(photo.image_url)
        if (path) {
          try { await deleteFile(path) } catch {}
        }
        await supabaseAdmin.from("guest_photos").delete().eq("id", photo.id)
        deletedPhotos++
      }
    }

    return NextResponse.json({ profilesChecked: profiles?.length || 0, expired: expiredIds.length, deletedPhotos })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

function extractStoragePath(url: string): string | null {
  if (!url) return null
  const marker = "/object/public/media/"
  const idx = url.indexOf(marker)
  if (idx === -1) return null
  const rest = url.slice(idx + marker.length).split("?")[0]
  return rest || null
}