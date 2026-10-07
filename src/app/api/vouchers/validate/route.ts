import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"
import { PACKAGE_CODES, PACKAGE_LABELS } from "@/lib/packages"

function eligibilityList(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x): x is string => typeof x === "string" && (PACKAGE_CODES as readonly string[]).includes(x))
}

// POST /api/vouchers/validate — check a code without consuming it.
// Body: { code, package_type }. Rate-limited: codes must not be brute-forced.
export async function POST(req: Request) {
  const rl = checkRateLimit(`voucher-validate:${getClientIp(req)}`, 20, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs!)

  try {
    const body = await req.json().catch(() => null)
    const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : ""
    const packageType = typeof body?.package_type === "string" ? body.package_type : ""

    if (!code) {
      return NextResponse.json({ ok: false, error: "invalid", message: "Kode voucher tidak valid." }, { status: 200 })
    }

    const { data: v } = await supabaseAdmin
      .from("vouchers")
      .select("code, amount, max_uses, used_count, package_eligibility, is_active")
      .eq("code", code)
      .maybeSingle()

    if (!v) {
      return NextResponse.json({ ok: false, error: "invalid", message: "Kode voucher tidak valid." }, { status: 200 })
    }
    if (!v.is_active) {
      return NextResponse.json({ ok: false, error: "inactive", message: "Voucher ini sudah dinonaktifkan." }, { status: 200 })
    }
    if ((v.used_count || 0) >= (v.max_uses || 0)) {
      return NextResponse.json({ ok: false, error: "exhausted", message: "Kuota voucher ini sudah habis." }, { status: 200 })
    }
    const eligible = eligibilityList(v.package_eligibility)
    if (packageType && eligible.length > 0 && !eligible.includes(packageType)) {
      const names = eligible.map((c) => PACKAGE_LABELS[c] || c).join(", ")
      return NextResponse.json({ ok: false, error: "ineligible", message: `Voucher ini hanya berlaku untuk paket: ${names}.`, eligible }, { status: 200 })
    }

    return NextResponse.json({ ok: true, code: v.code, amount: v.amount, eligible })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
