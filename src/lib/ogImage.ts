import { createHash } from "node:crypto"
import { supabaseAdmin } from "@/lib/supabase"
import { parseStringList } from "@/lib/invitationCompleteness"

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
const OG_WIDTH = 1200
const OG_HEIGHT = 630
const OG_QUALITY_STEPS = [65, 55, 45]
const OG_MAX_BYTES = 300 * 1024

function ogPathFor(coverUrl: string): string {
  const h = createHash("sha256").update(coverUrl).digest("hex").slice(0, 32)
  // v3 = 1200x630 cover-fill at natural scale (no shrink, no blur bars).
  // New path so v2 fit-mode files stop being referenced + caches bust.
  return `${OG_PREFIX}/v3-${h}.jpg`
}

export function ogPublicUrlFor(coverUrl: string): string | null {
  if (!coverUrl || !/^https?:\/\//i.test(coverUrl)) return null
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(ogPathFor(coverUrl))
  return data.publicUrl
}

// Same priority as the guest metadata: illustration first, then covers.
// Shared by the PUT hook and generateMetadata so they can never diverge.
export function resolveCoverImage(input: {
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
  return first(input.couple_illustration_url) || first(parseStringList(input.cover_photos))
}

function smallerInputFor(coverUrl: string): string {
  // Save egress: convert from a smaller CDN transform when the source is ours.
  // MUST use resize=contain (aspect-preserving): resize=cover without a
  // height distorts portraits (800x4160 from 2773x4160), which then throws
  // off the attention crop and yields cut faces.
  if (coverUrl.includes("supabase.co/storage/v1/object/public/media/")) {
    const clean = coverUrl.split("?")[0]
    return `${clean.replace("/object/public/", "/render/image/public/")}?width=1200&resize=contain`
  }
  return coverUrl
}

// Returns the public og variant URL, or null when generation is impossible /
// over budget (callers fall back to the normal cover chain).
export async function ensureOgImage(coverUrl: string): Promise<string | null> {
  if (!coverUrl || !/^https?:\/\//i.test(coverUrl)) return null
  try {
    const path = ogPathFor(coverUrl)
    const dir = path.split("/").slice(0, -1).join("/")
    const name = path.split("/").pop() || ""
    const { data: listed } = await supabaseAdmin.storage.from(BUCKET).list(dir, { search: name, limit: 10 })
    if ((listed || []).some(o => o.name === name)) {
      return ogPublicUrlFor(coverUrl)
    }
    const transformed = smallerInputFor(coverUrl)
    let res = await fetch(transformed)
    // Tenants without the transform add-on answer 403 (FeatureNotEnabled) —
    // fall back to the original bytes instead of giving up.
    if (!res.ok && transformed !== coverUrl) res = await fetch(coverUrl)
    if (!res.ok) return null
    const buf = Buffer.from(await res.arrayBuffer())
    if (!buf.length) return null
    const { default: sharp } = await import("sharp")
    // Social card follows the template-list preview rule (fill the frame at
    // natural scale, never shrunk) with smart positioning: `attention` keeps
    // faces in frame for arbitrary couple photos (a fixed top anchor crops
    // empty wall when the subject sits low in frame — verified against real
    // covers). Falls back to centre when attention analysis fails.
    // WhatsApp then shows a full-bleed preview instead of a zoomed-out
    // thumbnail.
    const convert = async (quality: number) => {
      try {
        return await sharp(buf)
          .rotate()
          .resize({ width: OG_WIDTH, height: OG_HEIGHT, fit: "cover", position: "attention" })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
      } catch {
        return await sharp(buf)
          .rotate()
          .resize({ width: OG_WIDTH, height: OG_HEIGHT, fit: "cover", position: "centre" })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer()
      }
    }
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
      if ((relist || []).some(o => o.name === name)) return ogPublicUrlFor(coverUrl)
      return null
    }
    return ogPublicUrlFor(coverUrl)
  } catch (err) {
    console.warn("[og] ensureOgImage failed:", err instanceof Error ? err.message : String(err))
    return null
  }
}
