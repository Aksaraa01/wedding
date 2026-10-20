import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { priceParts } from "@/lib/packages"
import { getPriceBook } from "@/lib/priceBook"
import { resolveDerivedStatus } from "@/lib/opsStatus"
import { voucherErrorMessage } from "@/lib/voucherErrors"

// PUT /api/ops/queue/[id]/voucher — apply or swap a voucher code (ops).
// Only at Belum Bayar: once payment starts the voucher terms are frozen.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)
    const rawCode = typeof body?.voucher_code === "string" ? body.voucher_code : ""
    if (!rawCode || /\s/.test(rawCode)) {
      return NextResponse.json({ error: "Kode voucher wajib diisi tanpa spasi." }, { status: 400 })
    }
    const code = rawCode.toUpperCase()
    if (code.length > 64) {
      return NextResponse.json({ error: "Kode maksimal 64 karakter." }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, status, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, payment_status, voucher_code, voucher_discount, galeri_price)")
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
    if (derived !== "belum_bayar" || wp.payment_status !== "UNPAID") {
      return NextResponse.json({ error: "Voucher hanya dapat diubah sebelum pembayaran." }, { status: 403 })
    }

    if (wp.voucher_code && wp.voucher_code === code) {
      return NextResponse.json({ error: "Kode sama dengan voucher yang sudah dipakai." }, { status: 400 })
    }

    const book = await getPriceBook()
    const parts = priceParts(
      book,
      wp.package_type || "signature",
      wp.wa_blast_tier || 0,
      wp.express_service === true,
      wp.galeri_price || 0,
    )
    const rpcArgs = {
      p_code: code,
      p_profile_id: wp.id,
      p_base: parts.base,
      p_wa_price: parts.waBlast,
      p_express_price: parts.express,
      p_galeri_price: parts.galeri,
      p_employee_id: auth.employee.id,
    }
    const totalBase = parts.base + parts.waBlast + parts.express + parts.galeri

    if (wp.voucher_code) {
      const { data: swapped, error: swapError } = await supabaseAdmin.rpc("swap_voucher", rpcArgs)
      if (swapError) {
        const key = (swapError.message || "").trim()
        await supabaseAdmin.from("ops_queue_status_log").insert({
          ops_queue_id: id,
          kind: "voucher",
          details: `Gagal ganti ke ${code}: ${voucherErrorMessage(key, "tidak dapat digunakan.")}`.slice(0, 500),
          changed_by_employee_id: auth.employee.id,
        })
        return NextResponse.json({ error: voucherErrorMessage(key) }, { status: 400 })
      }
      const row = Array.isArray(swapped) ? swapped[0] : swapped
      const discount = Math.max(0, Math.floor(Number(row?.out_discount) || 0))
      const total = Math.max(0, totalBase - discount)
      const { error: updateError } = await supabaseAdmin
        .from("wedding_profiles")
        .update({ voucher_code: code, voucher_discount: discount, total_project_cost: total })
        .eq("id", wp.id)
      if (updateError) return NextResponse.json({ error: "Gagal menyimpan voucher." }, { status: 500 })

      await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "voucher",
        details: `Voucher diganti ${row?.out_old_code || "—"} → ${code} • potongan ${discount} • total ${total}`.slice(0, 500),
        changed_by_employee_id: auth.employee.id,
      })
      return NextResponse.json({
        success: true,
        replaced: row?.out_old_code || null,
        voucher_code: code,
        voucher_discount: discount,
        total_project_cost: total,
      })
    }

    const { data: redeemed, error: redeemError } = await supabaseAdmin.rpc("redeem_voucher", rpcArgs)
    if (redeemError) {
      const key = (redeemError.message || "").trim()
      await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "voucher",
        details: `Gagal pakai ${code}: ${voucherErrorMessage(key, "tidak dapat digunakan.")}`.slice(0, 500),
        changed_by_employee_id: auth.employee.id,
      })
      return NextResponse.json({ error: voucherErrorMessage(key) }, { status: 400 })
    }

    const row = Array.isArray(redeemed) ? redeemed[0] : redeemed
    const discount = Math.max(0, Math.floor(Number(row?.out_discount) || 0))
    const total = Math.max(0, totalBase - discount)

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({ voucher_code: code, voucher_discount: discount, total_project_cost: total })
      .eq("id", wp.id)
    if (updateError) return NextResponse.json({ error: "Gagal menyimpan voucher." }, { status: 500 })

    await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      kind: "voucher",
      details: `Voucher ${code} diterapkan • potongan ${discount} • total ${total}`.slice(0, 500),
      changed_by_employee_id: auth.employee.id,
    })

    return NextResponse.json({ success: true, voucher_code: code, voucher_discount: discount, total_project_cost: total })
  } catch {
    return NextResponse.json({ error: "Gagal memproses voucher." }, { status: 500 })
  }
}

// DELETE /api/ops/queue/[id]/voucher — release (frees the code back to the
// pool: redemption released, cap decremented, discount cleared). Admin
// anytime; sales while UNPAID.
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
      .select("id, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, payment_status, voucher_code, voucher_discount, galeri_price)")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = (Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles) as any

    if (wp.payment_status !== "UNPAID" && auth.employee.role !== "admin") {
      return NextResponse.json({ error: "Voucher couple berbayar hanya dapat dilepas oleh Admin." }, { status: 403 })
    }
    if (!wp.voucher_code) {
      return NextResponse.json({ error: "Couple ini tidak memakai voucher." }, { status: 400 })
    }

    const { data: released, error: releaseError } = await supabaseAdmin.rpc("release_voucher", {
      p_profile_id: wp.id,
      p_employee_id: auth.employee.id,
    })
    if (releaseError) {
      const key = (releaseError.message || "").trim()
      return NextResponse.json({ error: voucherErrorMessage(key) }, { status: 400 })
    }
    const row = Array.isArray(released) ? released[0] : released

    const book = await getPriceBook()
    const parts = priceParts(
      book,
      wp.package_type || "signature",
      wp.wa_blast_tier || 0,
      wp.express_service === true,
      wp.galeri_price || 0,
    )
    const total = parts.base + parts.waBlast + parts.express + parts.galeri

    await supabaseAdmin
      .from("wedding_profiles")
      .update({ voucher_code: null, voucher_discount: 0, total_project_cost: total })
      .eq("id", wp.id)

    await supabaseAdmin.from("ops_queue_status_log").insert({
      ops_queue_id: id,
      kind: "voucher",
      details: `Voucher ${row?.out_voucher_code || wp.voucher_code} dilepas • total kembali ${total}`.slice(0, 500),
      changed_by_employee_id: auth.employee.id,
    })

    return NextResponse.json({ success: true, total_project_cost: total })
  } catch {
    return NextResponse.json({ error: "Gagal melepas voucher." }, { status: 500 })
  }
}
