import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

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

    const updates: Record<string, string | number | null> = {
      rsvp_status,
      rsvp_responded_at: new Date().toISOString(),
    }

    if (rsvp_status === "HADIR") {
      const pax = Number(rsvp_pax_count)
      updates.rsvp_pax_count = Number.isFinite(pax) && pax > 0 ? pax : 1
      updates.rsvp_message = typeof rsvp_message === "string" && rsvp_message.trim() ? rsvp_message.trim() : null
    } else {
      updates.rsvp_pax_count = null
      updates.rsvp_message = null
    }

    const { data, error } = await supabaseAdmin
      .from("guests")
      .update(updates)
      .eq("id", id)
      .select("id, name, rsvp_status, rsvp_pax_count, rsvp_message, rsvp_responded_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guest: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
