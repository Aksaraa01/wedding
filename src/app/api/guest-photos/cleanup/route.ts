import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { storagePathFromUrl } from "@/lib/storageUrl"
import { getPhotoRetentionDays } from "@/lib/appSettings"
import { hasGaleri, lastEventDate, addDaysIso, daysUntil, isIsoDate, todayIso } from "@/lib/lifecycle"

// Legacy guest-photo cleanup endpoint. Deletion is OPS-MANUAL by design (see
// /ops/clearance); nothing schedules this. It is kept token-guarded as a
// fallback and SCOPED to galeri profiles only (gt / galeri_addon) — it must
// never delete photos for non-galeri profiles. Retention + eligibility come
// from the DB (app_settings), never hardcoded.

const TOKEN = process.env.GUEST_PHOTOS_CLEANUP_TOKEN || ""
const BUCKET = "media"
const BATCH = 100

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-cleanup-token") || ""
    if (!TOKEN || token !== TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const retentionDays = await getPhotoRetentionDays()
    const today = todayIso()

    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, sessions, estimated_wedding_date, package_type, galeri_addon, gallery_end_at")
      .or("package_type.eq.gt,galeri_addon.eq.true")

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    const expiredIds: string[] = []
    for (const profile of profiles || []) {
      if (!hasGaleri(profile)) continue
      const last = lastEventDate(profile.sessions, profile.estimated_wedding_date)
      const base = isIsoDate(profile.gallery_end_at) ? (profile.gallery_end_at as string).slice(0, 10) : last
      if (!base) continue
      if (daysUntil(addDaysIso(base, retentionDays), today) <= 0) expiredIds.push(profile.id)
    }

    let deletedPhotos = 0
    for (const profileId of expiredIds) {
      const { data: photos } = await supabaseAdmin
        .from("guest_photos")
        .select("id, image_url")
        .eq("wedding_profile_id", profileId)

      const rows = photos || []
      const paths = rows.map((p) => storagePathFromUrl(p.image_url)).filter(Boolean) as string[]
      const unique = [...new Set(paths)]
      for (let i = 0; i < unique.length; i += BATCH) {
        await supabaseAdmin.storage.from(BUCKET).remove(unique.slice(i, i + BATCH))
      }
      if (rows.length) {
        await supabaseAdmin
          .from("guest_photos")
          .delete()
          .eq("wedding_profile_id", profileId)
      }
      deletedPhotos += rows.length
    }

    return NextResponse.json({ profilesChecked: profiles?.length || 0, expired: expiredIds.length, deletedPhotos })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
