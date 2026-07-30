import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ops_queue")
      .select(`
        id,
        status,
        sla_started_at,
        assigned_to,
        created_at,
        wedding_profiles!inner (
          id,
          bride_name,
          groom_name,
          slug,
          whatsapp_number,
          estimated_wedding_date,
          sessions,
          estimated_guest_count,
          package_type,
          total_project_cost,
          payment_status
        ),
        employees!left (
          id,
          name
        )
      `)
      .order("sla_started_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const queue = (data || []).map((item: any) => {
      const wp = Array.isArray(item.wedding_profiles)
        ? item.wedding_profiles[0]
        : item.wedding_profiles
      const emp = Array.isArray(item.employees)
        ? item.employees[0]
        : item.employees
      return {
        id: item.id,
        status: item.status,
        sla_started_at: item.sla_started_at,
        assigned_to: item.assigned_to,
        assigned_name: emp?.name || null,
        created_at: item.created_at,
        wedding_profile: {
          id: wp.id,
          bride_name: wp.bride_name,
          groom_name: wp.groom_name,
          slug: wp.slug,
          whatsapp_number: wp.whatsapp_number,
          estimated_wedding_date: wp.estimated_wedding_date,
          sessions: wp.sessions,
          estimated_guest_count: wp.estimated_guest_count,
          package_type: wp.package_type,
          total_project_cost: wp.total_project_cost,
          payment_status: wp.payment_status,
        },
      }
    })

    return NextResponse.json({ queue })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
