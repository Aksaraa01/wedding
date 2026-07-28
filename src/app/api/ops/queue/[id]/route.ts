import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data: queueItem, error: queueError } = await supabaseAdmin
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
      .eq("id", id)
      .single()

    if (queueError) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles

    const { data: featureActions } = await supabaseAdmin
      .from("feature_actions")
      .select("*")
      .eq("ops_queue_id", id)
      .order("created_at", { ascending: true })

    const { data: allEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true })

    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("id, name, qr_token")
      .eq("wedding_profile_id", wp.id)

    const totalGuests = guests?.length || 0
    const withToken = guests?.filter((g) => g.qr_token).length || 0

    return NextResponse.json({
      queue: {
        id: queueItem.id,
        status: queueItem.status,
        sla_started_at: queueItem.sla_started_at,
        assigned_to: queueItem.assigned_to,
        assigned_name: Array.isArray(queueItem.employees)
          ? queueItem.employees[0]?.name || null
          : (queueItem.employees as any)?.name || null,
        created_at: queueItem.created_at,
      },
      wedding_profile: {
        id: wp.id,
        bride_name: wp.bride_name,
        groom_name: wp.groom_name,
        slug: wp.slug,
        whatsapp_number: wp.whatsapp_number,
        estimated_wedding_date: wp.estimated_wedding_date,
        estimated_guest_count: wp.estimated_guest_count,
        package_type: wp.package_type,
        total_project_cost: wp.total_project_cost,
        payment_status: wp.payment_status,
      },
      feature_actions: featureActions || [],
      employees: allEmployees || [],
      guest_stats: { total: totalGuests, with_token: withToken },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
