import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import {
  autoGenerateGuestLinks,
  findGuestForTo,
  isFallbackGuestSlug,
  isValidGuestSlug,
  normalizeGuestSlug,
  prettifyGuestSlug,
} from "@/lib/guest-link"
import { markInvitationOpened } from "@/lib/recordInvitationOpen"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

const ALLOWED = new Set(["HADIR", "TIDAK_HADIR"])

const GUEST_FIELDS = "id, name, slug, table_number, qr_token, rsvp_status, rsvp_pax_count, rsvp_message, rsvp_responded_at"

// Display name for a row created from a hand-typed ?to=: keep the guest's own
// wording ("Budi & Ani") when it is a name, but render a slug-shaped value
// ("Budi-&-Ani") as readable text. Strips markup/control characters, caps length.
function toDisplayName(raw: string, fallbackSlug: string): string {
  const cleaned = (raw || "")
    .normalize("NFC")
    .replace(/[<>\u0000-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim()
    .slice(0, 80)
  if (cleaned && isValidGuestSlug(cleaned)) return prettifyGuestSlug(cleaned)
  return cleaned || prettifyGuestSlug(fallbackSlug) || "Tamu Undangan"
}

// Fleksibel-mode RSVP: resolves the inputted slug to an existing guest, or
// provisions a visible "Fleksibel"-category row on first submit so RSVP,
// wishes, check-in, and souvenir all have a record to attach to.
// Strict couples (guest_link_strict !== false) are rejected — their links 404.
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wedding_profile_id, slug, raw_slug, display_name, rsvp_status, rsvp_pax_count, rsvp_message } = body

    if (typeof wedding_profile_id !== "string" || !wedding_profile_id) {
      return NextResponse.json({ error: "Profil tidak valid" }, { status: 400 })
    }

    // ?to= may be a slug ("Budi-Santoso") or a hand-typed display name
    // ("Budi / Ani"); both normalize to the same slug so the row and every
    // later link agree.
    const raw = typeof slug === "string" ? slug : ""
    const normalized = normalizeGuestSlug(raw)

    if (!isValidGuestSlug(normalized)) {
      return NextResponse.json({ error: "Nama tamu tidak valid" }, { status: 400 })
    }
    // The generic fallback identity is display-only and can never RSVP into a row.
    if (isFallbackGuestSlug(raw) || isFallbackGuestSlug(normalized)) {
      return NextResponse.json({ error: "Tautan umum tidak dapat digunakan untuk RSVP. Gunakan tautan undangan dengan nama Anda." }, { status: 403 })
    }
    if (typeof rsvp_status !== "string" || !ALLOWED.has(rsvp_status)) {
      return NextResponse.json({ error: "Kehadiran tidak valid" }, { status: 400 })
    }

    const rl = checkRateLimit(`flexrsvp:${getClientIp(req)}:${wedding_profile_id}:${normalized}`, 10, 60_000)
    if (!rl.ok) return rateLimited(rl.retryAfterMs!)

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id, guest_link_strict, rsvp_max_pax")
      .eq("id", wedding_profile_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profil tidak ditemukan" }, { status: 404 })
    }
    if (profile.guest_link_strict !== false) {
      return NextResponse.json({ error: "Tautan undangan tidak valid" }, { status: 403 })
    }

    const maxPax = profile.rsvp_max_pax != null ? profile.rsvp_max_pax : 2

    // Resolve exactly like the invitation page: raw value first (legacy slugs
    // such as "Ibu--Grace-…" are not slugify fixed points), then normalized.
    const lookupValue = typeof raw_slug === "string" && raw_slug.trim() ? raw_slug : normalized
    const found = await findGuestForTo<{ id: string }>(wedding_profile_id, lookupValue, "id")
    let guestId: string | null = found.guest?.id ?? null

    if (!guestId) {
      const name = toDisplayName(
        typeof display_name === "string" ? display_name : "",
        normalized
      )
      const { data: created, error: createError } = await supabaseAdmin
        .from("guests")
        .insert({
          wedding_profile_id,
          name,
          slug: normalized,
          category: "Fleksibel",
          added_manually: false,
        })
        .select("id")
        .single()
      if (createError || !created) {
        // Lost a race with a concurrent submit — reuse the winner's row.
        const retry = await supabaseAdmin
          .from("guests")
          .select("id")
          .eq("wedding_profile_id", wedding_profile_id)
          .ilike("slug", normalized)
          .maybeSingle()
        if (!retry.data) {
          return NextResponse.json({ error: createError?.message || "Gagal menyimpan" }, { status: 500 })
        }
        guestId = retry.data.id
      } else {
        guestId = created.id
        await autoGenerateGuestLinks(wedding_profile_id, [{ id: created.id, name, slug: normalized }])
      }
    }

    const updates: Record<string, string | number | null> = {
      rsvp_status,
      rsvp_responded_at: new Date().toISOString(),
    }
    if (rsvp_status === "HADIR") {
      const pax = Number(rsvp_pax_count)
      const paxRaw = Number.isFinite(pax) && pax > 0 ? pax : 1
      updates.rsvp_pax_count = Math.max(1, Math.min(maxPax, paxRaw))
    } else {
      updates.rsvp_pax_count = null
    }
    updates.rsvp_message = typeof rsvp_message === "string" && rsvp_message.trim() ? rsvp_message.trim().slice(0, 500) : null

    const { data: guest, error: updateError } = await supabaseAdmin
      .from("guests")
      .update(updates)
      .eq("id", guestId)
      .select(GUEST_FIELDS)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Submitting the RSVP form proves the guest opened the invitation
    // (flexible links render for any name, so w/[slug] tracking may never
    // have resolved them). First-touch only, never throws.
    if (guestId) await markInvitationOpened(guestId)

    return NextResponse.json({ guest })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
