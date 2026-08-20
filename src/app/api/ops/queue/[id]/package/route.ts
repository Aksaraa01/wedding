import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotal, deriveSelections } from "@/lib/packages"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { package_type } = await req.json()

    if (!package_type || !["essential", "signature", "prestige"].includes(package_type)) {
      return NextResponse.json({ error: "Paket tidak valid" }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("id, wedding_profiles!inner (id, wa_blast_tier, express_service, undangan_fisik)")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const wp = Array.isArray(queueItem.wedding_profiles)
      ? queueItem.wedding_profiles[0]
      : queueItem.wedding_profiles

    const waBlastTier = wp?.wa_blast_tier || 0
    const expressService = wp?.express_service === true
    const undanganFisik = wp?.undangan_fisik === true

    const total = calcTotal(package_type, waBlastTier, expressService)

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

    // Rebuild feature_actions to match the new package
    const selections = deriveSelections(package_type, undanganFisik)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    await supabaseAdmin.from("feature_actions").delete().eq("ops_queue_id", id)

    if (enabledFeatures.length > 0) {
      const featureRows = enabledFeatures.map((key) => ({
        ops_queue_id: id,
        wedding_profile_id: wp.id,
        feature_key: key,
        status: "butuh_tindakan",
      }))
      await supabaseAdmin.from("feature_actions").insert(featureRows)
    }

    // Reset queue status so OPS knows there's new work
    await supabaseAdmin
      .from("ops_queue")
      .update({ status: "belum_bayar" })
      .eq("id", id)

    return NextResponse.json({ success: true, package_type, total_project_cost: total })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}