import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/packages"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"
import { OPS_COOKIE, OPS_TTL_SECONDS, setSessionCookie, signSession } from "@/lib/sessionToken"

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`ops-login:${ip}`, 10, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs!)

  try {
    const { phone_number, pin } = await req.json()

    if (!phone_number || !pin) {
      return NextResponse.json({ error: "Nomor HP dan PIN harus diisi" }, { status: 400 })
    }

    if (String(pin).length !== 6) {
      return NextResponse.json({ error: "PIN harus 6 digit" }, { status: 400 })
    }

    const normalized = normalizePhone(phone_number)
    const phoneRl = checkRateLimit(`ops-login-phone:${normalized}`, 5, 60_000)
    if (!phoneRl.ok) return rateLimited(phoneRl.retryAfterMs!)

    const { data: employee } = await supabaseAdmin
      .from("employees")
      .select("id, name, phone_number, role")
      .eq("phone_number", normalized)
      .eq("pin", String(pin))
      .eq("is_active", true)
      .maybeSingle()

    if (!employee) {
      return NextResponse.json({ error: "Kredensial tidak valid" }, { status: 401 })
    }

    const token = await signSession(
      { sub: employee.id, scope: "ops", role: employee.role },
      OPS_TTL_SECONDS,
    )
    const res = NextResponse.json({ employee })
    setSessionCookie(res, OPS_COOKIE, token, OPS_TTL_SECONDS)
    return res
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
  }
}
