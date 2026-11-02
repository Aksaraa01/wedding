import { createHash } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase"
import { parseStringList } from "@/lib/invitationCompleteness"
import { toTransformedUrl } from "@/lib/storageUrl"

// NOTE: sharp is imported LAZILY inside ensureOgImage (never top-level).
// sharp ships platform-native binaries; a top-level import crashes the whole
// route module on any platform whose binding wasn't traced into the build
// (this took down GET+PUT web-invitation on the Linux VPS). Lazy import keeps
// reads working everywhere; generation failures fall back gracefully.

// Dedicated sub-300KB JPEG social thumbnails (og:image). One variant per
// distinct cover URL, stored at a deterministic path so regeneration is
// idempotent and concurrent generations converge. Server-only (sharp).

const BUCKET = "media"
const OG_PREFIX = "template-media/og"
const OG_MAX_WIDTH = 1200
const OG_QUALITY_STEPS = [70, 60, 50]
const OG_MAX_BYTES = 300 * 1024

export type OgVariant = {
  url: string
  width: number
  height: number
}

function ogPathFor(coverUrl: string): string {
  const h = createHash("sha256").update(coverUrl).digest("hex").slice(0, 32)
  // v4 = original aspect, proportional resize only (no canvas, no crop).
  // New path so cropped v2/v3 files stop being referenced + caches bust.
  return `${OG_PREFIX}/v4-${h}.jpg`
}

export function ogPublicUrlFor(coverUrl: string): string | null {
  if (!coverUrl || !/^https?:\/\//i.test(coverUrl)) return null
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(ogPathFor(coverUrl))
  return data.publicUrl
}

// Same priority as the guest metadata: an explicitly uploaded link thumbnail
// wins, then the illustration, then covers. `link_thumbnail_disabled` is the
// explicit "tanpa foto thumbnail" opt-out: no personal photo at all, so the
// share card uses the generic default.
// Shared by the PUT hook and generateMetadata so they can never diverge.
export function resolveCoverImage(input: {
  link_thumbnail_url?: unknown
  link_thumbnail_disabled?: unknown
  has_cover_slots?: boolean
  couple_illustration_url: unknown
  cover_photos: unknown
}): string | undefined {
  const first = (v: unknown): string | undefined => {
    if (typeof v === "string" && v.trim() && /^https?:\/\//i.test(v.trim())) return v.trim()
    if (Array.isArray(v)) {
      for (const item of v) {
        const r = first(item)
        if (r) return r
      }
    }
    return undefined
  }
  const cover = first(parseStringList(input.cover_photos))
  if (input.has_cover_slots !== false && cover) return first(input.couple_illustration_url) || cover
  if (input.link_thumbnail_disabled === true) return undefined
  return first(input.link_thumbnail_url) || (input.has_cover_slots === false ? undefined : first(input.couple_illustration_url)) || undefined
}

function smallerInputFor(coverUrl: string): string {
  // Save egress by reading the pre-generated 1200w thumbnail when the source
  // is ours. Aspect ratio is preserved by sharp at generation time (no crop,
  // no bars), so faces are never cut. non-Supabase URLs pass through.
  return toTransformedUrl(coverUrl, { width: 1200, resize: "contain" })
}

// Returns the public og variant (URL + measured dimensions), or null when
// generation is impossible / over budget (callers fall back to the normal
// cover chain and omit width/height so no client ever scales from wrong dims).
export async function ensureOgImage(coverUrl: string): Promise<OgVariant | null> {
  if (!coverUrl || !/^https?:\/\//i.test(coverUrl)) return null
  try {
    const path = ogPathFor(coverUrl)
    const dir = path.split("/").slice(0, -1).join("/")
    const name = path.split("/").pop() || ""
    const { data: listed } = await supabaseAdmin.storage.from(BUCKET).list(dir, { search: name, limit: 10 })
    if (!(listed || []).some(o => o.name === name)) {
      const transformed = smallerInputFor(coverUrl)
      let res = await fetch(transformed)
      // Tenants without the transform add-on answer 403 (FeatureNotEnabled) —
      // fall back to the original bytes instead of giving up.
      if (!res.ok && transformed !== coverUrl) res = await fetch(coverUrl)
      if (!res.ok) return null
      const buf = Buffer.from(await res.arrayBuffer())
      if (!buf.length) return null
      const { default: sharp } = await import("sharp")
      // Original aspect, proportional resize only (max 1200w, never upscaled):
      // the full photo is preserved — no crop, no bars, no shrink-to-fit.
      // withoutEnlargement keeps small photos byte-identical in dimensions.
      const convert = (quality: number) =>
        sharp(buf)
          .rotate()
          .resize({ width: OG_MAX_WIDTH, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
      let out: Buffer | null = null
      for (const q of OG_QUALITY_STEPS) {
        const attempt = await convert(q)
        out = attempt
        if (attempt.length <= OG_MAX_BYTES) break
      }
      if (!out || out.length > OG_MAX_BYTES || out.length === 0) return null
      // supabase-js rejects raw Buffers in some runtimes (SharedArrayBuffer
      // check) — upload as Blob instead.
      const body = new Blob([new Uint8Array(out)], { type: "image/jpeg" })
      const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, body, {
        upsert: false,
        contentType: "image/jpeg",
        cacheControl: "31536000",
      })
      if (error) {
        // Lost a race with a concurrent generation for the same cover.
        const { data: relist } = await supabaseAdmin.storage.from(BUCKET).list(dir, { search: name, limit: 10 })
        if (!(relist || []).some(o => o.name === name)) return null
      }
    }
    // Measure the stored file so meta reports true dimensions (never a
    // declared box the file doesn't fill — that mismatch renders zoomed-out).
    const publicUrl = ogPublicUrlFor(coverUrl)
    if (!publicUrl) return null
    const fileRes = await fetch(publicUrl)
    if (!fileRes.ok) return null
    const fileBuf = Buffer.from(await fileRes.arrayBuffer())
    if (!fileBuf.length) return null
    const { default: sharpMeta } = await import("sharp")
    const meta = await sharpMeta(fileBuf).metadata()
    if (!meta.width || !meta.height) return null
    return { url: publicUrl, width: meta.width, height: meta.height }
  } catch (err) {
    console.warn("[og] ensureOgImage failed:", err instanceof Error ? err.message : String(err))
    return null
  }
}
