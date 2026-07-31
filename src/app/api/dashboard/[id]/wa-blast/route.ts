import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { count: totalGuests } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", id)

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("wa_blast_tier, package_type")
      .eq("id", id)
      .single()

    const { data: schedule } = await supabaseAdmin
      .from("wa_blast_schedules")
      .select("*")
      .eq("wedding_profile_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const { data: vipGuests } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, created_at")
      .eq("wedding_profile_id", id)
      .eq("is_vip", true)
      .order("created_at", { ascending: true })

    return NextResponse.json({
      total_guests: totalGuests || 0,
      wa_blast_tier: profile?.wa_blast_tier || 0,
      package_type: profile?.package_type || "signature",
      schedule: schedule || null,
      vip_guests: vipGuests || [],
      vip_count: vipGuests?.length || 0,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const { data: existing } = await supabaseAdmin
      .from("wa_blast_schedules")
      .select("id")
      .eq("wedding_profile_id", id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (existing && existing.length > 0) {
      const { error } = await supabaseAdmin
        .from("wa_blast_schedules")
        .update({
          template_type: body.template_type,
          message_text: body.message_text,
          scheduled_date: body.scheduled_date,
          scheduled_time: body.scheduled_time,
          total_guests: body.total_guests,
          status: "scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id)

      if (error) throw error
      return NextResponse.json({ success: true, id: existing[0].id })
    }

    const { data, error } = await supabaseAdmin
      .from("wa_blast_schedules")
      .insert({
        wedding_profile_id: id,
        template_type: body.template_type,
        message_text: body.message_text,
        scheduled_date: body.scheduled_date,
        scheduled_time: body.scheduled_time,
        total_guests: body.total_guests,
        status: "scheduled",
      })
      .select("id")
      .single()

    if (error) throw error
    return NextResponse.json({ success: true, id: data.id })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
