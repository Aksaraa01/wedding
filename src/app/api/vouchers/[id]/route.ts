import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { PACKAGE_CODES } from "@/lib/packages"

function cleanEligibility(v: unknown): string[] | null {
  if (v === undefined) return null
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

function describeChange(field: string, from: unknown, to: unknown): string {
  const fmt = (v: unknown) => (Array.isArray(v) ? (v.length > 0 ? v.join(", ") : "semua") : String(v ?? "—"))
  return `${field}: ${fmt(from)} → ${fmt(to)}`
}

// PATCH /api/vouchers/[id] — edit amount/cap/eligibility/active (admin only).
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const body = await req.json().catch(() => null)

    const { data: current } = await supabaseAdmin
      .from("vouchers")
      .select("id, code, amount, max_uses, used_count, package_eligibility, is_active")
      .eq("id", id)
      .maybeSingle()
    if (!current) return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 })

    const patch: Record<string, any> = {}
    const changes: string[] = []
    if (body?.amount !== undefined) {
      const amount = Math.max(0, Math.floor(Number(body.amount) || 0))
      if (amount !== current.amount) {
        patch.amount = amount
        changes.push(describeChange("potongan", current.amount, amount))
      }
    }
    if (body?.max_uses !== undefined) {
      const maxUses = Math.max(1, Math.floor(Number(body.max_uses) || 1))
      if (maxUses < (current.used_count || 0)) {
        return NextResponse.json({ error: `Kuota tidak boleh di bawah jumlah terpakai (${current.used_count}).` }, { status: 400 })
      }
      if (maxUses !== current.max_uses) {
        patch.max_uses = maxUses
        changes.push(describeChange("kuota", current.max_uses, maxUses))
      }
    }
    const eligibility = cleanEligibility(body?.package_eligibility)
    if (eligibility !== null) {
      const cur = Array.isArray(current.package_eligibility) ? [...current.package_eligibility].sort() : []
      if (JSON.stringify([...eligibility].sort()) !== JSON.stringify(cur)) {
        patch.package_eligibility = eligibility
        changes.push(describeChange("paket", cur, eligibility))
      }
    }
    if (typeof body?.is_active === "boolean" && body.is_active !== current.is_active) {
      patch.is_active = body.is_active
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ voucher: current })
    }
    patch.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("vouchers")
      .update(patch)
      .eq("id", id)
      .select("id, code, amount, max_uses, used_count, package_eligibility, is_active, created_at, updated_at")
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (typeof patch.is_active === "boolean") {
      await logVoucher(id, patch.is_active ? "activated" : "deactivated", patch.is_active ? "diaktifkan" : "dinonaktifkan", req)
    }
    if (changes.length > 0) {
      await logVoucher(id, "updated", changes.join(" • "), req)
    }
    return NextResponse.json({ voucher: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
