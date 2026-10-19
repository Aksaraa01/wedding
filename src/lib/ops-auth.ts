import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Server-side guard for ops APIs.
// Client sends `x-ops-phone` (normalized) + `x-ops-pin` or a role claim; we re-verify
// the employee exists and (if allowedRoles given) has an allowed role.
export type OpsEmployee = { id: string; name: string | null; role: string }

export async function requireOpsEmployee(
  req: Request,
  opts: { allowedRoles?: string[] } = {},
): Promise<{ ok: true; employee: OpsEmployee } | { ok: false; res: NextResponse }> {
  const phone = req.headers.get("x-ops-phone") || ""
  const role = req.headers.get("x-ops-role") || ""
  const pinHeader = req.headers.get("x-ops-pin") || ""
  if (!phone) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  const { data: employee } = await supabaseAdmin
    .from("employees")
    .select("id, name, phone_number, role, pin")
    .eq("phone_number", phone)
    .eq("is_active", true)
    .maybeSingle()

  if (!employee) {
    return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
  }

  if (pinHeader) {
    const stored = String((employee as any).pin || "")
    if (stored.length !== pinHeader.length || !timingSafeEqual(stored, pinHeader)) {
      return { ok: false, res: NextResponse.json({ error: "Sesi ops tidak valid. Silakan login ulang." }, { status: 401 }) }
    }
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

  return {
    ok: true,
    employee: {
      id: employee.id as string,
      name: (employee as { name?: string | null }).name ?? null,
      role: employee.role as string,
    },
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  let mismatch = a.length === b.length ? 0 : 1
  const len = Math.max(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const ca = a.charCodeAt(i) || 0
    const cb = b.charCodeAt(i) || 0
    mismatch |= ca ^ cb
  }
  return mismatch === 0
}
