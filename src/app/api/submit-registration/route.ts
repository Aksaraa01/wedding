import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotalWithVoucher, calcTotal, normalizePhone, PACKAGE_CODES } from "@/lib/packages"
import { slugifyCouple } from "@/lib/slug"
import { notifyNewAccountGroup } from "@/lib/notifyGroup"
import { getSelections } from "@/lib/featureGates"

const VOUCHER_ERRORS: Record<string, string> = {
  invalid: "Kode voucher tidak valid.",
  inactive: "Voucher ini sudah dinonaktifkan.",
  exhausted: "Kuota voucher ini sudah habis.",
  ineligible: "Voucher ini tidak berlaku untuk paket yang dipilih.",
  already_used: "Voucher ini sudah digunakan.",
}

function validPin(pin: string): boolean {
  return /^\d{6}$/.test(pin || "")
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      bride_name,
      groom_name,
      estimated_wedding_date,
      estimated_guest_count,
      whatsapp_number,
      pin,
      package_type,
      wa_blast_tier,
      express_service,
      undangan_fisik,
    } = body

    if (!bride_name || !groom_name) {
      return NextResponse.json({ error: "Data pengantin tidak lengkap" }, { status: 400 })
    }

    if (!validPin(pin)) {
      return NextResponse.json({ error: "PIN harus terdiri dari 6 digit angka" }, { status: 400 })
    }

    if (package_type && !PACKAGE_CODES.includes(package_type)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    // Canonical slug built from FULL names (all input words, not just the first).
    const slug = slugifyCouple(bride_name, groom_name)
    if (!slug) {
      return NextResponse.json({ error: "Data pengantin tidak lengkap" }, { status: 400 })
    }

    const { data: dupCouple } = await supabaseAdmin
      .from("wedding_profiles")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (dupCouple) {
      return NextResponse.json({ error: "Nama pasangan sudah digunakan" }, { status: 409 })
    }

    const normalizedPhone = normalizePhone(whatsapp_number || "")

    const userEmail = `${slug}@aksaraa.com`

    let userId = ""

    if (normalizedPhone) {
      const { data: existing } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("phone_number", normalizedPhone)
        .maybeSingle()

      if (existing) {
        userId = existing.id
      }
    }

    if (!userId) {
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .insert({
          email: userEmail,
          password_hash: slug,
          phone_number: normalizedPhone || slug,
          role: "CLIENT",
          pin,
        })
        .select("id")
        .single()

      if (userError) {
        if (userError.code === "23505") {
          return NextResponse.json({ error: "Nomor WhatsApp sudah terdaftar" }, { status: 409 })
        }
        return NextResponse.json({ error: userError.message }, { status: 500 })
      }

      userId = user.id
    }

    const total = calcTotal(package_type || "signature", wa_blast_tier || 0, !!express_service)

    const voucherCode =
      typeof body?.voucher_code === "string" && body.voucher_code.trim()
        ? body.voucher_code.trim().toUpperCase()
        : null

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("wedding_profiles")
      .insert({
        user_id: userId,
        bride_name,
        groom_name,
        estimated_wedding_date,
        estimated_guest_count,
        slug,
        whatsapp_number: normalizedPhone,
        package_type: package_type || "signature",
        wa_blast_tier: wa_blast_tier || 0,
        express_service: !!express_service,
        undangan_fisik: !!undangan_fisik,
        total_project_cost: total,
        payment_status: "UNPAID",
      })
      .select("id")
      .single()

    if (profileError) {
      if (profileError.code === "23505") {
        return NextResponse.json({ error: "Nama pasangan sudah digunakan" }, { status: 409 })
      }
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Voucher redemption (single voucher per couple): atomic consume AFTER the
    // profile exists. On failure the just-created profile is removed so a
    // retry starts clean (the users row is phone-keyed and safely reused).
    let voucherDiscount = 0
    if (voucherCode) {
      const { data: redeemed, error: redeemError } = await supabaseAdmin.rpc("redeem_voucher", {
        p_code: voucherCode,
        p_profile_id: profile.id,
        p_package: package_type || "signature",
      })
      if (redeemError) {
        await supabaseAdmin.from("wedding_profiles").delete().eq("id", profile.id)
        const key = (redeemError.message || "").trim()
        return NextResponse.json(
          { error: VOUCHER_ERRORS[key] || "Voucher tidak dapat digunakan." },
          { status: 400 },
        )
      }
      voucherDiscount = Math.max(0, Math.floor(Number(redeemed) || 0))
      const discounted = calcTotalWithVoucher(package_type || "signature", wa_blast_tier || 0, !!express_service, voucherDiscount)
      await supabaseAdmin
        .from("wedding_profiles")
        .update({ voucher_code: voucherCode, voucher_discount: voucherDiscount, total_project_cost: discounted })
        .eq("id", profile.id)
    }

    const selections = await getSelections(package_type || "signature", !!undangan_fisik)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .insert({
        wedding_profile_id: profile.id,
        status: "belum_bayar",
        sla_started_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (queueError) {
      return NextResponse.json({ error: queueError.message }, { status: 500 })
    }

    if (enabledFeatures.length > 0) {
      const featureRows = enabledFeatures.map((key) => ({
        ops_queue_id: queueItem.id,
        wedding_profile_id: profile.id,
        feature_key: key,
        status: "butuh_tindakan",
      }))

      const { error: featuresError } = await supabaseAdmin
        .from("feature_actions")
        .insert(featureRows)

      if (featuresError) {
        return NextResponse.json({ error: featuresError.message }, { status: 500 })
      }
    }

    // Awaited (not fire-and-forget) so the WA send completes inside the
    // request lifecycle; a notify failure never fails the registration.
    // Reports the discounted total when a voucher was applied.
    const finalTotal = calcTotalWithVoucher(package_type || "signature", wa_blast_tier || 0, !!express_service, voucherDiscount)
    try {
      await notifyNewAccountGroup({
        wedding_profile_id: profile.id,
        slug,
        bride_name,
        groom_name,
        whatsapp_number: normalizedPhone,
        package_type: package_type || "signature",
        wa_blast_tier: wa_blast_tier || 0,
        total: finalTotal,
        voucher_code: voucherCode,
        voucher_discount: voucherDiscount || null,
      })
    } catch (e) {
      console.error("[notifyGroup] failed", e)
    }

    return NextResponse.json({ success: true, wedding_profile_id: profile.id, slug })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
