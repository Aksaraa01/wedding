import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"
import { PACKAGE_CODES, PACKAGE_LABELS } from "@/lib/packages"
import { normalizeVoucherCode } from "@/lib/voucherInput"
import { isVoucherEligible, resolveVoucherDiscount, voucherTermsFromRow } from "@/lib/voucherDiscount"

function int(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function invalid(message = "Kode voucher tidak valid.") {
  return NextResponse.json({ ok: false, error: "invalid", message }, { status: 200 })
}

// POST /api/vouchers/validate — check a code without consuming it.
// Body: { code, package_type, base?, wa_blast_price?, express_price?, galeri_price? }.
export async function POST(req: Request) {
  const rl = checkRateLimit(`voucher-validate:${getClientIp(req)}`, 20, 60_000)
  if (!rl.ok) return rateLimited(rl.retryAfterMs!)

  try {
    const body = await req.json().catch(() => null)
    const parsedCode = normalizeVoucherCode(body?.code)
    if (!parsedCode.ok) return invalid()
    const code = parsedCode.value

    const codeRl = checkRateLimit(`voucher-validate-code:${code}`, 10, 60_000)
    if (!codeRl.ok) return rateLimited(codeRl.retryAfterMs!)

    const packageType = typeof body?.package_type === "string" ? body.package_type : ""
    if (packageType && !(PACKAGE_CODES as readonly string[]).includes(packageType)) {
      return NextResponse.json({ ok: false, error: "invalid_package", message: "Paket tidak valid." }, { status: 400 })
    }

    const { data: v } = await supabaseAdmin
      .from("vouchers")
      .select("id, code, discount_type, amount, percent, max_discount, include_wa_blast, include_express, include_galeri, max_uses, used_count, package_eligibility, is_active")
      .eq("code", code)
      .maybeSingle()

    if (!v) return invalid()
    if (!v.is_active) {
      return NextResponse.json({ ok: false, error: "inactive", message: "Voucher ini sudah dinonaktifkan." }, { status: 200 })
    }
    if ((v.used_count || 0) >= (v.max_uses || 0)) {
      return NextResponse.json({ ok: false, error: "exhausted", message: "Kuota voucher ini sudah habis." }, { status: 200 })
    }

    const terms = voucherTermsFromRow(v)
    if (!terms) return invalid()
    const eligible = terms.eligiblePackages
    if (packageType && !isVoucherEligible(terms, packageType)) {
      const names = eligible.map((c) => PACKAGE_LABELS[c] || c).join(", ")
      return NextResponse.json(
        { ok: false, error: "ineligible", message: `Voucher ini hanya berlaku untuk paket: ${names}.`, eligible },
        { status: 200 },
      )
    }

    const hasParts =
      body?.base !== undefined ||
      body?.wa_blast_price !== undefined ||
      body?.express_price !== undefined ||
      body?.galeri_price !== undefined
    const discountPreview = hasParts
      ? resolveVoucherDiscount(terms, {
          base: int(body?.base),
          waBlast: int(body?.wa_blast_price),
          express: int(body?.express_price),
          galeri: int(body?.galeri_price),
        }, packageType)
      : null

    return NextResponse.json({
      ok: true,
      code: v.code,
      amount: terms.type === "amount" ? terms.amount : 0,
      discount_type: terms.type,
      percent: terms.type === "percent" ? terms.percent : null,
      max_discount: terms.type === "percent" ? terms.maxDiscount : null,
      include_wa_blast: terms.includes.waBlast,
      include_express: terms.includes.express,
      include_galeri: terms.includes.galeri,
      discount_preview: discountPreview,
      eligible,
    })
  } catch {
    return NextResponse.json({ error: "Terjadi kesalahan. Silakan coba lagi." }, { status: 500 })
  }
}
