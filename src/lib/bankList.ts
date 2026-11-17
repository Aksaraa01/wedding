// Reference list of Indonesian banks & e-wallets used by the amplifier-digital
// (Rekening Hadiah) editor. Logo SVGs are seeded into Supabase Storage under
// `media/seeded/bank-logos/{slug}.png` — see supabase/seed or the ops seeding
// script. `provider_logo_url` on gift_accounts stores the selected logo.

export type BankType = "bank" | "ewallet"

export type BankInfo = {
  slug: string
  name: string
  type: BankType
}

export const BANKS: BankInfo[] = [
  // Banks
  { slug: "bca", name: "Bank Central Asia (BCA)", type: "bank" },
  { slug: "mandiri", name: "Bank Mandiri", type: "bank" },
  { slug: "bni", name: "Bank Negara Indonesia (BNI)", type: "bank" },
  { slug: "bri", name: "Bank Rakyat Indonesia (BRI)", type: "bank" },
  { slug: "bsi", name: "Bank Syariah Indonesia (BSI)", type: "bank" },
  { slug: "btn", name: "Bank Tabungan Negara (BTN)", type: "bank" },
  { slug: "cimb-niaga", name: "Bank CIMB Niaga", type: "bank" },
  { slug: "permata", name: "Bank Permata", type: "bank" },
  { slug: "danamon", name: "Bank Danamon", type: "bank" },
  { slug: "ocbc-nisp", name: "Bank OCBC NISP", type: "bank" },
  { slug: "uob", name: "Bank UOB Indonesia", type: "bank" },
  { slug: "maybank", name: "Bank Maybank Indonesia", type: "bank" },
  { slug: "hsbc", name: "HSBC Indonesia", type: "bank" },
  { slug: "standard-chartered", name: "Standard Chartered Indonesia", type: "bank" },
  { slug: "paninbank", name: "Bank Pan Indonesia (Panin)", type: "bank" },
  { slug: "mega", name: "Bank Mega", type: "bank" },
  { slug: "muamalat", name: "Bank Muamalat", type: "bank" },
  { slug: "jago", name: "Bank Jago", type: "bank" },
  { slug: "seabank", name: "SeaBank Indonesia", type: "bank" },
  { slug: "bank-sumut", name: "Bank Sumut", type: "bank" },
  // E-wallets
  { slug: "gopay", name: "GoPay", type: "ewallet" },
  { slug: "ovo", name: "OVO", type: "ewallet" },
  { slug: "dana", name: "DANA", type: "ewallet" },
  { slug: "shopeepay", name: "ShopeePay", type: "ewallet" },
  { slug: "linkaja", name: "LinkAja", type: "ewallet" },
]

export function getBankBySlug(slug: string): BankInfo | undefined {
  return BANKS.find((b) => b.slug === slug)
}

// Lookup by the stored display name (legacy rows may store free text).
export function getBankByName(name: string): BankInfo | undefined {
  const n = (name || "").toLowerCase().trim()
  if (!n) return undefined
  const exactName = BANKS.find((b) => b.name.toLowerCase() === n)
  if (exactName) return exactName
  const exactSlug = BANKS.find((b) => b.slug === n)
  if (exactSlug) return exactSlug
  return BANKS.find(
    (b) =>
      b.name.toLowerCase().includes(n) ||
      n.includes(b.name.toLowerCase()) ||
      n.includes(b.slug)
  )
}

export function bankLogoPath(slug: string): string {
  return `bank-logos/${slug}.png`
}

const STORAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ""}/storage/v1/object/public/media/seeded`

// Full seeded image URL for a bank slug. Runtime-safe (no storage call).
export function bankLogoUrl(slug: string): string {
  return `${STORAGE_BASE}/${bankLogoPath(slug)}`
}

// Resolve a logo URL from a provider name/slug (handles legacy free-text rows).
export function resolveBankLogo(name: string): string {
  const bySlug = getBankBySlug(name)
  if (bySlug) return bankLogoUrl(bySlug.slug)
  const byName = getBankByName(name)
  if (byName) return bankLogoUrl(byName.slug)
  return ""
}
