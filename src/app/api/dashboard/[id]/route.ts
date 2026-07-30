import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { deriveSelections } from "@/lib/packages"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .select("*")
      .eq("id", id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Wedding profile not found" }, { status: 404 })
    }

    const selections = deriveSelections(
      profile.package_type || "signature",
      !!profile.undangan_fisik
    )

    const { count: guestCount, error: guestError } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)

    if (guestError) {
      return NextResponse.json({ error: guestError.message }, { status: 500 })
    }

    const { data: tables } = await supabaseAdmin
      .from("guests")
      .select("table_number")
      .eq("wedding_profile_id", id)
      .not("table_number", "is", null)
      .neq("table_number", "")

    const tableCount = tables
      ? new Set(tables.map(t => t.table_number?.toLowerCase().trim()).filter(Boolean)).size
      : 0

    const { data: checkedInData } = await supabaseAdmin
      .from("guests")
      .select("id, guest_count")
      .eq("wedding_profile_id", id)
      .eq("is_checked_in", true)

    const checkedInGuests = checkedInData || []
    const checkedInCount = checkedInGuests.length
    const checkedInPax = checkedInGuests.reduce((sum, g) => sum + (g.guest_count || 1), 0)

    const { data: rsvpData } = await supabaseAdmin
      .from("guests")
      .select("id, guest_count, rsvp_status, rsvp_pax_count")
      .eq("wedding_profile_id", id)

    const rsvpEntries = rsvpData || []
    const rsvpHadirCount = rsvpEntries.filter(g => g.rsvp_status === "HADIR").length
    const rsvpHadirPax = rsvpEntries.filter(g => g.rsvp_status === "HADIR").reduce((sum, g) => sum + (g.rsvp_pax_count || g.guest_count || 1), 0)
    const rsvpTotalPax = rsvpEntries.reduce((sum, g) => sum + (g.guest_count || 1), 0)

    const { count: pendingWishes, error: pendingError } = await supabaseAdmin
      .from("wishes")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)
      .eq("status", "pending")

    if (pendingError) {
      console.error("pending wishes count error:", pendingError)
    }

    const { count: totalWishes, error: totalError } = await supabaseAdmin
      .from("wishes")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)

    if (totalError) {
      console.error("total wishes count error:", totalError)
    }

    return NextResponse.json({
      profile,
      selections,
      guest_count: guestCount || 0,
      table_count: tableCount,
      pending_wishes: pendingWishes || 0,
      total_wishes: totalWishes || 0,
      checked_in_count: checkedInCount,
      checked_in_pax: checkedInPax,
      rsvp_hadir_count: rsvpHadirCount,
      rsvp_hadir_pax: rsvpHadirPax,
      rsvp_total_pax: rsvpTotalPax,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
