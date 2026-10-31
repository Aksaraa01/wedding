import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireProfileAccess } from "@/lib/requireProfileAccess"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await requireProfileAccess(req, id)
    if (auth) return auth

    const { count: total, error: countErr } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)

    if (countErr) {
      return NextResponse.json({ error: countErr.message }, { status: 500 })
    }

    const { count: checkedIn, error: checkErr } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)
      .eq("is_checked_in", true)

    if (checkErr) {
      return NextResponse.json({ error: checkErr.message }, { status: 500 })
    }

    const { count: checkedInManual, error: manualErr } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)
      .eq("is_checked_in", true)
      .eq("added_manually", true)

    if (manualErr) {
      return NextResponse.json({ error: manualErr.message }, { status: 500 })
    }

    const { data: recentCheckins, error: recentErr } = await supabaseAdmin
      .from("guests")
      .select("id, name, table_number, checkin_timestamp, souvenir_claimed, is_checked_in, added_manually")
      .eq("wedding_profile_id", id)
      .eq("is_checked_in", true)
      .not("checkin_timestamp", "is", null)
      .order("checkin_timestamp", { ascending: false })
      .limit(20)

    if (recentErr) {
      return NextResponse.json({ error: recentErr.message }, { status: 500 })
    }

    const totalNum = total || 0
    const checkedNum = checkedIn || 0
    const checkedManualNum = checkedInManual || 0

    return NextResponse.json({
      total: totalNum,
      checked_in: checkedNum,
      checked_in_manual: checkedManualNum,
      percentage: totalNum > 0 ? Math.round((checkedNum / totalNum) * 100) : 0,
      recent_checkins: recentCheckins || [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
