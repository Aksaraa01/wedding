import { supabaseAdmin } from "@/lib/supabase"
import { generateToken } from "@/lib/qr"
import { cachedRead } from "@/lib/refCache"
import { resolveEventPhoto } from "@/lib/event-photo"
import { siteOrigin } from "@/lib/site"
import { DGB_BASE_QUOTA, GALLERY_DEFAULT_CAP, GALLERY_DEFAULT_QUOTA, galeriEventCap, matchGaleriTier, type GaleriTierRow } from "@/lib/packages"

// Server-only gallery helpers (imports supabaseAdmin — never import from
// client components; use ./gallery-client for the browser side).

export type GalleryStatus = "active" | "upcoming" | "ended" | "not_configured" | "locked" | "invalid" | "cleared"

export type GalleryEvent = {
  id: string
  package_type: string
  payment_status: string
  gallery_token: string
  gallery_couple_name: string | null
  gallery_photo_url: string | null
  gallery_start_at: string | null
  gallery_end_at: string | null
  bride_name?: string | null
  groom_name?: string | null
  cover_photos?: unknown
  couple_illustration_url?: string | null
  gallery_frame?: string | null
  gallery_camera?: string | null
  photos_cleared_at?: string | null
}

// Galeri surfaces always show "mempelai 1 & mempelai 2". The invitation
// hashtag (display_name) must never leak in as the couple name.
export function galeriCoupleName(e: {
  gallery_couple_name?: string | null
  bride_name?: string | null
  groom_name?: string | null
}): string {
  const stored = (e.gallery_couple_name || "").trim()
  if (stored) return stored
  return `${e.groom_name || ""} & ${e.bride_name || ""}`.replace(/^ & | & $/g, "").trim()
}

// Event hero photo: stored upload wins, else the invitation cover chain
// (same as the dashboard prefill), else empty for the client default.
// Delegates to the client-safe rule in @/lib/event-photo (single source).
export function galeriPhotoUrl(e: {
  gallery_photo_url?: string | null
  cover_photos?: unknown
  couple_illustration_url?: string | null
}): string {
  return resolveEventPhoto(e)
}

export function galleryTokenFor(): string {
  return generateToken().replace(/^AKS-/, "GAL-")
}

export async function generateUniqueGalleryToken(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const token = galleryTokenFor()
    const { data } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id")
      .eq("gallery_token", token)
      .maybeSingle()
    if (!data) return token
  }
  return `${galleryTokenFor()}-${Date.now().toString(36)}`
}

export async function getGalleryEventByToken(token: string): Promise<GalleryEvent | null> {
  if (!token || token.length > 64) return null
  const { data } = await supabaseAdmin
    .from("wedding_profiles")
    .select("id, package_type, payment_status, gallery_token, gallery_couple_name, gallery_photo_url, gallery_start_at, gallery_end_at, gallery_frame, gallery_camera, bride_name, groom_name, cover_photos, couple_illustration_url, photos_cleared_at")
    .eq("gallery_token", token)
    .maybeSingle()
  return (data as GalleryEvent | null) || null
}

// QR scan window: [start − 1h, end + 1h]. Pure function of timestamps so the
// resolver and the upload path can never disagree.
export function galleryWindowStatus(
  startAt: string | null,
  endAt: string | null,
  nowMs = Date.now()
): "active" | "upcoming" | "ended" | "not_configured" {
  if (!startAt || !endAt) return "not_configured"
  const start = new Date(startAt).getTime()
  const end = new Date(endAt).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return "not_configured"
  if (nowMs < start - 60 * 60 * 1000) return "upcoming"
  if (nowMs > end + 60 * 60 * 1000) return "ended"
  return "active"
}

export function galleryStatusForEvent(event: GalleryEvent | null, nowMs = Date.now()): GalleryStatus {
  if (!event) return "invalid"
  // Ops executed clearance: the gallery window is over regardless of dates.
  if (event.photos_cleared_at) return "cleared"
  if (event.payment_status === "UNPAID") return "locked"
  return galleryWindowStatus(event.gallery_start_at, event.gallery_end_at, nowMs)
}

export type GalleryQuota = { quota: number; cap: number }

// Per-event quota from the slider config; single-package default when a GT
// row has no config yet. The RPC re-checks authoritatively.
// For Buku Tamu Digital, quota is additive: base (2-4 / 200) + add-on tier.
export async function getGalleryQuota(profileId: string, packageType: string): Promise<GalleryQuota> {
  const { data } = await supabaseAdmin
    .from("wedding_profiles")
    .select("galeri_photos_per_guest, galeri_guest_count")
    .eq("id", profileId)
    .maybeSingle()
  const photos = Math.floor(Number((data as { galeri_photos_per_guest?: unknown } | null)?.galeri_photos_per_guest) || 0)
  const guests = Math.floor(Number((data as { galeri_guest_count?: unknown } | null)?.galeri_guest_count) || 0)
  if (packageType.startsWith("dgb_")) {
    const base = DGB_BASE_QUOTA[packageType] || { photos: 2, guests: 200 }
    if (photos > 0 && guests > 0) {
      const totalPhotos = base.photos + photos
      const totalGuests = base.guests + guests
      return { quota: totalPhotos, cap: galeriEventCap(totalPhotos, totalGuests) }
    }
    return { quota: base.photos, cap: galeriEventCap(base.photos, base.guests) }
  }
  if (photos > 0 && guests > 0) {
    return { quota: photos, cap: galeriEventCap(photos, guests) }
  }
  if (packageType === "gt") {
    return { quota: GALLERY_DEFAULT_QUOTA, cap: GALLERY_DEFAULT_CAP }
  }
  return { quota: 0, cap: 0 }
}

