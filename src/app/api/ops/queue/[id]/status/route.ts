import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { allowedNextStatuses, isOpsStatusKey, OPS_STATUS_LABELS, resolveDerivedStatus } from "@/lib/opsStatus"
import { autoGenerateGuestLinks } from "@/lib/guest-link"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req)
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const { status } = await req.json()

    if (!isOpsStatusKey(status)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select(`
        id,
        status,
        wedding_profile_id,
        wedding_profiles!inner (
          payment_status
        )
      `)
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles
    const profileId = queueItem.wedding_profile_id

    const { data: latestFb } = await supabaseAdmin
      .from("feedback_submissions")
      .select("id, status")
      .eq("wedding_profile_id", profileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const derived = resolveDerivedStatus({
      storedStatus: queueItem.status,
      paymentStatus: wp.payment_status,
      latestFeedbackStatus: latestFb?.status || null,
    })

    const allowed = allowedNextStatuses(derived)
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Tidak dapat berpindah ke ${OPS_STATUS_LABELS[status]}. Pilih transisi yang valid.`,
        },
        { status: 400 },
      )
    }

    // Persist the pipeline stage first so a failure aborts before any side-effect.
    const { error: updateError } = await supabaseAdmin
      .from("ops_queue")
      .update({ status })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Side-effects driven by the target status.
    if (status === "belum_bayar") {
      await supabaseAdmin
        .from("wedding_profiles")
        .update({ payment_status: "UNPAID" })
        .eq("id", profileId)
    } else if (status === "sudah_bayar") {
      await supabaseAdmin
        .from("wedding_profiles")
        .update({ payment_status: "FULLY_PAID" })
        .eq("id", profileId)
      const { data: guests } = await supabaseAdmin
        .from("guests")
        .select("id, name, qr_token, slug")
        .eq("wedding_profile_id", profileId)
        .or("qr_token.is.null,slug.is.null")
      if (guests && guests.length > 0) {
        await autoGenerateGuestLinks(profileId, guests)
      }
    } else if (status === "feedback_progress" || status === "feedback_selesai") {
      const patch = { status: status === "feedback_selesai" ? "resolved" : "in_progress" }
      await supabaseAdmin
        .from("feedback_submissions")
        .update(patch)
        .eq("wedding_profile_id", profileId)
    }

    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle()

    await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      previous_status: derived,
      new_status: status,
      changed_by_employee_id: emp?.id || null,
    })

    return NextResponse.json({ success: true, derived_status: status, previous_status: derived })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}