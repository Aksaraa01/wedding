export type VoucherIncludeFlags = {
  waBlast: boolean
  express: boolean
  galeri: boolean
}

export type VoucherTerms =
  | {
      type: "amount"
      amount: number
      includes: VoucherIncludeFlags
      eligiblePackages: string[]
    }
  | {
      type: "percent"
      percent: number
      maxDiscount: number | null
      includes: VoucherIncludeFlags
      eligiblePackages: string[]
    }

export type VoucherBaseParts = {
  base: number
  waBlast: number
  express: number
  galeri: number
}

export type VoucherTotals = {
  totalBase: number
  discountBase: number
  discount: number
  total: number
  eligible: boolean
}

function int(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function includesFrom(raw: Record<string, unknown> | null | undefined): VoucherIncludeFlags {
  return {
    waBlast: raw?.include_wa_blast !== false,
    express: raw?.include_express !== false,
    galeri: raw?.include_galeri !== false,
  }
}

function packagesFrom(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  for (const value of raw) {
    if (typeof value === "string" && value.trim()) seen.add(value.trim())
  }
  return [...seen]
}

export function parseVoucherTerms(raw: unknown): VoucherTerms | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const row = raw as Record<string, unknown>
  const includes = includesFrom(row)
  const eligiblePackages = packagesFrom(row.eligible_packages ?? row.eligiblePackages)

  if (row.type === "amount") {
    const amount = int(row.amount)
    return { type: "amount", amount, includes, eligiblePackages }
  }

  if (row.type === "percent") {
    const percent = Math.floor(Number(row.percent))
    if (!Number.isFinite(percent) || percent < 1 || percent > 100) return null
    const maxRaw = row.max_discount ?? row.maxDiscount
    const maxDiscount =
      maxRaw === null || maxRaw === undefined || maxRaw === "" ? null : Math.floor(Number(maxRaw))
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) return null
    return { type: "percent", percent, maxDiscount, includes, eligiblePackages }
  }

  return null
}

export function voucherTermsFromRow(row: {
  discount_type?: unknown
  amount?: unknown
  percent?: unknown
  max_discount?: unknown
  include_wa_blast?: unknown
  include_express?: unknown
  include_galeri?: unknown
  package_eligibility?: unknown
}): VoucherTerms | null {
  return parseVoucherTerms({
    type: row.discount_type,
    amount: row.amount,
    percent: row.percent,
    max_discount: row.max_discount,
    include_wa_blast: row.include_wa_blast,
    include_express: row.include_express,
    include_galeri: row.include_galeri,
    eligible_packages: row.package_eligibility,
  })
}

export function isVoucherEligible(terms: VoucherTerms, packageType: string): boolean {
  return terms.eligiblePackages.length === 0 || terms.eligiblePackages.includes(packageType)
}

function includedBase(parts: VoucherBaseParts, includes: VoucherIncludeFlags, pkg?: string): number {
  return (
    int(parts.base) +
    (includes.waBlast ? int(parts.waBlast) : 0) +
    (includes.express ? int(parts.express) : 0) +
    ((includes.galeri || pkg === "gt") ? int(parts.galeri) : 0)
  )
}

export function voucherTotalBase(parts: VoucherBaseParts): number {
  return int(parts.base) + int(parts.waBlast) + int(parts.express) + int(parts.galeri)
}

export function resolveVoucherDiscount(terms: VoucherTerms, parts: VoucherBaseParts, pkg?: string): number {
  if (terms.type === "amount") return int(terms.amount)
  const base = includedBase(parts, terms.includes, pkg)
  const gross = Math.floor((base * terms.percent) / 100)
  return terms.maxDiscount !== null ? Math.min(gross, int(terms.maxDiscount)) : gross
}

export function resolveAppliedVoucherDiscount(input: {
  terms: VoucherTerms | null
  storedDiscount?: number | null
  frozen?: boolean
  packageType: string
  parts: VoucherBaseParts
}): number {
  const stored = int(input.storedDiscount)
  if (!input.terms) return stored
  if (input.terms.type === "amount") return int(input.terms.amount)
  if (input.frozen) return stored
  if (!isVoucherEligible(input.terms, input.packageType)) return stored
  return resolveVoucherDiscount(input.terms, input.parts, input.packageType)
}

export function calcVoucherTotals(input: {
  terms: VoucherTerms | null
  storedDiscount?: number | null
  frozen?: boolean
  packageType: string
  parts: VoucherBaseParts
}): VoucherTotals {
  const totalBase = voucherTotalBase(input.parts)
  const discount = resolveAppliedVoucherDiscount(input)
  const eligible = input.terms ? isVoucherEligible(input.terms, input.packageType) : true
  return {
    totalBase,
    discountBase: input.terms ? includedBase(input.parts, input.terms.includes, input.packageType) : totalBase,
    discount,
    total: Math.max(0, totalBase - discount),
    eligible,
  }
}
