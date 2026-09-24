import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { markInvitationOpened } from "@/lib/recordInvitationOpen"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

const ALLOWED = new Set(["HADIR", "TIDAK_HADIR"])

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { rsvp_status, rsvp_pax_count, rsvp_message } = body

    if (typeof rsvp_status !== "string" || !ALLOWED.has(rsvp_status)) {
      return NextResponse.json({ error: "Kehadiran tidak valid" }, { status: 400 })
    }

    const rl = checkRateLimit(`rsvp:${getClientIp(req)}:${id}`, 10, 60_000)
    if (!rl.ok) return rateLimited(rl.retryAfterMs!)

    let maxPax = 2
    const { data: guestRow } = await supabaseAdmin
      .from("guests")
      .select("wedding_profile_id")
      .eq("id", id)
      .single()

    if (guestRow?.wedding_profile_id) {
      const { data: profileRow } = await supabaseAdmin
        .from("wedding_profiles")
        .select("rsvp_max_pax")
        .eq("id", guestRow.wedding_profile_id)
        .single()
      if (profileRow?.rsvp_max_pax != null) maxPax = profileRow.rsvp_max_pax
    }

    const updates: Record<string, string | number | null> = {
      rsvp_status,
      rsvp_responded_at: new Date().toISOString(),
    }

    if (rsvp_status === "HADIR") {
      const pax = Number(rsvp_pax_count)
      const raw = Number.isFinite(pax) && pax > 0 ? pax : 1
      updates.rsvp_pax_count = Math.max(1, Math.min(maxPax, raw))
    } else {
      updates.rsvp_pax_count = null
    }

    // Store the guest's message for both HADIR and TIDAK_HADIR responses.
    updates.rsvp_message = typeof rsvp_message === "string" && rsvp_message.trim() ? rsvp_message.trim() : null

    const { data, error } = await supabaseAdmin
      .from("guests")
      .update(updates)
      .eq("id", id)
      .select("id, name, rsvp_status, rsvp_pax_count, rsvp_message, rsvp_responded_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // RSVP form submit proves the guest opened the invitation. First-touch
    // only, never throws.
    await markInvitationOpened(id)

    return NextResponse.json({ guest: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
