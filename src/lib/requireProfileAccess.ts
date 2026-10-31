import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { COUPLE_COOKIE, OPS_COOKIE, getSessionToken, verifySession } from "@/lib/sessionToken"
import { extractScannerJwt, verifyScannerJwt } from "@/lib/scannerJwt"

type Options = {
  /**
   * Accept a scanner kiosk JWT for this profile in addition to a couple/ops
   * session. Only for read routes the kiosk needs (qr-guestbook), which are
   * otherwise session-gated.
   */
  allowScanner?: boolean
}

export async function requireProfileAccess(
  req: Request,
  profileId: string,
  options: Options = {},
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

  if (options.allowScanner) {
    const token = extractScannerJwt(req)
    if (token) {
      const scanner = await verifyScannerJwt(token)
      if (scanner?.weddingProfileId === profileId) return null
    }
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
