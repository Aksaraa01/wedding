import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"
import { ensureBucket, uploadFile } from "@/lib/storage"
import {
  generateUniqueGalleryToken,
  galleryCameraUrl,
  wibToUtcIso,
  formatGalleryDateWib,
  formatGalleryTimeWib,
} from "@/lib/gallery"
import { isGalleryPackage } from "@/lib/packages"
import { getFeatureIncluded } from "@/lib/featureGates"
import { sanitizeCoupleName } from "@/lib/nameClean"

const MAX_NAME = 80

// Owner setup for the Galeri event: couple photo + name + date/time window.
// Only three fields by design (no venue, no extra metadata).
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth) return auth
  const { id } = await params

  const { data: profile, error } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, package_type, payment_status, bride_name, groom_name, display_name, estimated_wedding_date, sessions, cover_photos, couple_illustration_url, gallery_token, gallery_couple_name, gallery_photo_url, gallery_start_at, gallery_end_at, galeri_addon, galeri_photos_per_guest, galeri_guest_count, galeri_tier, galeri_price")
    .eq("id", id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
  }

  // Editor prefill (Undangan add-on): couple name, cover photo with the same
  // fallback chain as the invitation (first cover → illustration → default),
  // and date/start from the first session. Stored gallery_* always wins.
  const firstCover = (input: unknown): string => {
    if (typeof input === "string") return input.trim()
    if (Array.isArray(input)) {
      for (const v of input) {
        const found = firstCover(v)
        if (found) return found
      }
    }
    return ""
  }
  const covers = Array.isArray((profile as any).cover_photos) ? (profile as any).cover_photos : []
  const editorPhotoRaw =
    firstCover(covers) ||
    (((profile as any).couple_illustration_url as string) || "").trim() ||
    ""
  // Only storage URLs are usable as photo URLs. A local public asset
  // (/defaults/...) is NOT in the bucket — returning it here would make
  // image transforms build a bogus media//defaults/... URL that 404s.
  // The dashboard shows its initial-letter placeholder instead.
  const editorPhoto = editorPhotoRaw.startsWith("http") ? editorPhotoRaw : ""
  // Detail Acara prefill is always "mempelai 1 & mempelai 2" — the
  // invitation hashtag (display_name) must never leak in here.
  const editorName =
    `${profile.bride_name || ""} & ${profile.groom_name || ""}`.replace(/^ & | & $/g, "").trim()
  const sessions = Array.isArray((profile as any).sessions) ? (profile as any).sessions as { date?: string; time?: string }[] : []
  const rawDate = (sessions[0]?.date || (profile as any).estimated_wedding_date || "") as string
  const rawTime = (sessions[0]?.time || "") as string
  const editorDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : ""
  const editorStart = /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : ""

  const { count: photoCount } = await supabaseAdmin
    .from("guest_photos")
    .select("id", { count: "exact", head: true })
    .eq("wedding_profile_id", id)

  // Distinct-device count (bounded fetch: event caps keep this small).
  const { data: deviceRows } = await supabaseAdmin
    .from("guest_photos")
    .select("device_id")
    .eq("wedding_profile_id", id)
    .neq("source", "selfie")
    .not("device_id", "is", null)
    .limit(2000)
  // Guest contributors (Buku Tamu Digital path): per-guest uploads carry
  // guest_id with NO device, and QR-tamu check-ins may never upload — both
  // are beloved guests too, so they join the count. Device rows and guest
  // rows are disjoint by construction (one side is always null).
  const { data: photoGuestRows } = await supabaseAdmin
    .from("guest_photos")
    .select("guest_id")
    .eq("wedding_profile_id", id)
    .not("guest_id", "is", null)
    .limit(2000)
  const { data: checkedRows } = await supabaseAdmin
    .from("guests")
    .select("id")
    .eq("wedding_profile_id", id)
    .eq("is_checked_in", true)
    .limit(5000)
  const guestIds = new Set([
    ...(photoGuestRows || []).map((r) => r.guest_id as string),
    ...(checkedRows || []).map((r) => (r as { id: string }).id),
  ])
  const devices = new Set((deviceRows || []).map((r) => r.device_id as string)).size + guestIds.size

  return NextResponse.json({
    setup: {
      package_type: profile.package_type,
      is_gallery: isGalleryPackage(profile.package_type),
      galeri_addon: profile.galeri_addon === true,
      // Detail card renders for every surface carrying the galeri feature:
      // standalone GT bands, the Undangan add-on, and Buku Tamu Digital
      // (which bundles galeri_foto_tamu in package_features).
      galeri_enabled:
        isGalleryPackage(profile.package_type) ||
        profile.galeri_addon === true ||
        (await getFeatureIncluded(profile.package_type || "")).has("galeri_foto_tamu"),
      galeri_photos_per_guest: profile.galeri_photos_per_guest || null,
      galeri_guest_count: profile.galeri_guest_count || null,
      galeri_tier: profile.galeri_tier || null,
      galeri_price: profile.galeri_price || 0,
      payment_status: profile.payment_status,
      gallery_token: profile.gallery_token,
      gallery_url: profile.gallery_token ? galleryCameraUrl(profile.gallery_token) : null,
      gallery_couple_name: profile.gallery_couple_name || editorName,
      gallery_photo_url: profile.gallery_photo_url || null,
      gallery_start_at: profile.gallery_start_at,
      gallery_end_at: profile.gallery_end_at,
      date_label: formatGalleryDateWib(profile.gallery_start_at),
      start_label: formatGalleryTimeWib(profile.gallery_start_at),
      end_label: formatGalleryTimeWib(profile.gallery_end_at),
      // Editor prefill for the setup form (used while unconfigured).
      prefill: { date: editorDate, start_time: editorStart, photo_url: editorPhoto || null },
    },
    stats: { photos: photoCount || 0, devices },
  })
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth) return auth
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 })
  }

  const rawName = typeof body.couple_name === "string" ? body.couple_name.trim() : ""
  const coupleName = sanitizeCoupleName(rawName).replace(/ +/g, " ").trim().slice(0, MAX_NAME)
  const date = typeof body.date === "string" ? body.date : ""
  const startTime = typeof body.start_time === "string" ? body.start_time : ""
  const endTime = typeof body.end_time === "string" ? body.end_time : ""

  if (!coupleName) {
    return NextResponse.json({ error: "Nama mempelai wajib diisi" }, { status: 400 })
  }
  const startAt = wibToUtcIso(date, startTime)
  const endAt = wibToUtcIso(date, endTime)
  if (!startAt || !endAt) {
    return NextResponse.json({ error: "Tanggal dan jam acara belum lengkap" }, { status: 400 })
  }
  if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
    return NextResponse.json({ error: "Jam selesai harus setelah jam mulai" }, { status: 400 })
  }

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, gallery_token")
    .eq("id", id)
    .single()
  if (!profile) {
    return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
  }

  const token = profile.gallery_token || (await generateUniqueGalleryToken())

  const { error } = await supabaseAdmin
    .from("wedding_profiles")
    .update({
      gallery_token: token,
      gallery_couple_name: coupleName,
      gallery_start_at: startAt,
      gallery_end_at: endAt,
    })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    gallery_token: token,
    gallery_url: galleryCameraUrl(token),
  })
}

// Couple photo upload (multipart). Kept separate so the JSON setup form
// stays small and the photo can be retried independently on weak networks.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req)
  if (auth) return auth
  const { id } = await params

  try {
    await ensureBucket()
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file || !file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 })
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
    const url = await uploadFile(file, "gallery-couple", `${id}-${Date.now()}.${ext}`)
    await supabaseAdmin.from("wedding_profiles").update({ gallery_photo_url: url }).eq("id", id)
    return NextResponse.json({ success: true, gallery_photo_url: url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
