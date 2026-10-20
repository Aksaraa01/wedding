import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { parseVoucherCreateInput } from "@/lib/voucherInput"

const VOUCHER_FIELDS =
  "id, code, title, description, discount_type, amount, percent, max_discount, include_wa_blast, include_express, include_galeri, max_uses, used_count, package_eligibility, is_active, created_by_employee_id, created_at, updated_at"

async function logVoucher(voucherId: string, action: string, details: string, employeeId: string | null) {
  await supabaseAdmin.from("voucher_logs").insert({
    voucher_id: voucherId,
    action,
    details: details.slice(0, 500),
    changed_by_employee_id: employeeId,
  })
}

// GET /api/vouchers — list with usage + recent activity (admin + sales).
export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  const { data, error } = await supabaseAdmin
    .from("vouchers")
    .select(VOUCHER_FIELDS)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: "Gagal memuat voucher." }, { status: 500 })

  const ids = (data || []).map((v: any) => v.id)
  const logsByVoucher: Record<string, any[]> = {}
  if (ids.length > 0) {
    const { data: logs } = await supabaseAdmin
      .from("voucher_logs")
      .select("id, voucher_id, action, details, changed_by_employee_id, created_at")
      .in("voucher_id", ids)
      .order("created_at", { ascending: false })
      .limit(800)
    const empIds = [...new Set(((logs || []) as any[]).map((l) => l.changed_by_employee_id).filter(Boolean))]
    const empNames: Record<string, string> = {}
    if (empIds.length > 0) {
      const { data: emps } = await supabaseAdmin.from("employees").select("id, name").in("id", empIds)
      for (const e of (emps || []) as any[]) empNames[e.id] = e.name
    }
    for (const l of (logs || []) as any[]) {
      const entry = { ...l, changed_by_name: l.changed_by_employee_id ? empNames[l.changed_by_employee_id] || null : null }
      ;(logsByVoucher[l.voucher_id] ||= []).push(entry)
      if (logsByVoucher[l.voucher_id].length > 30) logsByVoucher[l.voucher_id].length = 30
    }
  }

  return NextResponse.json({
    vouchers: (data || []).map((v: any) => ({ ...v, logs: logsByVoucher[v.id] || [] })),
  })
}

// POST /api/vouchers — create with a manually entered code (admin only).
export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!auth.ok) return auth.res

  try {
    const parsed = parseVoucherCreateInput(await req.json().catch(() => null))
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const input = parsed.value

    const { data, error } = await supabaseAdmin
      .from("vouchers")
      .insert({
        code: input.code,
        title: input.title,
        description: input.description,
        discount_type: input.discountType,
        amount: input.discountType === "amount" ? input.amount : 0,
        percent: input.discountType === "percent" ? input.percent : null,
        max_discount: input.discountType === "percent" ? input.maxDiscount : null,
        include_wa_blast: input.includeWaBlast,
        include_express: input.includeExpress,
        include_galeri: input.includeGaleri,
        max_uses: input.maxUses,
        package_eligibility: input.packageEligibility,
        created_by_employee_id: auth.employee.id,
      })
      .select(VOUCHER_FIELDS)
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Kode voucher sudah digunakan." }, { status: 409 })
      }
      return NextResponse.json({ error: "Gagal membuat voucher." }, { status: 500 })
    }

    const discountLabel =
      input.discountType === "percent"
        ? `${input.percent}%${input.maxDiscount ? ` (maks ${input.maxDiscount})` : ""}`
        : `${input.amount}`
    await logVoucher(
      data.id,
      "created",
      `${input.title} • potongan ${discountLabel} • kuota ${input.maxUses} • paket: ${input.packageEligibility.length > 0 ? input.packageEligibility.join(", ") : "semua"}`,
      auth.employee.id,
    )
    return NextResponse.json({ voucher: data })
  } catch {
    return NextResponse.json({ error: "Gagal membuat voucher." }, { status: 500 })
  }
}
