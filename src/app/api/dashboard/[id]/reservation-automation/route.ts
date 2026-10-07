import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: guests, error } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, category, table_number, guest_count, rsvp_status, rsvp_pax_count, rsvp_message, rsvp_responded_at, is_checked_in, invitation_opened_at, is_vip")
      .eq("wedding_profile_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: wishes } = await supabaseAdmin
      .from("wishes")
      .select("guest_id, message")
      .eq("wedding_profile_id", id)
      .not("guest_id", "is", null)

    const wishByGuestId: Record<string, string> = {}
    if (wishes) {
      for (const w of wishes) {
        if (w.guest_id && !wishByGuestId[w.guest_id]) {
          wishByGuestId[w.guest_id] = w.message
        }
      }
    }

    const total = guests?.length || 0
    const hadir = guests?.filter(g => g.rsvp_status === "HADIR").length || 0
    const tidakHadir = guests?.filter(g => g.rsvp_status === "TIDAK_HADIR").length || 0
    const dibuka = guests?.filter(g => g.invitation_opened_at).length || 0
    const belumDibuka = Math.max(0, total - dibuka)

    return NextResponse.json({
      guests,
      wish_by_guest_id: wishByGuestId,
      stats: {
        total,
        hadir,
        tidak_hadir: tidakHadir,
        dibuka,
        belum_dibuka: belumDibuka,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
