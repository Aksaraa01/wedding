import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveDerivedStatus } from "@/lib/opsStatus"

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("ops_queue")
      .select(`
        id,
        status,
        sla_started_at,
        sla_ended_at,
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
          payment_status,
          express_service,
          created_at,
          users!left (
            created_at
          )
        ),
        employees!left (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const rawQueue = (data || []).map((item: any) => {
      const wp = Array.isArray(item.wedding_profiles)
        ? item.wedding_profiles[0]
        : item.wedding_profiles
      const emp = Array.isArray(item.employees)
        ? item.employees[0]
        : item.employees
      const user = Array.isArray(wp?.users) ? wp.users[0] : wp?.users
      return {
        id: item.id,
        status: item.status,
        sla_started_at: item.sla_started_at,
        sla_ended_at: item.sla_ended_at || null,
        assigned_to: item.assigned_to,
        assigned_name: emp?.name || null,
        created_at: item.created_at,
        registration_date: user?.created_at || wp?.created_at || item.created_at || null,
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
          express_service: wp.express_service,
        },
      }
    })

    // Latest feedback status per profile (for derived board column).
    const profileIds = rawQueue.map((q: any) => q.wedding_profile.id)
    const latestFeedbackByProfile: Record<string, string> = {}
    if (profileIds.length > 0) {
      const { data: fbRows } = await supabaseAdmin
        .from("feedback_submissions")
        .select("wedding_profile_id, status")
        .in("wedding_profile_id", profileIds)
        .order("created_at", { ascending: false })
      for (const row of fbRows || []) {
        if (!latestFeedbackByProfile[row.wedding_profile_id]) {
          latestFeedbackByProfile[row.wedding_profile_id] = row.status
        }
      }
    }

    const queue = rawQueue
      .map((item: any) => ({
        ...item,
        derived_status: resolveDerivedStatus({
          storedStatus: item.status,
          paymentStatus: item.wedding_profile.payment_status,
          latestFeedbackStatus: latestFeedbackByProfile[item.wedding_profile.id] || null,
        }),
      }))
      .sort((a: any, b: any) => {
        const ta = a.registration_date ? new Date(a.registration_date).getTime() : 0
        const tb = b.registration_date ? new Date(b.registration_date).getTime() : 0
        return tb - ta
      })

    const { data: allEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true })

    return NextResponse.json({ queue, employees: allEmployees || [] })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}