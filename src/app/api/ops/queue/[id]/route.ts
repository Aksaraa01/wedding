import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { resolveDerivedStatus } from "@/lib/opsStatus"
import { hasVipQuotaBase } from "@/lib/packages"
import { getFeatureIncluded } from "@/lib/featureGates"

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
        sla_ended_at,
        assigned_to,
        created_at,
        wedding_profiles!inner (
          id,
          bride_name,
          groom_name,
          display_name,
          slug,
          whatsapp_number,
          estimated_wedding_date,
          sessions,
          estimated_guest_count,
          package_type,
          total_project_cost,
          voucher_code,
          voucher_discount,
          payment_status,
          express_service,
          wa_blast_tier,
          undangan_fisik,
          message_category
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

    const { data: salesEmployees } = await supabaseAdmin
      .from("employees")
      .select("id, name")
      .eq("is_active", true)
      .eq("role", "sales")
      .order("name", { ascending: true })

    const allEmployees = salesEmployees || []

    const { data: guests } = await supabaseAdmin
      .from("guests")
      .select("id, name, qr_token, rsvp_status, invitation_opened_at")
      .eq("wedding_profile_id", wp.id)

    const totalGuests = guests?.length || 0
    const withToken = guests?.filter((g) => g.qr_token).length || 0
    const reservationStats = {
      total: totalGuests,
      hadir: guests?.filter((g) => g.rsvp_status === "HADIR").length || 0,
      belum_respon: guests?.filter((g) => g.rsvp_status === "BELUM_RESPON").length || 0,
      belum_dibuka: Math.max(0, totalGuests - (guests?.filter((g) => g.invitation_opened_at).length || 0)),
    }

    // Feature-specific counts (parallel)
    const [
      { count: wishCount },
      { count: photoCount },
      { count: accountCount },
      { count: addressCount },
      { count: checkedInCount },
    ] = await Promise.all([
      supabaseAdmin.from("wishes").select("*", { count: "exact", head: true }).eq("wedding_profile_id", wp.id),
      supabaseAdmin.from("guest_photos").select("*", { count: "exact", head: true }).eq("wedding_profile_id", wp.id),
      supabaseAdmin.from("gift_accounts").select("*", { count: "exact", head: true }).eq("wedding_profile_id", wp.id),
      supabaseAdmin.from("gift_addresses").select("*", { count: "exact", head: true }).eq("wedding_profile_id", wp.id),
      supabaseAdmin.from("guests").select("*", { count: "exact", head: true }).eq("wedding_profile_id", wp.id).eq("is_checked_in", true),
    ])

    // WA Blast schedule
    const { data: waBlastSchedule } = await supabaseAdmin
      .from("wa_blast_schedules")
      .select("*")
      .eq("wedding_profile_id", wp.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // VIP guests for the Reminder Tamu VIP (WA blast) feature
    const { data: vipGuests } = await supabaseAdmin
      .from("guests")
      .select("id, name, phone_number, table_number, category, created_at, added_manually, slug, qr_token")
      .eq("wedding_profile_id", wp.id)
      .eq("is_vip", true)
      .order("created_at", { ascending: true })
    const waBlastQuota = (hasVipQuotaBase(wp.package_type) ? 100 : 0) + (wp.wa_blast_tier || 0)

    // Template + track name for premium_web (parallel)
    let webTemplateName: string | null = null
    let webTrackName: string | null = null
    let webPublished = false
    const { data: webProfile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("selected_template_id, selected_track_id, is_published")
      .eq("id", wp.id)
      .single()
    const [tmplRes, trkRes] = await Promise.all([
      webProfile?.selected_template_id
        ? supabaseAdmin.from("web_templates").select("name").eq("id", webProfile.selected_template_id).single()
        : Promise.resolve({ data: null }),
      webProfile?.selected_track_id
        ? supabaseAdmin.from("web_tracks").select("title").eq("id", webProfile.selected_track_id).single()
        : Promise.resolve({ data: null }),
    ])
    if (tmplRes?.data) webTemplateName = tmplRes.data.name
    if (trkRes?.data) webTrackName = trkRes.data.title
    webPublished = webProfile?.is_published === true

    // Latest feedback status (for derived board column) + status audit log
    const { data: latestFb } = await supabaseAdmin
      .from("feedback_submissions")
      .select("status")
      .eq("wedding_profile_id", wp.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const derivedStatus = resolveDerivedStatus({
      storedStatus: queueItem.status,
      paymentStatus: wp.payment_status,
      latestFeedbackStatus: latestFb?.status || null,
    })

    const { data: statusLog } = await supabaseAdmin
      .from("ops_queue_status_log")
      .select(`
        id,
        kind,
        previous_status,
        new_status,
        previous_package,
        new_package,
        details,
        actor_label,
        created_at,
        employees!left (
          id,
          name
        )
      `)
      .eq("ops_queue_id", id)
      .order("created_at", { ascending: false })
      .limit(50)

    const mappedStatusLog = (statusLog || []).map((log: any) => {
      const emp = Array.isArray(log.employees) ? log.employees[0] : log.employees
      return {
        id: log.id,
        kind: log.kind || "status",
        previous_status: log.previous_status,
        new_status: log.new_status,
        previous_package: log.previous_package || null,
        new_package: log.new_package || null,
        details: log.details || null,
        created_at: log.created_at,
        changed_by_employee_id: emp?.id || null,
        changed_by_name: emp?.name || log.actor_label || null,
      }
    })

    const featureSet = Array.from(await getFeatureIncluded(wp.package_type || "signature"))

    return NextResponse.json({
      queue: {
        id: queueItem.id,
        status: queueItem.status,
        sla_started_at: queueItem.sla_started_at,
        sla_ended_at: (queueItem as any).sla_ended_at || null,
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
        display_name: wp.display_name,
        slug: wp.slug,
        whatsapp_number: wp.whatsapp_number,
        estimated_wedding_date: wp.estimated_wedding_date,
        sessions: wp.sessions,
        estimated_guest_count: wp.estimated_guest_count,
        package_type: wp.package_type,
        total_project_cost: wp.total_project_cost,
        voucher_code: wp.voucher_code || null,
        voucher_discount: wp.voucher_discount || 0,
        payment_status: wp.payment_status,
        express_service: wp.express_service,
        wa_blast_tier: wp.wa_blast_tier || 0,
        undangan_fisik: wp.undangan_fisik === true,
      },
      feature_actions: featureActions || [],
      feature_set: featureSet,
      employees: allEmployees || [],
      guest_stats: { total: totalGuests, with_token: withToken },
      feature_stats: {
        wish_count: wishCount ?? 0,
        photo_count: photoCount ?? 0,
        account_count: accountCount ?? 0,
        address_count: addressCount ?? 0,
        checked_in_count: checkedInCount ?? 0,
        template_name: webTemplateName,
        track_name: webTrackName,
        web_published: webPublished,
      },
      wa_blast_schedule: waBlastSchedule || null,
      wa_blast_quota: waBlastQuota,
      vip_guests: vipGuests || [],
      reservation_stats: reservationStats,
      derived_status: derivedStatus,
      status_log: mappedStatusLog,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
