import { PACKAGE_CODES } from "@/lib/packages"

export type VoucherCreateInput = {
  code: string
  title: string
  description: string | null
  discountType: "amount" | "percent"
  amount: number
  percent: number | null
  maxDiscount: number | null
  includeWaBlast: boolean
  includeExpress: boolean
  includeGaleri: boolean
  maxUses: number
  packageEligibility: string[]
}

export type VoucherUpdateInput = Partial<{
  title: string
  description: string | null
  discountType: "amount" | "percent"
  amount: number
  percent: number | null
  maxDiscount: number | null
  includeWaBlast: boolean
  includeExpress: boolean
  includeGaleri: boolean
  maxUses: number
  packageEligibility: string[]
  isActive: boolean
}>

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string }

function fail<T>(error: string): Parsed<T> {
  return { ok: false, error }
}

export function normalizeVoucherCode(raw: unknown): Parsed<string> {
  if (typeof raw !== "string") return fail("Kode voucher wajib diisi.")
  if (!raw) return fail("Kode voucher wajib diisi.")
  if (/\s/.test(raw)) return fail("Kode tidak boleh mengandung spasi.")
  if (/[\u0000-\u001F\u007F]/.test(raw)) return fail("Kode mengandung karakter yang tidak valid.")
  const code = raw.toUpperCase()
  if (code.length > 64) return fail("Kode maksimal 64 karakter.")
  return { ok: true, value: code }
}

export function parseEligibility(raw: unknown): Parsed<string[]> {
  if (raw === undefined || raw === null) return { ok: true, value: [] }
  if (!Array.isArray(raw)) return fail("Daftar paket tidak valid.")
  const seen = new Set<string>()
  for (const item of raw) {
    if (typeof item !== "string") return fail("Daftar paket tidak valid.")
    const code = item.trim()
    if (!code) continue
    if (!(PACKAGE_CODES as readonly string[]).includes(code)) {
      return fail(`Paket tidak dikenal: ${code}`)
    }
    seen.add(code)
  }
  return { ok: true, value: [...seen] }
}

function parseOptionalInt(raw: unknown, label: string, min: number): Parsed<number | null> {
  if (raw === undefined || raw === null || raw === "") return { ok: true, value: null }
  const n = Number(raw)
  if (!Number.isFinite(n)) return fail(`${label} harus berupa angka.`)
  const value = Math.floor(n)
  if (value < min) return fail(`${label} minimal ${min}.`)
  return { ok: true, value }
}

function parseBool(raw: unknown, fallback: boolean): boolean {
  return typeof raw === "boolean" ? raw : fallback
}

export function parseVoucherCreateInput(body: unknown): Parsed<VoucherCreateInput> {
  if (!body || typeof body !== "object") return fail("Data voucher tidak valid.")
  const row = body as Record<string, unknown>

  const code = normalizeVoucherCode(row.code)
  if (!code.ok) return code

  const title = typeof row.title === "string" ? row.title.trim() : ""
  if (!title) return fail("Judul voucher wajib diisi.")
  if (title.length > 120) return fail("Judul maksimal 120 karakter.")

  const description =
    typeof row.description === "string" && row.description.trim()
      ? row.description.trim().slice(0, 500)
      : null

  const rawType = row.discount_type ?? row.discountType
  if (rawType !== undefined && rawType !== "amount" && rawType !== "percent") {
    return fail("Tipe voucher tidak valid.")
  }
  const discountType: "amount" | "percent" = rawType === "percent" ? "percent" : "amount"

  let amount = 0
  let percent: number | null = null
  let maxDiscount: number | null = null

  if (discountType === "amount") {
    const parsed = parseOptionalInt(row.amount, "Potongan", 1)
    if (!parsed.ok) return parsed
    if (parsed.value === null) return fail("Potongan wajib diisi.")
    amount = parsed.value
  } else {
    const parsedPercent = parseOptionalInt(row.percent, "Persentase", 1)
    if (!parsedPercent.ok) return parsedPercent
    if (parsedPercent.value === null) return fail("Persentase wajib diisi.")
    if (parsedPercent.value > 100) return fail("Persentase maksimal 100.")
    percent = parsedPercent.value

    const parsedMax = parseOptionalInt(row.max_discount ?? row.maxDiscount, "Batas potongan", 1)
    if (!parsedMax.ok) return parsedMax
    maxDiscount = parsedMax.value
  }

  const maxUsesParsed = parseOptionalInt(row.max_uses ?? row.maxUses, "Kuota", 1)
  if (!maxUsesParsed.ok) return maxUsesParsed
  const maxUses = maxUsesParsed.value ?? 100

  const eligibility = parseEligibility(row.package_eligibility ?? row.packageEligibility)
  if (!eligibility.ok) return eligibility

  return {
    ok: true,
    value: {
      code: code.value,
      title,
      description,
      discountType,
      amount,
      percent,
      maxDiscount,
      includeWaBlast: parseBool(row.include_wa_blast ?? row.includeWaBlast, true),
      includeExpress: parseBool(row.include_express ?? row.includeExpress, true),
      includeGaleri: parseBool(row.include_galeri ?? row.includeGaleri, true),
      maxUses,
      packageEligibility: eligibility.value,
    },
  }
}

