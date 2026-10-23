// Guest-facing event-photo rule, shared by client surfaces (QR pass, welcome,
// print cards). Precedence mirrors galeriPhotoUrl() in @/lib/gallery — but that
// module is server-only (imports supabaseAdmin) and must never leak into client
// components, so the pure logic lives here and gallery.ts re-exports it.
//
// Precedence: the "Detail Acara" upload in /galeri-kenangan
// (wedding_profiles.gallery_photo_url) wins, else the invitation cover chain,
// else the illustration, else "" (caller supplies its own default).

export type EventPhotoInput = {
  gallery_photo_url?: string | null
  cover_photos?: unknown
  couple_illustration_url?: string | null
}

function firstCoverUrl(input: unknown): string {
  if (typeof input === "string") return input.trim()
  if (Array.isArray(input)) {
    for (const v of input) {
      const found = firstCoverUrl(v)
      if (found) return found
    }
  }
  return ""
}

export function resolveEventPhoto(e: EventPhotoInput): string {
  const stored = (e.gallery_photo_url || "").trim()
  if (stored) return stored
  const fromCovers = firstCoverUrl(e.cover_photos)
  if (fromCovers.startsWith("http")) return fromCovers
  const ill = (e.couple_illustration_url || "").trim()
  return ill.startsWith("http") ? ill : ""
}
