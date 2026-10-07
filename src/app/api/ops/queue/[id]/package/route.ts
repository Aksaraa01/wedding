import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { calcTotalWithVoucher, deriveSelections, PACKAGE_CODES } from "@/lib/packages"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req as unknown as Request, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res
  try {
    const { id } = await params
    const { package_type } = await req.json()

    if (!package_type || !PACKAGE_CODES.includes(package_type)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, wedding_profiles!inner (id, package_type, wa_blast_tier, express_service, undangan_fisik, voucher_code, voucher_discount)")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles

    const previousPackage = wp?.package_type || null

    const waBlastTier = wp?.wa_blast_tier || 0
    const expressService = wp?.express_service === true
    const undanganFisik = wp?.undangan_fisik === true

    // Voucher discount earned at signup is preserved across package changes.
    const voucherDiscount = (wp as any)?.voucher_discount || 0
    const total = calcTotalWithVoucher(package_type, waBlastTier, expressService, voucherDiscount)

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({
        package_type,
        total_project_cost: total,
      })
      .eq("id", wp.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Rebuild feature_actions to match the new package, preserving the
    // completion status of features present in both old and new packages.
    // A mid-pipeline package change must not wipe already-finished work.
    const selections = deriveSelections(package_type, undanganFisik)
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

    // Audit trail: record package changes in the unified queue timeline.
    // Same-package saves are a no-op for the log.
    if (previousPackage !== package_type) {
      const phone = req.headers.get("x-ops-phone") || ""
      const { data: emp } = await supabaseAdmin
        .from("employees")
        .select("id")
        .eq("phone_number", phone)
        .maybeSingle()

      const { error: logError } = await supabaseAdmin.from("ops_queue_status_log").insert({
        ops_queue_id: id,
        kind: "package",
        previous_status: null,
        new_status: null,
        previous_package: previousPackage,
        new_package: package_type,
        changed_by_employee_id: emp?.id || null,
      })
      if (logError) {
        console.error("[ops/package] audit log insert failed", logError.message)
      }
    }

    return NextResponse.json({ success: true, package_type, total_project_cost: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}