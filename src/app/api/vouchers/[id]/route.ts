import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { parseVoucherUpdateInput } from "@/lib/voucherInput"

const VOUCHER_FIELDS =
  "id, code, title, description, discount_type, amount, percent, max_discount, include_wa_blast, include_express, include_galeri, max_uses, used_count, package_eligibility, is_active, created_at, updated_at"

async function logVoucher(voucherId: string, action: string, details: string, employeeId: string | null) {
  await supabaseAdmin.from("voucher_logs").insert({
    voucher_id: voucherId,
    action,
    details: details.slice(0, 500),
    changed_by_employee_id: employeeId,
  })
}

function describeChange(field: string, from: unknown, to: unknown): string {
  const fmt = (v: unknown) => (Array.isArray(v) ? (v.length > 0 ? v.join(", ") : "semua") : String(v ?? "—"))
  return `${field}: ${fmt(from)} → ${fmt(to)}`
}

function discountLabel(type: string, amount: number, percent: number | null, maxDiscount: number | null): string {
  if (type === "percent") return `${percent || 0}%${maxDiscount ? ` (maks ${maxDiscount})` : ""}`
  return String(amount)
}

// PUT /api/vouchers/[id] — edit title/discount/flags/cap/eligibility/active
// (admin only). The code is immutable.
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin"] })
  if (!auth.ok) return auth.res

  try {
    const { id } = await params
    const parsed = parseVoucherUpdateInput(await req.json().catch(() => null))
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const patch = parsed.value

    const { data: current } = await supabaseAdmin
      .from("vouchers")
      .select(VOUCHER_FIELDS)
      .eq("id", id)
      .maybeSingle()
    if (!current) return NextResponse.json({ error: "Voucher tidak ditemukan" }, { status: 404 })

    const update: Record<string, any> = {}
    const changes: string[] = []

    if (patch.title !== undefined && patch.title !== current.title) {
      update.title = patch.title
      changes.push(describeChange("judul", current.title, patch.title))
    }
    if (patch.description !== undefined && patch.description !== current.description) {
      update.description = patch.description
      changes.push("deskripsi diperbarui")
    }

    const discountTouched =
      patch.discountType !== undefined ||
      patch.amount !== undefined ||
      patch.percent !== undefined ||
      patch.maxDiscount !== undefined

    if (discountTouched) {
      const nextType = patch.discountType ?? current.discount_type ?? "amount"
      const nextAmount =
        nextType === "amount"
          ? patch.amount ?? (current.discount_type === "amount" ? current.amount : 0)
          : 0
      const nextPercent =
        nextType === "percent"
          ? patch.percent ?? (current.discount_type === "percent" ? current.percent : null)
          : null
      const nextMax =
        nextType === "percent"
          ? patch.maxDiscount !== undefined
            ? patch.maxDiscount
            : current.discount_type === "percent"
              ? current.max_discount
              : null
          : null

      if (nextType === "amount" && (!nextAmount || nextAmount < 1)) {
        return NextResponse.json({ error: "Potongan wajib diisi minimal 1." }, { status: 400 })
      }
      if (nextType === "percent" && (!nextPercent || nextPercent < 1 || nextPercent > 100)) {
        return NextResponse.json({ error: "Persentase wajib diisi antara 1 dan 100." }, { status: 400 })
      }

      update.discount_type = nextType
      update.amount = nextAmount
      update.percent = nextPercent
      update.max_discount = nextMax
      changes.push(
        describeChange(
          "potongan",
          discountLabel(current.discount_type || "amount", current.amount, current.percent, current.max_discount),
          discountLabel(nextType, nextAmount, nextPercent, nextMax),
        ),
      )
    }

    const booleanFields: Array<[keyof typeof patch, string, string, unknown]> = [
      ["includeWaBlast", "include_wa_blast", "WA Blast", current.include_wa_blast],
      ["includeExpress", "include_express", "Express", current.include_express],
      ["includeGaleri", "include_galeri", "Galeri", current.include_galeri],
    ]
    for (const [inputKey, dbKey, label, currentValue] of booleanFields) {
      const value = patch[inputKey]
      if (typeof value === "boolean" && value !== currentValue) {
        update[dbKey] = value
        changes.push(`${label} ${value ? "termasuk" : "tidak termasuk"}`)
      }
    }

    if (patch.maxUses !== undefined) {
      if (patch.maxUses < (current.used_count || 0)) {
        return NextResponse.json(
          { error: `Kuota tidak boleh di bawah jumlah terpakai (${current.used_count}).` },
          { status: 400 },
        )
      }
      if (patch.maxUses !== current.max_uses) {
        update.max_uses = patch.maxUses
        changes.push(describeChange("kuota", current.max_uses, patch.maxUses))
      }
    }

    if (patch.packageEligibility !== undefined) {
      const cur = Array.isArray(current.package_eligibility) ? [...current.package_eligibility].sort() : []
      if (JSON.stringify([...patch.packageEligibility].sort()) !== JSON.stringify(cur)) {
        update.package_eligibility = patch.packageEligibility
        changes.push(describeChange("paket", cur, patch.packageEligibility))
      }
    }

    if (patch.isActive !== undefined && patch.isActive !== current.is_active) {
      update.is_active = patch.isActive
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ voucher: current })
    }
    update.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from("vouchers")
      .update(update)
      .eq("id", id)
      .select(VOUCHER_FIELDS)
      .single()

    if (error) {
      if (error.code === "23514") {
        return NextResponse.json({ error: "Pengaturan potongan voucher tidak valid." }, { status: 400 })
      }
      return NextResponse.json({ error: "Gagal menyimpan voucher." }, { status: 500 })
    }

    if (typeof update.is_active === "boolean") {
      await logVoucher(
        id,
        update.is_active ? "activated" : "deactivated",
        update.is_active ? "diaktifkan" : "dinonaktifkan",
        auth.employee.id,
      )
    }
    if (changes.length > 0) {
      await logVoucher(id, "updated", changes.join(" • "), auth.employee.id)
    }
    return NextResponse.json({ voucher: data })
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan voucher." }, { status: 500 })
  }
}
