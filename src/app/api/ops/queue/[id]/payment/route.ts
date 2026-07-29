import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { generateUniqueToken } from "@/lib/qr"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { payment_status, total_cost } = await req.json()

    if (!["UNPAID", "PARTIAL_DP", "FULLY_PAID"].includes(payment_status)) {
      return NextResponse.json({ error: "Status pembayaran tidak valid" }, { status: 400 })
    }

    const { data: queueItem, error: queueError } = await supabaseAdmin
      .from("ops_queue")
      .select("wedding_profile_id")
      .eq("id", id)
      .single()

    if (queueError || !queueItem) {
      return NextResponse.json({ error: "Antrian tidak ditemukan" }, { status: 404 })
    }

    const profileId = queueItem.wedding_profile_id

    const { data: oldProfile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("payment_status")
      .eq("id", profileId)
      .single()

    const wasUnpaid = oldProfile?.payment_status === "UNPAID"
    const nowPaid = payment_status !== "UNPAID"

    const updateData: Record<string, any> = { payment_status }
    if (total_cost !== undefined) {
      updateData.total_project_cost = total_cost
    }

    const { error: updateError } = await supabaseAdmin
      .from("wedding_profiles")
      .update(updateData)
      .eq("id", profileId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    let qrGenerated = 0
    if (wasUnpaid && nowPaid) {
      const { data: guests } = await supabaseAdmin
        .from("guests")
        .select("id")
        .eq("wedding_profile_id", profileId)
        .is("qr_token", null)

      if (guests && guests.length > 0) {
        const results = await Promise.all(
          guests.map(async (g: any) => {
            const token = await generateUniqueToken()
            return supabaseAdmin.from("guests").update({ qr_token: token }).eq("id", g.id)
          })
        )

        const allOk = results.every((r) => !r.error)
        if (allOk) {
          qrGenerated = results.length
        }
      }
    }

    return NextResponse.json({
      success: true,
      payment_status,
      qr_generated: qrGenerated,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
