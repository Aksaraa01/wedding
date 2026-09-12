import { NextResponse } from "next/server"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"
import { markInvitationOpened } from "@/lib/recordInvitationOpen"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rl = checkRateLimit(`open:${getClientIp(req)}`, 60, 60_000)
    if (!rl.ok) return rateLimited(rl.retryAfterMs!)

    // 200 even when already opened — the tracker is fire-and-forget.
    await markInvitationOpened(id)

    return NextResponse.json({ guest: { id } })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
