import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone, PACKAGE_CODES, PACKAGE_FEATURES, priceParts } from "@/lib/packages"
import { getPriceBook } from "@/lib/priceBook"
import { normalizeGaleriConfig } from "@/lib/gallery"
import { slugifyCouple } from "@/lib/slug"
import { notifyNewAccountGroup } from "@/lib/notifyGroup"
import { getSelections } from "@/lib/featureGates"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"
import { normalizeVoucherCode } from "@/lib/voucherInput"
import { voucherErrorMessage } from "@/lib/voucherErrors"
import { COUPLE_COOKIE, COUPLE_TTL_SECONDS, setSessionCookie, signSession } from "@/lib/sessionToken"

function validPin(pin: string): boolean {
  return /^\d{6}$/.test(pin || "")
}

export async function POST(req: Request) {
  const ipRl = checkRateLimit(`register:${getClientIp(req)}`, 10, 60_000)
  if (!ipRl.ok) return rateLimited(ipRl.retryAfterMs!)

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

    const normalizedPhone = normalizePhone(whatsapp_number || "")
    if (normalizedPhone) {
      const phoneRl = checkRateLimit(`register-phone:${normalizedPhone}`, 5, 60_000)
      if (!phoneRl.ok) return rateLimited(phoneRl.retryAfterMs!)
    }

    let voucherCode: string | null = null
    if (typeof body?.voucher_code === "string" && body.voucher_code !== "") {
      const parsed = normalizeVoucherCode(body.voucher_code)
      if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
      voucherCode = parsed.value
    }

    // Galeri Tamu slider config (standalone tab or Undangan add-on).
    // Tier + price recomputed server-side; standalone band follows photos.
    let galeri: Awaited<ReturnType<typeof normalizeGaleriConfig>> = null
    try {
      galeri = await normalizeGaleriConfig(body?.galeri)
    } catch (err: unknown) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Konfigurasi galeri tidak valid" }, { status: 400 })
    }
    let effectivePackage = package_type || "signature"
    // Standalone GT tab posts photos only (no package code).
    if (galeri && !package_type) effectivePackage = "gt"
    if (effectivePackage === "gt" && !galeri) {
      return NextResponse.json({ error: "Paket Galeri Tamu membutuhkan konfigurasi foto & tamu" }, { status: 400 })
    }
    // Buku Tamu Digital bundles its gallery via the matrix — the slider
    // add-on is Undangan-only. WA tiers only where the base includes them.
    if (galeri && effectivePackage.startsWith("dgb_")) {
      return NextResponse.json({ error: "Buku Tamu Digital sudah termasuk galeri — add-on Galeri Tamu hanya untuk Undangan Digital" }, { status: 400 })
    }
    if ((wa_blast_tier || 0) > 0 && !(PACKAGE_FEATURES[effectivePackage] || []).includes("wa_blast")) {
      return NextResponse.json({ error: "Paket yang dipilih tidak mendukung WA Blast" }, { status: 400 })
    }
    const galeriPrice = galeri?.price || 0

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
        return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
      }

      userId = user.id
    }

    const book = await getPriceBook()
    if (book.base[effectivePackage] === undefined) {
      return NextResponse.json({ error: "Harga paket belum dikonfigurasi" }, { status: 500 })
    }
    const parts = priceParts(book, effectivePackage, wa_blast_tier || 0, !!express_service, galeriPrice)
    const totalBase = parts.base + parts.waBlast + parts.express + parts.galeri

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
        package_type: effectivePackage,
        wa_blast_tier: wa_blast_tier || 0,
        express_service: !!express_service,
        undangan_fisik: !!undangan_fisik,
        total_project_cost: totalBase,
        payment_status: "UNPAID",
        // Galeri config (standalone tab or Undangan add-on). Couple name is
        // prefilled for the galeri-kenangan setup card (editable there).
        galeri_addon: !!galeri,
        galeri_photos_per_guest: galeri?.photos_per_guest || null,
        galeri_guest_count: galeri?.guest_count || null,
        galeri_tier: galeri?.tier || null,
        galeri_price: galeriPrice,
        ...(galeri
          ? { gallery_couple_name: `${groom_name.trim()} & ${bride_name.trim()}` }
          : {}),
      })
      .select("id")
      .single()

    if (profileError) {
      if (profileError.code === "23505") {
        return NextResponse.json({ error: "Nama pasangan sudah digunakan" }, { status: 409 })
      }
      return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
    }

    // Voucher redemption (single voucher per couple): atomic consume AFTER the
    // profile exists. On failure the just-created profile is removed so a
    // retry starts clean (the users row is phone-keyed and safely reused).
    let voucherDiscount = 0
    if (voucherCode) {
      const { data: redeemed, error: redeemError } = await supabaseAdmin.rpc("redeem_voucher", {
        p_code: voucherCode,
        p_profile_id: profile.id,
        p_base: parts.base,
        p_wa_price: parts.waBlast,
        p_express_price: parts.express,
        p_galeri_price: parts.galeri,
        p_employee_id: null,
      })
      if (redeemError) {
        await supabaseAdmin.from("wedding_profiles").delete().eq("id", profile.id)
        const key = (redeemError.message || "").trim()
        return NextResponse.json(
          { error: voucherErrorMessage(key) },
          { status: 400 },
        )
      }
      const row = Array.isArray(redeemed) ? redeemed[0] : redeemed
      voucherDiscount = Math.max(0, Math.floor(Number(row?.out_discount) || 0))
      await supabaseAdmin
        .from("wedding_profiles")
        .update({
          voucher_code: voucherCode,
          voucher_discount: voucherDiscount,
          total_project_cost: Math.max(0, totalBase - voucherDiscount),
        })
        .eq("id", profile.id)
    }

    const selections = await getSelections(effectivePackage, !!undangan_fisik, !!galeri)
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
      return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
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
        return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
      }
    }

    // Awaited (not fire-and-forget) so the WA send completes inside the
    // request lifecycle; a notify failure never fails the registration.
    // Reports the discounted total when a voucher was applied.
    const finalTotal = Math.max(0, totalBase - voucherDiscount)
    try {
      await notifyNewAccountGroup({
        wedding_profile_id: profile.id,
        slug,
        bride_name,
        groom_name,
        whatsapp_number: normalizedPhone,
        package_type: effectivePackage,
        wa_blast_tier: wa_blast_tier || 0,
        total: finalTotal,
        voucher_code: voucherCode,
        voucher_discount: voucherDiscount || null,
      })
    } catch (e) {
      console.error("[notifyGroup] failed", e)
    }

    const token = await signSession({ sub: profile.id, scope: "couple" }, COUPLE_TTL_SECONDS)
    const res = NextResponse.json({ success: true, wedding_profile_id: profile.id, slug })
    setSessionCookie(res, COUPLE_COOKIE, token, COUPLE_TTL_SECONDS)
    return res
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
  }
}