export type GaleriConfig = {
  photos_per_guest: number
  guest_count: number
  tier: string
  price: number
  event_cap: number
}

// Full tier matrix from galeri_tiers (cached). Tiers are matched by range,
// so renames, new rows, and reshaped bands propagate with no code changes.
export async function getGaleriTiers(): Promise<GaleriTierRow[]> {
  return cachedRead("galeri-tiers", 10 * 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from("galeri_tiers")
      .select("tier, photo_min, photo_max, guest_min, guest_max, price")
      .order("tier")
    if (error) throw new Error(`Tier galeri tidak terbaca: ${error.message}`)
    return ((data || []) as { tier: string; photo_min: unknown; photo_max: unknown; guest_min: unknown; guest_max: unknown; price: unknown }[]).map((row) => ({
      tier: String(row.tier),
      photoMin: Math.floor(Number(row.photo_min)),
      photoMax: Math.floor(Number(row.photo_max)),
      guestMin: Math.floor(Number(row.guest_min)),
      guestMax: Math.floor(Number(row.guest_max)),
      price: Math.floor(Number(row.price) || 0),
    }))
  })
}

// Resolves slider position -> tier row. Null when no row covers it (caller
// must reject the combination, never fall back to a hardcoded price).
export async function resolveGaleriTier(photos: number, guests: number): Promise<GaleriTierRow | null> {
  return matchGaleriTier(await getGaleriTiers(), photos, guests)
}

// Normalizes a client-supplied slider config into a validated GaleriConfig.
// Bounds AND tier + price resolve from galeri_tiers by range — the matrix is
// the only source of truth (no hardcoded slider limits: anything the matrix
// covers is sellable, anything it doesn't is rejected).
// Returns null when the payload is absent (no add-on); throws otherwise.
export async function normalizeGaleriConfig(input: unknown): Promise<GaleriConfig | null> {
  if (input === null || input === undefined) return null
  if (typeof input !== "object") throw new Error("Konfigurasi galeri tidak valid")
  const raw = input as Record<string, unknown>
  const photos = Math.floor(Number(raw.photos_per_guest))
  const guests = Math.floor(Number(raw.guest_count))
  if (!Number.isFinite(photos) || photos < 1 || !Number.isFinite(guests) || guests < 1) {
    throw new Error("Jumlah foto & tamu harus angka valid")
  }
  const row = await resolveGaleriTier(photos, guests)
  if (!row || row.price <= 0) {
    throw new Error(`Kombinasi ${photos} foto × ${guests} tamu belum tersedia`)
  }
  return { photos_per_guest: photos, guest_count: guests, tier: row.tier, price: row.price, event_cap: galeriEventCap(photos, guests) }
}

export async function countDevicePhotos(profileId: string, deviceId: string): Promise<number> {
  const { count } = await supabaseAdmin
    .from("guest_photos")
    .select("id", { count: "exact", head: true })
    .eq("wedding_profile_id", profileId)
    .eq("device_id", deviceId)
    .neq("source", "selfie")
  return count || 0
}

// "10 Okt 2026" + "15:30" labels in Asia/Jakarta for the guest UI.
const JAKARTA = "Asia/Jakarta"

export function formatGalleryDateWib(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: JAKARTA })
  } catch {
    return ""
  }
}

export function formatGalleryTimeWib(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: JAKARTA }).replace(".", ":")
  } catch {
    return ""
  }
}

// Numeric WIB parts for the mock's "10 • 10 • 2026" stamp.
export function wibDateParts(iso: string | null): { d: string; m: string; y: string } | null {
  if (!iso) return null
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: JAKARTA,
    }).formatToParts(new Date(iso))
    const get = (t: string) => parts.find((p) => p.type === t)?.value || ""
    const d = get("day"), m = get("month"), y = get("year")
    if (!d || !m || !y) return null
    return { d, m, y }
  } catch {
    return null
  }
}
// Build gallery_start_at/end_at (timestamptz) from WIB date + time inputs.
// date: "2026-10-10", time: "15:30". WIB is UTC+7 year-round (no DST).
export function wibToUtcIso(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return null
  if (!/^\d{2}:\d{2}$/.test(time || "")) return null
  const utc = new Date(`${date}T${time}:00+07:00`)
  if (Number.isNaN(utc.getTime())) return null
  return utc.toISOString()
}

export function galleryCameraUrl(token: string): string {
  const base = siteOrigin().replace(/\/+$/, "")
  return `${base}/g/${encodeURIComponent(token)}`
}
