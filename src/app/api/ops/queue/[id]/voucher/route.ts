import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { calcTotalWithVoucher } from "@/lib/packages"
import { resolveDerivedStatus } from "@/lib/opsStatus"

const VOUCHER_ERRORS: Record<string, string> = {
  invalid: "Kode voucher tidak valid.",
  inactive: "Voucher ini sudah dinonaktifkan.",
  exhausted: "Kuota voucher ini sudah habis.",
  ineligible: "Voucher ini tidak berlaku untuk paket couple ini.",
  already_used: "Couple ini sudah memakai voucher.",
}

// PUT /api/ops/queue/[id]/voucher — apply a voucher code to a couple (ops).
// Sales + admin while UNPAID; admin only once paid. Logged to the unified
// queue timeline (kind "voucher") with the acting employee.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    const code =
      typeof body?.voucher_code === "string" && body.voucher_code.trim()
        ? body.voucher_code.trim().toUpperCase()
        : null
    if (!code) {
      return NextResponse.json({ error: "Kode voucher wajib diisi." }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, status, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, payment_status, voucher_code, voucher_discount)")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = (Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles) as any

    // Voucher add/swap only at the Belum Bayar stage (derived column — a
    // pending-feedback resubmission drags the card back, closing the gate).
    const { data: latestFb } = await supabaseAdmin
      .from("feedback_submissions")
      .select("status")
      .eq("wedding_profile_id", wp.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    const derived = resolveDerivedStatus({
      storedStatus: (queueItem as any).status,
      paymentStatus: wp.payment_status,
      latestFeedbackStatus: latestFb?.status || null,
    })
    if (derived !== "belum_bayar") {
      return NextResponse.json({ error: "Voucher hanya dapat ditambahkan pada tahap Belum Bayar." }, { status: 403 })
    }

    // Swap flow (human-error correction) when a voucher is already applied:
    // same role rules as first apply. Atomic via swap_voucher(): old slot
    // released, new code consumed, no half-swapped state possible.
    if (wp.voucher_code && wp.voucher_code === code) {
      return NextResponse.json({ error: "Kode sama dengan voucher yang sudah dipakai." }, { status: 400 })
    }

    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id, role")
      .eq("phone_number", phone)
      .maybeSingle()

    if (wp.payment_status !== "UNPAID" && emp?.role !== "admin") {
      return NextResponse.json({ error: "Voucher untuk couple berbayar hanya dapat ditambahkan oleh Admin." }, { status: 403 })
    }

    if (wp.voucher_code) {
      const { data: swapped, error: swapError } = await supabaseAdmin.rpc("swap_voucher", {
        p_code: code,
        p_profile_id: wp.id,
        p_package: wp.package_type || "signature",
      })
      if (swapError) {
        const key = (swapError.message || "").trim()
        await supabaseAdmin.from("ops_queue_status_log").insert({
          ops_queue_id: id,
          kind: "voucher",
          details: `Gagal ganti ke ${code}: ${VOUCHER_ERRORS[key] || "tidak dapat digunakan."}`.slice(0, 500),
          changed_by_employee_id: emp?.id || null,
        })
        return NextResponse.json({ error: VOUCHER_ERRORS[key] || "Voucher tidak dapat digunakan." }, { status: 400 })
      }
      const row = Array.isArray(swapped) ? swapped[0] : swapped
      const discount = Math.max(0, Math.floor(Number(row?.amount) || 0))
      const total = calcTotalWithVoucher(
        wp.package_type || "signature",
        wp.wa_blast_tier || 0,
        wp.express_service === true,
        discount
      )
      const { error: updateError } = await supabaseAdmin
        .from("wedding_profiles")
        .update({ voucher_code: code, voucher_discount: discount, total_project_cost: total })
        .eq("id", wp.id)
      if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

      await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "voucher",
        details: `Voucher diganti ${row?.old_code || "—"} → ${code} • potongan ${discount} • total ${total}`.slice(0, 500),
        changed_by_employee_id: emp?.id || null,
      })
      return NextResponse.json({ success: true, replaced: row?.old_code || null, voucher_code: code, voucher_discount: discount, total_project_cost: total })
    }

    const { data: redeemed, error: redeemError } = await supabaseAdmin.rpc("redeem_voucher", {
      p_code: code,
      p_profile_id: wp.id,
      p_package: wp.package_type || "signature",
    })
    if (redeemError) {
      const key = (redeemError.message || "").trim()
      await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "voucher",
        details: `Gagal pakai ${code}: ${VOUCHER_ERRORS[key] || "tidak dapat digunakan."}`.slice(0, 500),
        changed_by_employee_id: emp?.id || null,
      })
      return NextResponse.json({ error: VOUCHER_ERRORS[key] || "Voucher tidak dapat digunakan." }, { status: 400 })
    }

    const discount = Math.max(0, Math.floor(Number(redeemed) || 0))
    const total = calcTotalWithVoucher(
      wp.package_type || "signature",
      wp.wa_blast_tier || 0,
      wp.express_service === true,
      discount
    )

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({ voucher_code: code, voucher_discount: discount, total_project_cost: total })
      .eq("id", wp.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      kind: "voucher",
      details: `Voucher ${code} diterapkan • potongan ${discount} • total ${total}`.slice(0, 500),
      changed_by_employee_id: emp?.id || null,
    })

    return NextResponse.json({ success: true, voucher_code: code, voucher_discount: discount, total_project_cost: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/ops/queue/[id]/voucher — release (frees the code
// back to the pool: redemption removed, cap decremented, discount cleared).
// Admin anytime; sales while UNPAID.
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, payment_status, voucher_code, voucher_discount)")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = (Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles) as any

    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id, role")
      .eq("phone_number", phone)
      .maybeSingle()

    if (wp.payment_status !== "UNPAID" && emp?.role !== "admin") {
      return NextResponse.json({ error: "Voucher couple berbayar hanya dapat dilepas oleh Admin." }, { status: 403 })
    }

    if (!wp.voucher_code) {
      return NextResponse.json({ error: "Couple ini tidak memakai voucher." }, { status: 400 })
    }

    const { data: red } = await supabaseAdmin
      .from("voucher_redemptions")
      .select("id, voucher_id")
      .eq("wedding_profile_id", wp.id)
      .eq("status", "active")
      .maybeSingle()

    if (red) {
      // Status-flip, not delete: history stays queryable; decrement only when
      // a live row actually transitioned (concurrent releases can't double-count).
      const { data: flipped } = await supabaseAdmin
        .from("voucher_redemptions")
        .update({ status: "released", released_at: new Date().toISOString(), released_by_employee_id: emp?.id || null })
        .eq("id", red.id)
        .eq("status", "active")
        .select("id")
      if (flipped && flipped.length > 0) {
        const { data: v } = await supabaseAdmin
          .from("vouchers")
          .select("used_count")
          .eq("id", (red as any).voucher_id)
          .maybeSingle()
        await supabaseAdmin
          .from("vouchers")
          .update({ used_count: Math.max(0, (v?.used_count || 1) - 1), updated_at: new Date().toISOString() })
          .eq("id", (red as any).voucher_id)
      }
    }

    const total = calcTotalWithVoucher(
      wp.package_type || "signature",
      wp.wa_blast_tier || 0,
      wp.express_service === true,
      0
    )
    await supabaseAdmin
      .from("wedding_profiles")
      .update({ voucher_code: null, voucher_discount: 0, total_project_cost: total })
      .eq("id", wp.id)

    await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      kind: "voucher",
      details: `Voucher ${wp.voucher_code} dilepas • total kembali ${total}`.slice(0, 500),
      changed_by_employee_id: emp?.id || null,
    })

    return NextResponse.json({ success: true, total_project_cost: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
