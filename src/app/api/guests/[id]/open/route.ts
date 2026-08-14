import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rl = checkRateLimit(`open:${getClientIp(req)}`, 60, 60_000)
    if (!rl.ok) return rateLimited(rl.retryAfterMs!)

    const { data, error } = await supabaseAdmin
      .from("guests")
      .update({ invitation_opened_at: new Date().toISOString() })
      .eq("id", id)
      .is("invitation_opened_at", null)
      .select("id, invitation_opened_at")
      .maybeSingle()

    // 200 even when already opened (0 rows matched) — the tracker is fire-and-forget.
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guest: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
