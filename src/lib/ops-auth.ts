import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { OPS_COOKIE, getSessionToken, verifySession } from "@/lib/sessionToken"

export type OpsEmployee = { id: string; name: string | null; role: string }

export async function requireOpsEmployee(
  req: Request,
  opts: { allowedRoles?: string[] } = {},
): Promise<{ ok: true; employee: OpsEmployee } | { ok: false; res: NextResponse }> {
  const session = await verifySession(getSessionToken(req, OPS_COOKIE), "ops")
  if (!session) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, name, role")
    .eq("id", session.sub)
    .eq("is_active", true)
    .maybeSingle()

  if (!employee) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  if (opts.allowedRoles && opts.allowedRoles.length > 0) {
    if (!opts.allowedRoles.includes(employee.role)) {
      return { ok: false, res: NextResponse.json({ error: "Anda tidak memiliki akses ke fitur ini." }, { status: 403 }) }
    }
  }

  return {
    ok: true,
    employee: {
      id: employee.id as string,
      name: (employee as { name?: string | null }).name ?? null,
      role: employee.role as string,
    },
  }
}
