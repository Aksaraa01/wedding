import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { calcTotalWithVoucherBook, PACKAGE_CODES } from "@/lib/packages"
import { getPriceBook } from "@/lib/priceBook"
import { normalizeGaleriConfig } from "@/lib/gallery"
import { sanitizeAddonsForPackage } from "@/lib/packageRules"
import { getSelections } from "@/lib/featureGates"

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
      .select("id, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, undangan_fisik, voucher_code, voucher_discount, galeri_addon, galeri_photos_per_guest, galeri_guest_count, galeri_tier, galeri_price)")
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

    // Voucher discount earned at signup is preserved across package changes.
    const voucherDiscount = (wp as any)?.voucher_discount || 0
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
    const total = calcTotalWithVoucherBook(book, package_type, waBlastTier, expressService, voucherDiscount, galeriPrice)

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
        ...(galeriChanged
          ? {
              galeri_addon: !!effGaleri,
              galeri_photos_per_guest: effGaleri?.photos_per_guest || null,
              galeri_guest_count: effGaleri?.guest_count || null,
              galeri_tier: effGaleri?.tier || null,
              galeri_price: galeriPrice,
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

    // Audit trail: record package AND add-on changes in the unified timeline.
    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle()

    const logBase = {
      ops_queue_id: id,
      kind: "package",
      previous_status: null,
      new_status: null,
      changed_by_employee_id: emp?.id || null,
    }
    const prevGaleriPrice = (wp as any)?.galeri_price || 0
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
    if (galeriTouched && galeriPrice !== prevGaleriPrice) {
      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ...logBase,
        previous_package: previousPackage,
        new_package: package_type,
        details:
          galeriPrice > 0
            ? `Add-on Galeri Tamu: Tier ${effGaleri?.tier} (${effGaleri?.photos_per_guest} foto × ${effGaleri?.guest_count} tamu)`
            : `Add-on Galeri Tamu dilepas`,
      })
      if (logError) {
        console.error("[ops/package] addon audit log insert failed", logError.message)
      }
    }
    if (autoDropped.length > 0) {
      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ...logBase,
        previous_package: previousPackage,
        new_package: package_type,
        details: autoDropped.join("; "),
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