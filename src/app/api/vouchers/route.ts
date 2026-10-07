import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { PACKAGE_CODES } from "@/lib/packages"

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function randomCode(prefix = "AKSARAA"): string {
  let s = ""
  // crypto.getRandomValues is available in route runtimes (no Math.random codes).
  const buf = new Uint32Array(6)
  crypto.getRandomValues(buf)
  for (const n of buf) s += CODE_ALPHABET[n % CODE_ALPHABET.length]
  return `${prefix}-${s}`
}

function cleanEligibility(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  const seen = new Set<string>()
  for (const x of v) {
    if (typeof x === "string" && (PACKAGE_CODES as readonly string[]).includes(x)) seen.add(x)
  }
  return [...seen]
}

async function logVoucher(voucherId: string, action: string, details: string, req: Request) {
  const phone = req.headers.get("x-ops-phone") || ""
  const { data: emp } = await supabaseAdmin
    .from("employees")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle()
  await supabaseAdmin.from("voucher_logs").insert({
    voucher_id: voucherId,
    action,
    details: details.slice(0, 500),
    changed_by_employee_id: emp?.id || null,
  })
}

// GET /api/vouchers — list with usage + recent activity (admin + sales).
export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  const { data, error } = await supabaseAdmin
    .from("vouchers")
    .select("id, code, title, description, amount, max_uses, used_count, package_eligibility, is_active, created_by_employee_id, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ids = (data || []).map((v: any) => v.id)
  let logsByVoucher: Record<string, any[]> = {}
  if (ids.length > 0) {
    const { data: logs } = await supabaseAdmin
      .from("voucher_logs")
      .select("id, voucher_id, action, details, changed_by_employee_id, created_at")
      .in("voucher_id", ids)
      .order("created_at", { ascending: false })
      .limit(800)
    const empIds = [...new Set(((logs || []) as any[]).map((l) => l.changed_by_employee_id).filter(Boolean))]
    let empNames: Record<string, string> = {}
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

// POST /api/vouchers — generate codes (admin only).
// Body: { amount?, max_uses?, package_eligibility?[] }.
export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!auth.ok) return auth.res

  try {
    const body = await req.json().catch(() => null)
    const title = typeof body?.title === "string" ? body.title.trim() : ""
    if (!title) {
      return NextResponse.json({ error: "Judul voucher wajib diisi." }, { status: 400 })
    }
    const description = typeof body?.description === "string" ? body.description.trim().slice(0, 500) : null
    const amount = Number.isFinite(Number(body?.amount)) ? Math.max(0, Math.floor(Number(body.amount))) : 50000
    const maxUses = Number.isFinite(Number(body?.max_uses)) ? Math.max(1, Math.floor(Number(body.max_uses))) : 100
    const eligibility = cleanEligibility(body?.package_eligibility)

    const phone = req.headers.get("x-ops-phone") || ""
    const { data: emp } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("phone_number", phone)
      .maybeSingle()

    let voucher: any = null
    for (let attempt = 0; attempt < 5; attempt++) {
      const { data, error } = await supabaseAdmin
        .from("vouchers")
        .insert({
          code: randomCode(),
          title,
          description: description || null,
          amount,
          max_uses: maxUses,
          package_eligibility: eligibility,
          created_by_employee_id: emp?.id || null,
        })
        .select("id, code, title, description, amount, max_uses, used_count, package_eligibility, is_active, created_at")
        .single()
      if (!error) {
        voucher = data
        break
      }
      // Unique-code collision (23505): regenerate. Anything else is fatal.
      if (error.code !== "23505") return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!voucher) return NextResponse.json({ error: "Gagal generate kode unik, coba lagi." }, { status: 500 })

    await logVoucher(
      voucher.id,
      "created",
      `${title} • potongan ${voucher.amount} • kuota ${voucher.max_uses} • paket: ${eligibility.length > 0 ? eligibility.join(", ") : "semua"}`,
      req,
    )
    return NextResponse.json({ voucher })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
