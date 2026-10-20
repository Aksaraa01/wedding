import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { autoGenerateGuestLinks } from "@/lib/guest-link"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res
  try {
    const { id } = await params
    const { payment_status, total_cost } = await req.json()

    if (!["UNPAID", "PARTIAL_DP", "FULLY_PAID"].includes(payment_status)) {
      return NextResponse.json({ error: "Status pembayaran tidak valid" }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("wedding_profile_id")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const profileId = queueItem.wedding_profile_id

    const { data: oldProfile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("payment_status, voucher_discount, total_project_cost")
      .eq("id", profileId)
      .single()

    const wasUnpaid = oldProfile?.payment_status === "UNPAID"
    const nowPaid = payment_status !== "UNPAID"

    // First payment freezes percent-voucher terms one-way. A later revert to
    // UNPAID does not unfreeze: the couple keeps the discount they paid with.
    if (wasUnpaid && nowPaid) {
      const { error: freezeError } = await supabaseAdmin.rpc("freeze_voucher", {
        p_profile_id: profileId,
        p_discount: oldProfile?.voucher_discount || 0,
        p_total: total_cost !== undefined ? total_cost : oldProfile?.total_project_cost || 0,
      })
      if (freezeError) {
        return NextResponse.json({ error: "Gagal membekukan voucher." }, { status: 500 })
      }
    }

    const updateData: Record<string, any> = { payment_status }
    if (total_cost !== undefined) {
      updateData.total_project_cost = total_cost
    }

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update(updateData)
      .eq("id", profileId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    let qrGenerated = 0
    if (wasUnpaid && nowPaid) {
      const { data: guests } = await supabaseAdmin
        .from("guests")
        .select("id, name, qr_token, slug")
        .eq("wedding_profile_id", profileId)
        .or("qr_token.is.null,slug.is.null")

      if (guests && guests.length > 0) {
        qrGenerated = await autoGenerateGuestLinks(profileId, guests)
      }
    }

    // Audit the payment flip in the unified Riwayat (this route bypasses the
    // status pipeline, so without this the change would leave no trace).
    if (oldProfile?.payment_status !== payment_status) {
      await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "payment",
        details: `${oldProfile?.payment_status || "—"} → ${payment_status}`,
      })
    }

    return NextResponse.json({
      success: true,
      payment_status,
      qr_generated: qrGenerated,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