export function parseVoucherUpdateInput(body: unknown): Parsed<VoucherUpdateInput> {
  if (!body || typeof body !== "object") return fail("Data voucher tidak valid.")
  const row = body as Record<string, unknown>
  if (row.code !== undefined) return fail("Kode voucher tidak dapat diubah.")

  const patch: VoucherUpdateInput = {}

  if (row.title !== undefined) {
    const title = typeof row.title === "string" ? row.title.trim() : ""
    if (!title) return fail("Judul voucher wajib diisi.")
    if (title.length > 120) return fail("Judul maksimal 120 karakter.")
    patch.title = title
  }

  if (row.description !== undefined) {
    patch.description =
      typeof row.description === "string" && row.description.trim()
        ? row.description.trim().slice(0, 500)
        : null
  }

  const rawType = row.discount_type ?? row.discountType
  if (rawType !== undefined) {
    if (rawType !== "amount" && rawType !== "percent") return fail("Tipe voucher tidak valid.")
    patch.discountType = rawType
  }

  if (row.amount !== undefined) {
    const parsed = parseOptionalInt(row.amount, "Potongan", 1)
    if (!parsed.ok) return parsed
    if (parsed.value === null) return fail("Potongan wajib diisi.")
    patch.amount = parsed.value
  }

  if (row.percent !== undefined) {
    const parsed = parseOptionalInt(row.percent, "Persentase", 1)
    if (!parsed.ok) return parsed
    if (parsed.value === null) return fail("Persentase wajib diisi.")
    if (parsed.value > 100) return fail("Persentase maksimal 100.")
    patch.percent = parsed.value
  }

  if (row.max_discount !== undefined || row.maxDiscount !== undefined) {
    const parsed = parseOptionalInt(row.max_discount ?? row.maxDiscount, "Batas potongan", 1)
    if (!parsed.ok) return parsed
    patch.maxDiscount = parsed.value
  }

  if (row.include_wa_blast !== undefined || row.includeWaBlast !== undefined) {
    patch.includeWaBlast = parseBool(row.include_wa_blast ?? row.includeWaBlast, true)
  }
  if (row.include_express !== undefined || row.includeExpress !== undefined) {
    patch.includeExpress = parseBool(row.include_express ?? row.includeExpress, true)
  }
  if (row.include_galeri !== undefined || row.includeGaleri !== undefined) {
    patch.includeGaleri = parseBool(row.include_galeri ?? row.includeGaleri, true)
  }

  if (row.max_uses !== undefined || row.maxUses !== undefined) {
    const parsed = parseOptionalInt(row.max_uses ?? row.maxUses, "Kuota", 1)
    if (!parsed.ok) return parsed
    if (parsed.value === null) return fail("Kuota wajib diisi.")
    patch.maxUses = parsed.value
  }

  if (row.package_eligibility !== undefined || row.packageEligibility !== undefined) {
    const parsed = parseEligibility(row.package_eligibility ?? row.packageEligibility)
    if (!parsed.ok) return parsed
    patch.packageEligibility = parsed.value
  }

  if (row.is_active !== undefined) {
    if (typeof row.is_active !== "boolean") return fail("Status aktif tidak valid.")
    patch.isActive = row.is_active
  }

  return { ok: true, value: patch }
}
