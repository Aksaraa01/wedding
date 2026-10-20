import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { COUPLE_COOKIE, OPS_COOKIE, getSessionToken, verifySession } from "@/lib/sessionToken"

export async function requireProfileAccess(
  req: Request,
  profileId: string,
): Promise<NextResponse | null> {
  const couple = await verifySession(getSessionToken(req, COUPLE_COOKIE), "couple")
  if (couple?.sub === profileId) return null

  const ops = await verifySession(getSessionToken(req, OPS_COOKIE), "ops")
  if (ops) {
    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("id", ops.sub)
      .eq("is_active", true)
      .maybeSingle()
    if (employee) return null
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
