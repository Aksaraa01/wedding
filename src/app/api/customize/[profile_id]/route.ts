import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { calcTotal, deriveSelections } from "@/lib/packages"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ profile_id: string }> }
) {
  try {
    const { profile_id } = await params
    const body = await req.json()
    const { package_type, wa_blast_tier, express_service, undangan_fisik } = body

    const total = calcTotal(
      package_type || "signature",
      wa_blast_tier || 0,
      !!express_service
    )

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update({
        package_type: package_type || "signature",
        wa_blast_tier: wa_blast_tier || 0,
        express_service: !!express_service,
        undangan_fisik: !!undangan_fisik,
        total_project_cost: total,
      })
      .eq("id", profile_id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Sync feature_actions to match the new package
    const selections = deriveSelections(package_type || "signature", !!undangan_fisik)
    const enabledFeatures = Object.entries(selections)
      .filter(([, v]) => v)
      .map(([key]) => key)

    const { data: queueData } = await supabaseAdmin
      .from("ops_queue")
      .select("id")
      .eq("wedding_profile_id", profile_id)
      .maybeSingle()

    if (queueData) {
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

      // Reset queue status to pending so OPS knows there's new work
      await supabaseAdmin
        .from("ops_queue")
        .update({ status: "pending" })
        .eq("id", queueData.id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
