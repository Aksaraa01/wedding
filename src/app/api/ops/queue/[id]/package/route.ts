import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { PACKAGE_CODES, priceParts } from "@/lib/packages"
import { getPriceBook } from "@/lib/priceBook"
import { normalizeGaleriConfig } from "@/lib/gallery"
import { sanitizeAddonsForPackage } from "@/lib/packageRules"
import { getSelections } from "@/lib/featureGates"
import {
  calcVoucherTotals,
  parseVoucherTerms,
  voucherTermsFromRow,
} from "@/lib/voucherDiscount"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req as unknown as Request, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res
  try {
    const { id } = await params
    const body = await req.json()
    const { package_type } = body

    if (!package_type || !PACKAGE_CODES.includes(package_type)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    // Add-ons: explicit values win, omitted keys ride along untouched.
    // Galeri tier + price are recomputed server-side, same as customize.
    let galeri = null as Awaited<ReturnType<typeof normalizeGaleriConfig>>
    let galeriTouched = false
    if (body?.galeri !== undefined) {
      galeriTouched = true
      try {
        galeri = await normalizeGaleriConfig(body.galeri)
      } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Konfigurasi galeri tidak valid" }, { status: 400 })
      }
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, undangan_fisik, payment_status, voucher_code, voucher_discount, galeri_addon, galeri_photos_per_guest, galeri_guest_count, galeri_tier, galeri_price)")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles

    const previousPackage = wp?.package_type || null

    const undanganFisik = wp?.undangan_fisik === true

    // Percent vouchers recalculate against the new package/add-on parts while
    // UNPAID; fixed amounts and frozen redemptions keep their stored value.
    const storedVoucherDiscount = (wp as any)?.voucher_discount || 0
    const { data: activeRedemption } = await supabaseAdmin
      .from("voucher_redemptions")
      .select("terms_snapshot, frozen_at, vouchers (discount_type, amount, percent, max_discount, include_wa_blast, include_express, include_galeri, package_eligibility)")
      .eq("wedding_profile_id", wp.id)
      .eq("status", "active")
      .maybeSingle()
    const redemptionVoucher = activeRedemption
      ? (Array.isArray(activeRedemption.vouchers) ? activeRedemption.vouchers[0] : activeRedemption.vouchers)
      : null
    const voucherTerms =
      parseVoucherTerms(activeRedemption?.terms_snapshot) ??
      (redemptionVoucher ? voucherTermsFromRow(redemptionVoucher) : null)
    const storedGaleri = (wp as any)?.galeri_addon
      ? {
          photos_per_guest: (wp as any).galeri_photos_per_guest,
          guest_count: (wp as any).galeri_guest_count,
          tier: (wp as any).galeri_tier,
          price: (wp as any).galeri_price || 0,
          event_cap: 0,
        }
      : null
    // Carryover rules: a package change drops add-ons the new package can't
    // carry (WA tier on a base without wa_blast, slider config on DGB/GT)
    // instead of leaving stale values with no UI to remove them.
    const eff = await sanitizeAddonsForPackage(
      package_type,
      {
        waBlastTier: body?.wa_blast_tier,
        expressService: body?.express_service === undefined ? undefined : body?.express_service === true,
        galeri: galeriTouched ? galeri : undefined,
      },
      {
        waBlastTier: (wp as any)?.wa_blast_tier ?? 0,
        expressService: (wp as any)?.express_service === true,
        galeri: storedGaleri,
      }
    )
    const waBlastTier = eff.waBlastTier
    const expressService = eff.expressService
    const effGaleri = eff.galeri
    const galeriPrice = effGaleri?.price || 0
    const galeriAddon = !!effGaleri
    // Auto-dropped stale add-ons (package change only — explicit removals
    // get their own audit entry below).
    const autoDropped: string[] = []
    if (previousPackage !== package_type) {
      if (((wp as any)?.wa_blast_tier || 0) > 0 && waBlastTier === 0) {
        autoDropped.push("WA Blast dilepas otomatis (paket baru tanpa wa_blast)")
      }
      if ((wp as any)?.express_service === true && expressService === false) {
        autoDropped.push("Express dilepas otomatis (paket Galeri Tamu)")
      }
      if ((wp as any)?.galeri_addon && !effGaleri) {
        autoDropped.push("Add-on Galeri dilepas otomatis")
      }
    }
    const book = await getPriceBook()
    if (book.base[package_type] === undefined) {
      return NextResponse.json({ error: "Harga paket belum dikonfigurasi" }, { status: 500 })
    }
    const parts = priceParts(book, package_type, waBlastTier, expressService, galeriPrice)
    const voucherTotals = calcVoucherTotals({
      terms: voucherTerms,
      storedDiscount: storedVoucherDiscount,
      frozen: !!activeRedemption?.frozen_at || (wp as any)?.payment_status !== "UNPAID",
      packageType: package_type,
      parts,
    })
    const voucherDiscount = voucherTotals.discount
    const total = voucherTotals.total

    // Galeri columns are written whenever the effective config differs —
    // a package change can clear carried values with galeri untouched.
    const storedGaleriKey = (wp as any)?.galeri_addon
      ? `1:${(wp as any).galeri_photos_per_guest}:${(wp as any).galeri_guest_count}:${(wp as any).galeri_tier}:${(wp as any).galeri_price || 0}`
      : "0"
    const effGaleriKey = effGaleri
      ? `1:${effGaleri.photos_per_guest}:${effGaleri.guest_count}:${effGaleri.tier}:${galeriPrice}`
      : "0"
    const galeriChanged = galeriTouched || storedGaleriKey !== effGaleriKey

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({
        package_type: package_type,
        wa_blast_tier: waBlastTier,
        express_service: expressService,
        total_project_cost: total,
        voucher_discount: voucherDiscount,
        ...(galeriChanged
          ? {
              galeri_addon: !!effGaleri,
              galeri_photos_per_guest: effGaleri?.photos_per_guest || null,
              galeri_guest_count: effGaleri?.guest_count || null,
              galeri_tier: effGaleri?.tier || null,
              galeri_price: galeriPrice,
            }
          : {}),
        // Saving the galeri add-on resolves any couple-staged top-up request
        // (the new add-on IS the applied change) — clear the staging fields so
        // the request banner does not linger.
        ...(galeriTouched
          ? {
              additional_cost: 0,
              additional_tier: null,
              additional_payment_status: "UNPAID",
              galeri_topup_photos_per_guest: null,
              galeri_topup_guest_count: null,
              galeri_prev_photos: null,
              galeri_prev_guests: null,
              galeri_prev_tier: null,
              galeri_prev_price: null,
            }
          : {}),
      })
      .eq("id", wp.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Rebuild feature_actions to match the new package, preserving the
    // completion status of features present in both old and new packages.
    // A mid-pipeline package change must not wipe already-finished work.
    const selections = await getSelections(package_type, undanganFisik, galeriAddon)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    const { data: prevFeatures } = await supabaseAdmin
      .from("feature_actions")
      .select("feature_key, status")
      .eq("ops_queue_id", id)
    const prevStatus = new Map(
      (prevFeatures || []).map((f: any) => [f.feature_key, f.status]),
    )

    await supabaseAdmin.from("feature_actions").delete().eq("ops_queue_id", id)

    if (enabledFeatures.length > 0) {
      const featureRows = enabledFeatures.map((key) => ({
        ops_queue_id: id,
        wedding_profile_id: wp.id,
        feature_key: key,
        status: (prevStatus.get(key) as string) || "butuh_tindakan",
      }))
      await supabaseAdmin.from("feature_actions").insert(featureRows)
    }

    // Audit trail: package AND add-on changes in the unified timeline.
    const logBase = {
      ops_queue_id: id,
      kind: "package",
      previous_status: null,
      new_status: null,
      changed_by_employee_id: auth.employee.id,
    }
    if (previousPackage !== package_type) {
      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ...logBase,
        previous_package: previousPackage,
        new_package: package_type,
      })
      if (logError) {
        console.error("[ops/package] audit log insert failed", logError.message)
      }
    }

    // Add-on changes (WA Blast tier, Express, Galeri Tamu) get their own
    // kind="addon" rows: a package row for an add-on-only change would read
    // "Paket: X → X" and hide what actually happened. Explicit field intent
    // is required so a package change's auto-drop isn't double-logged here
    // (that path writes its own removal entry below).
    const addonChanges: string[] = []
    const prevWaTier = Number((wp as any)?.wa_blast_tier) || 0
    const prevExpress = (wp as any)?.express_service === true
    const prevGaleriOn = (wp as any)?.galeri_addon === true

    if (body?.wa_blast_tier !== undefined && waBlastTier !== prevWaTier) {
      addonChanges.push(
        waBlastTier > 0
          ? prevWaTier > 0
            ? `WA Blast kuota: ${prevWaTier} → ${waBlastTier}`
            : `WA Blast ditambahkan: ${waBlastTier} kuota`
          : `WA Blast dilepas`,
      )
    }
    if (body?.express_service !== undefined && expressService !== prevExpress) {
      addonChanges.push(`Express ${expressService ? "diaktifkan" : "dinonaktifkan"}`)
    }
    if (galeriTouched && galeriChanged) {
      const prevGaleriTier = (wp as any)?.galeri_tier || null
      const prevGaleriPhotos = (wp as any)?.galeri_photos_per_guest ?? null
      const prevGaleriGuests = (wp as any)?.galeri_guest_count ?? null
      const galeriSame =
        prevGaleriTier === (effGaleri?.tier || null) &&
        prevGaleriPhotos === (effGaleri?.photos_per_guest ?? null) &&
        prevGaleriGuests === (effGaleri?.guest_count ?? null)
      if (galeriAddon && !prevGaleriOn) {
        addonChanges.push(`Galeri Tamu ditambahkan: ${effGaleri?.tier} (${effGaleri?.photos_per_guest} foto × ${effGaleri?.guest_count} tamu)`)
      } else if (galeriAddon && prevGaleriOn && !galeriSame) {
        addonChanges.push(`Galeri Tamu: ${effGaleri?.tier} (${effGaleri?.photos_per_guest} foto × ${effGaleri?.guest_count} tamu)`)
      } else if (!galeriAddon && prevGaleriOn) {
        addonChanges.push(`Galeri Tamu dilepas`)
      }
    }
    if (addonChanges.length > 0) {
      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "addon",
        previous_status: null,
        new_status: null,
        previous_package: previousPackage,
        new_package: package_type,
        details: addonChanges.join("; "),
        changed_by_employee_id: auth.employee.id,
      })
      if (logError) {
        console.error("[ops/package] addon audit log insert failed", logError.message)
      }
    }
    if (autoDropped.length > 0) {
      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "addon",
        previous_status: null,
        new_status: null,
        previous_package: previousPackage,
        new_package: package_type,
        details: autoDropped.join("; "),
        changed_by_employee_id: auth.employee.id,
      })
      if (logError) {
        console.error("[ops/package] auto-drop audit log insert failed", logError.message)
      }
    }

    return NextResponse.json({ success: true, package_type: package_type, total_project_cost: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}