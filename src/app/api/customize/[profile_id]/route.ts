import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotalWithVoucher, deriveSelections, PACKAGE_CODES } from "@/lib/packages"

const VOUCHER_ERRORS: Record<string, string> = {
  invalid: "Kode voucher tidak valid.",
  inactive: "Voucher ini sudah dinonaktifkan.",
  exhausted: "Kuota voucher ini sudah habis.",
  ineligible: "Voucher ini tidak berlaku untuk paket yang dipilih.",
  already_used: "Couple ini sudah memakai voucher.",
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params
    const body = await req.json()
    const { package_type, wa_blast_tier, express_service, undangan_fisik } = body

    if (package_type && !PACKAGE_CODES.includes(package_type)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from("wedding_profiles")
      .select("payment_status, package_type, wa_blast_tier, express_service, undangan_fisik, voucher_code, voucher_discount")
      .eq("id", profile_id)
      .single()

    if (existing && existing.payment_status !== "UNPAID") {
      const changed =
        (package_type && package_type !== existing.package_type) ||
        (wa_blast_tier ?? 0) !== (existing.wa_blast_tier ?? 0) ||
        !!express_service !== !!existing.express_service ||
        !!undangan_fisik !== !!existing.undangan_fisik
      if (changed) {
        return NextResponse.json({ error: "Perubahan paket/add-on setelah pembayaran hubungi konsultan" }, { status: 403 })
      }
    }

    // Effective package/add-ons fall back to stored values so voucher-only
    // calls (swap/release without package fields) never reset the package —
    // and validation always runs against the real package.
    const effPackage = package_type || existing?.package_type || "signature"
    const effTier = wa_blast_tier ?? existing?.wa_blast_tier ?? 0
    const effExpress = express_service ?? existing?.express_service ?? false
    const effFisik = undangan_fisik ?? existing?.undangan_fisik ?? false

    // Retroactive voucher apply (edit mode, one voucher per couple): validate +
    // atomic consume BEFORE recomputing the total. Paid couples are blocked
    // from total-changing edits above; locked voucher chips never send a code.
    let voucherDiscount = existing?.voucher_discount || 0
    let voucherCode: string | null = existing?.voucher_code || null
    const newVoucherCode =
      typeof body?.voucher_code === "string" && body.voucher_code.trim()
        ? body.voucher_code.trim().toUpperCase()
        : null
    if (newVoucherCode && existing && existing.payment_status !== "UNPAID") {
      return NextResponse.json({ error: "Voucher tidak dapat ditambahkan setelah pembayaran. Hubungi konsultan." }, { status: 403 })
    }
    // Release flow (lepas voucher, UNPAID only): frees the code back to the
    // pool and clears the discount.
    if (body?.release_voucher === true && !newVoucherCode) {
      if (!voucherCode) {
        return NextResponse.json({ error: "Couple ini tidak memakai voucher." }, { status: 400 })
      }
      if (existing && existing.payment_status !== "UNPAID") {
        return NextResponse.json({ error: "Voucher tidak dapat dilepas setelah pembayaran. Hubungi konsultan." }, { status: 403 })
      }
      const { data: red } = await supabaseAdmin
        .from("voucher_redemptions")
        .select("id, voucher_id")
        .eq("wedding_profile_id", profile_id)
        .eq("status", "active")
        .maybeSingle()
      if (red) {
        const { data: flipped } = await supabaseAdmin
          .from("voucher_redemptions")
          .update({ status: "released", released_at: new Date().toISOString() })
          .eq("id", (red as any).id)
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
            .update({ used_count: Math.max(0, ((v as any)?.used_count || 1) - 1), updated_at: new Date().toISOString() })
            .eq("id", (red as any).voucher_id)
        }
      }
      voucherDiscount = 0
      voucherCode = null
    }
    if (newVoucherCode) {
      if (voucherCode) {
        // Swap flow (ganti kode): only with explicit replace intent, UNPAID only.
        if (body?.replace_voucher !== true) {
          return NextResponse.json({ error: "Voucher sudah digunakan dan tidak dapat diganti." }, { status: 400 })
        }
        if (voucherCode === newVoucherCode) {
          return NextResponse.json({ error: "Kode sama dengan voucher yang sudah dipakai." }, { status: 400 })
        }
        const { data: swapped, error: swapError } = await supabaseAdmin.rpc("swap_voucher", {
          p_code: newVoucherCode,
          p_profile_id: profile_id,
          p_package: effPackage,
        })
        if (swapError) {
          const key = (swapError.message || "").trim()
          return NextResponse.json({ error: VOUCHER_ERRORS[key] || "Voucher tidak dapat digunakan." }, { status: 400 })
        }
        const srow = Array.isArray(swapped) ? swapped[0] : swapped
        voucherDiscount = Math.max(0, Math.floor(Number(srow?.amount) || 0))
        voucherCode = newVoucherCode
      } else {
        const { data: redeemed, error: redeemError } = await supabaseAdmin.rpc("redeem_voucher", {
          p_code: newVoucherCode,
          p_profile_id: profile_id,
          p_package: effPackage,
        })
        if (redeemError) {
          const key = (redeemError.message || "").trim()
          return NextResponse.json({ error: VOUCHER_ERRORS[key] || "Voucher tidak dapat digunakan." }, { status: 400 })
        }
        voucherDiscount = Math.max(0, Math.floor(Number(redeemed) || 0))
        voucherCode = newVoucherCode
      }
    }

    // Voucher discount locked at registration is preserved across add-on edits.
    const total = calcTotalWithVoucher(effPackage, effTier, !!effExpress, voucherDiscount)

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({
        package_type: effPackage,
        wa_blast_tier: effTier,
        express_service: !!effExpress,
        undangan_fisik: !!effFisik,
        total_project_cost: total,
        voucher_code: voucherCode,
        voucher_discount: voucherDiscount,
      })
      .eq("id", profile_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Sync feature_actions to match the new package — only when package or
    // add-ons were actually sent (voucher-only calls must not rebuild
    // features or reset the queue status).
    const touchedPackage =
      package_type !== undefined ||
      wa_blast_tier !== undefined ||
      express_service !== undefined ||
      undangan_fisik !== undefined
    // Sync feature_actions to match the new package
    const selections = deriveSelections(effPackage, !!effFisik)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    const { data: queueData } = await supabaseAdmin
      .from("ops_queue")
      .select("id, status")
      .eq("wedding_profile_id", profile_id)
      .maybeSingle()

    if (queueData && touchedPackage) {
      await supabaseAdmin
        .from("feature_actions")
        .delete()
        .eq("ops_queue_id", queueData.id)

      if (enabledFeatures.length > 0) {
        const featureRows = enabledFeatures.map((key) => ({
          ops_queue_id: queueData.id,
          wedding_profile_id: profile_id,
          feature_key: key,
          status: "butuh_tindakan",
        }))
        await supabaseAdmin.from("feature_actions").insert(featureRows)
      }

      // Reset queue status to belum_bayar so OPS knows there's new work.
      // Logged so the reset doesn't create a silent gap in Riwayat.
      if (queueData.status !== "belum_bayar") {
        await supabaseAdmin
          .from("ops_queue")
          .update({ status: "belum_bayar" })
          .eq("id", queueData.id)
        await supabaseAdmin.from("ops_queue_status_log").insert({
          ops_queue_id: queueData.id,
          kind: "status",
          previous_status: queueData.status,
          new_status: "belum_bayar",
          details: "Reset otomatis: couple ganti paket",
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
