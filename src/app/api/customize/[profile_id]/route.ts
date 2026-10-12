import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotalWithVoucherBook, PACKAGE_CODES } from "@/lib/packages"
import { getPriceBook } from "@/lib/priceBook"
import { normalizeGaleriConfig } from "@/lib/gallery"
import { sanitizeAddonsForPackage } from "@/lib/packageRules"
import { getSelections } from "@/lib/featureGates"

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
      .select("payment_status, package_type, wa_blast_tier, express_service, undangan_fisik, voucher_code, voucher_discount, galeri_addon, galeri_photos_per_guest, galeri_guest_count, galeri_tier, galeri_price")
      .eq("id", profile_id)
      .single()

    // Galeri slider config: object to set/replace, null to remove, undefined
    // to keep. Tier + price recomputed server-side.
    let galeri: Awaited<ReturnType<typeof normalizeGaleriConfig>> = null
    let galeriTouched = false
    if (body?.galeri !== undefined) {
      galeriTouched = true
      try {
        galeri = await normalizeGaleriConfig(body.galeri)
      } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Konfigurasi galeri tidak valid" }, { status: 400 })
      }
    }

    if (existing && existing.payment_status !== "UNPAID") {
      const changed =
        (package_type && package_type !== existing.package_type) ||
        (wa_blast_tier ?? 0) !== (existing.wa_blast_tier ?? 0) ||
        !!express_service !== !!existing.express_service ||
        !!undangan_fisik !== !!existing.undangan_fisik ||
        (galeriTouched && galeri?.price !== (existing.galeri_price || 0))
      if (changed) {
        return NextResponse.json({ error: "Perubahan paket/add-on setelah pembayaran hubungi konsultan" }, { status: 403 })
      }
    }

    // Effective package/add-ons fall back to stored values so voucher-only
    // calls (swap/release without package fields) never reset the package —
    // and validation always runs against the real package.
    const effPackage = package_type || existing?.package_type || "signature"
    const effFisik = undangan_fisik ?? existing?.undangan_fisik ?? false
    const storedGaleri = existing?.galeri_addon
      ? {
          photos_per_guest: existing.galeri_photos_per_guest,
          guest_count: existing.galeri_guest_count,
          tier: existing.galeri_tier,
          price: existing.galeri_price || 0,
          event_cap: 0,
        }
      : null
    // Effective package: explicit wins, else stored (single gt code — no
    // band derivation; slider tiers price it).
    // Carryover rules: a package change drops add-ons the new package can't
    // carry (WA tier on a base without wa_blast, slider config on DGB/GT)
    // instead of leaving stale values with no UI to remove them.
    const eff = await sanitizeAddonsForPackage(
      effPackage,
      {
        waBlastTier: wa_blast_tier,
        expressService: express_service === undefined ? undefined : express_service === true,
        galeri: galeriTouched ? galeri : undefined,
      },
      {
        waBlastTier: existing?.wa_blast_tier ?? 0,
        expressService: !!existing?.express_service,
        galeri: storedGaleri,
      }
    )
    const effTier = eff.waBlastTier
    const effExpress = eff.expressService
    const effGaleri = eff.galeri
    const effGaleriPrice = effGaleri?.price || 0

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
    const book = await getPriceBook()
    if (book.base[effPackage] === undefined) {
      return NextResponse.json({ error: "Harga paket belum dikonfigurasi" }, { status: 500 })
    }
    const total = calcTotalWithVoucherBook(book, effPackage, effTier, !!effExpress, voucherDiscount, effGaleriPrice)

    // Galeri columns are written whenever the effective config differs from
    // stored — a package change can clear carried values even when the
    // galeri payload itself was untouched.
    const storedGaleriKey = existing?.galeri_addon
      ? `1:${existing.galeri_photos_per_guest}:${existing.galeri_guest_count}:${existing.galeri_tier}:${existing.galeri_price || 0}`
      : "0"
    const effGaleriKey = effGaleri
      ? `1:${effGaleri.photos_per_guest}:${effGaleri.guest_count}:${effGaleri.tier}:${effGaleriPrice}`
      : "0"
    const galeriChanged = galeriTouched || storedGaleriKey !== effGaleriKey

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
        ...(galeriChanged
          ? {
              galeri_addon: !!effGaleri,
              galeri_photos_per_guest: effGaleri?.photos_per_guest || null,
              galeri_guest_count: effGaleri?.guest_count || null,
              galeri_tier: effGaleri?.tier || null,
              galeri_price: effGaleriPrice,
            }
          : {}),
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
      undangan_fisik !== undefined ||
      galeriChanged
    // Sync feature_actions to match the new package
    const selections = await getSelections(effPackage, !!effFisik, !!effGaleri)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    const { data: queueData } = await supabaseAdmin
      .from("ops_queue")
      .select("id, status")
      .eq("wedding_profile_id", profile_id)
      .maybeSingle()

    if (queueData && touchedPackage) {
      // Real value change only: re-saving identical package/add-ons must
      // not rebuild features or drag the queue back. Presence of fields in
      // the payload (!== change) previously reset a FULLY_PAID project to
      // Belum Bayar while the dashboard still showed FULLY PAID.
      const packageReallyChanged =
        effPackage !== (existing?.package_type || "signature") ||
        (effTier ?? 0) !== (existing?.wa_blast_tier ?? 0) ||
        !!effExpress !== !!existing?.express_service ||
        !!effFisik !== !!existing?.undangan_fisik ||
        storedGaleriKey !== effGaleriKey
      if (!packageReallyChanged) {
        return NextResponse.json({ success: true })
      }
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
      // UNPAID-only: a paid project keeps its pipeline stage (post-payment
      // package changes are 403-blocked above, so reaching here paid with a
      // real change must never corrupt the payment state).
      if (
        queueData.status !== "belum_bayar" &&
        (existing?.payment_status || "UNPAID") === "UNPAID"
      ) {
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
