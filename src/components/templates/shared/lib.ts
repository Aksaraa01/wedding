// Shared pure helpers for in-house templates (Skyline Penthouse, Pixel Paradise,
// …). Kept free of React/hooks so any template can import from one place.

export type SessionData = {
  name?: string
  date?: string
  time?: string
  venue?: string
  address?: string
  maps_url?: string
}

export type StoryData = {
  title?: string
  description?: string
  image_url?: string
}

export type GiftAccountData = {
  provider_name?: string
  account_number?: string
  account_name?: string
  type?: string
}

const pad = (n: number) => String(n).padStart(2, "0")

// "2026-07-20" (or anything parseable) → "20.07.2026"
export function formatDotDate(value?: string | null): string {
  const d = value ? new Date(value) : null
  if (!d || isNaN(d.getTime())) return ""
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`
}

const ID_DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const ID_MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

// → "Rabu, 20 Juli 2026" (Indonesian long date)
export function formatLongDate(value?: string | null): string {
  const d = value ? new Date(value) : null
  if (!d || isNaN(d.getTime())) return ""
  return `${ID_DAYS[d.getDay()]}, ${d.getDate()} ${ID_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function initialsOf(...names: Array<string | undefined>): string {
  const letters = names
    .filter((n) => n && n.trim())
    .map((n) => n!.trim()[0])
    .filter(Boolean)
  return letters.slice(0, 2).join("").toUpperCase()
}

// First image URL from a value that may be a URL string, an array, or a nested
// slideshow array — used so cover/story photos always render.
export function firstImage(v: unknown): string {
  if (typeof v === "string") {
    const t = v.trim()
    if (!t) return ""
    if (/^https?:\/\//i.test(t) || /^\//.test(t)) return t
    try {
      return firstImage(JSON.parse(t) as unknown)
    } catch {
      return ""
    }
  }
  if (Array.isArray(v)) {
    for (const item of v) {
      const r = firstImage(item)
      if (r) return r
    }
  }
  return ""
}

// Parse leading HH:MM out of free-text time ("08:00 – 10:00 WIB" → 08:00).
function parseStartHour(raw?: string): number {
  const t = (raw || "").trim()
  const m = t.match(/(\d{1,2})\s*[:.]\s*(\d{2})/)
  if (m) {
    const h = parseInt(m[1], 10)
    return h >= 0 && h <= 23 ? h : 0
  }
  return 0
}

// Countdown target: prefer the main event (estimated_wedding_date) at 00:00 to
// match the WP countdown convention; falls back to the first session's date.
export function countdownTarget(sessions?: SessionData[], estimated?: string | null): Date | null {
  const raw: string[] = []
  const est = String(estimated || "").trim()
  if (est) raw.push(est)
  ;(sessions || []).forEach((s) => {
    const d = s?.date ? String(s.date).trim() : ""
    if (d) raw.push(d)
  })

  const parse = (v: string): Date | null => {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/)
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4] || 0), Number(m[5] || 0))
      return isNaN(d.getTime()) ? null : d
    }
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }

  const dates = raw.map(parse).filter((d): d is Date => d !== null)
  if (dates.length === 0) return null

  // Prefer the nearest upcoming date (so whichever date the couple sets — the
  // event date or a session — drives the countdown); fall back to the latest.
  const now = Date.now()
  const upcoming = dates.filter((d) => d.getTime() > now).sort((a, b) => a.getTime() - b.getTime())
  if (upcoming.length > 0) return upcoming[0]
  return dates.sort((a, b) => b.getTime() - a.getTime())[0]
}

// Google Calendar link for the first session (mirrors buildProfileFields).
export function gcalLink(
  session: SessionData | undefined,
  groom?: string,
  bride?: string
): string {
  if (!session || !session.date) return ""
  const iso = String(session.date).trim()
  const dm = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!dm) return ""
  const [, yyyy, mm, dd] = dm
  const titleCore = [groom, bride].filter(Boolean).join(" & ") || "Mempelai"
  const h = parseStartHour(session.time)
  const endH = h + 2 >= 24 ? (h + 2) % 24 : h + 2
  const endDay = h + 2 >= 24 ? String(Number(dd) + 1).padStart(2, "0") : dd
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `The Wedding OF ${titleCore}`,
    dates: `${yyyy}${mm}${dd}T${pad(h)}0000/${yyyy}${mm}${endDay}T${pad(endH)}0000`,
    ctz: "Asia/Jakarta",
  })
  const location = [session.venue, session.address].filter(Boolean).join(", ")
  if (location) params.set("location", location)
  if (session.name) params.set("details", session.name)
  return `https://www.google.com/calendar/render?${params.toString()}`
}

export function photoList(v: string | string[] | null | undefined): string[] {
  if (Array.isArray(v)) return v.filter(Boolean)
  if (typeof v === "string" && v.trim()) {
    try {
      const p = JSON.parse(v)
      return Array.isArray(p) ? p.filter(Boolean) : [v]
    } catch {
      return [v]
    }
  }
  return []
}

const DEFAULT_COVER = "/defaults/couple.png"
const DEFAULT_GROOM = "/defaults/groom.png"
const DEFAULT_BRIDE = "/defaults/bride.png"

// Default couple/bride/groom photos shown when the couple has not uploaded
// their own. Centralized here so every in-house template falls back to the
// same defaults instead of template/dummy imagery.
export function coverPhoto(v: { cover_photos?: unknown; couple_illustration_url?: unknown }): string {
  const slot0 = Array.isArray(v.cover_photos) ? v.cover_photos[0] : v.cover_photos
  return firstImage(slot0) || firstImage(v.couple_illustration_url) || DEFAULT_COVER
}

export function groomPhoto(v: string | string[] | null | undefined): string {
  return photoList(v)[0] || DEFAULT_GROOM
}

export function bridePhoto(v: string | string[] | null | undefined): string {
  return photoList(v)[0] || DEFAULT_BRIDE
}

// Convert watch links to embeddable URLs so an <iframe> can play them.
export function normalizeVideoUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return ""
  const t = url.trim()
  try {
    const u = new URL(t)
    if (u.hostname.includes("youtube.com") && u.searchParams.has("v")) {
      const id = u.searchParams.get("v")?.split("&")[0]?.split("?")[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0]?.split("?")[0]
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return `https://www.youtube.com/embed/${id}`
    }
    return /^https?:|^\/\//i.test(t) ? t : ""
  } catch {
    return /^https?:|^\/\//i.test(t) ? t : ""
  }
}

// Relative time (id-ID), e.g. "2m lalu".
export function timeAgo(iso?: string): string {
  if (!iso) return ""
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Baru Saja"
  if (mins < 60) return `${mins} Menit Lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} Jam Lalu`
  return `${Math.floor(hours / 24)} Hari Lalu`
}

export function flattenPhotos(value: unknown): string[] {
  if (typeof value === "string") {
    const s = value.trim()
    if (!s) return []
    if (s.startsWith("[")) {
      try {
        return flattenPhotos(JSON.parse(s))
      } catch {
        return [s]
      }
    }
    return [s]
  }
  if (Array.isArray(value)) return value.flatMap(flattenPhotos)
  return []
}