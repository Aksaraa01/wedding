import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

// Latest check-in selfie for one guest (used by the LED greeting overlay).
export async function GET(req: Request) {
  const rl = checkRateLimit(`led-selfie:${getClientIp(req)}`, 60, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs || 60_000)

  try {
    const { searchParams } = new URL(req.url)
    const guestId = searchParams.get("guest_id")
    if (!guestId) {
      return NextResponse.json({ error: "guest_id diperlukan" }, { status: 400 })
    }

    const { data } = await supabaseAdmin
      .from("guest_photos")
      .select("image_url")
      .eq("guest_id", guestId)
      .eq("source", "selfie")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({ image_url: (data as any)?.image_url || null })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
