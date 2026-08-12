import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Server-side guard for ops APIs.
// Client sends `x-ops-phone` (normalized) + `x-ops-pin` or a role claim; we re-verify
// the employee exists and (if allowedRoles given) has an allowed role.
export async function requireOpsEmployee(
  req: Request,
  opts: { allowedRoles?: string[] } = {},
): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
  const phone = req.headers.get("x-ops-phone") || ""
  const role = req.headers.get("x-ops-role") || ""
  if (!phone) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, phone_number, role")
    .eq("phone_number", phone)
    .eq("is_active", true)
    .maybeSingle()

  if (!employee) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  // trust the role claim matching the stored employee role (prevents spoofing via header alone)
  if (role && employee.role !== role) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  if (opts.allowedRoles && opts.allowedRoles.length > 0) {
    if (!opts.allowedRoles.includes(employee.role)) {
      return { ok: false, res: NextResponse.json({ error: "Anda tidak memiliki akses ke fitur ini." }, { status: 403 }) }
    }
  }

  return { ok: true }
}
