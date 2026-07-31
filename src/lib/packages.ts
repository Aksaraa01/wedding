export const PACKAGE_PRICES: Record<string, number> = {
  essential: 249000,
  signature: 399000,
  prestige: 499000,
}

export const WA_TIER_PRICES: Record<number, number> = {
  100: 150000,
  200: 250000,
  300: 300000,
}

export const EXPRESS_FEE = 250000

const PACKAGE_FEATURES: Record<string, string[]> = {
  essential: ["premium_web", "reservation_automation", "kolom_direct_transfer"],
  signature: ["premium_web", "wish_wall", "reservation_automation", "kolom_direct_transfer"],
  prestige: [
    "premium_web", "wish_wall", "reservation_automation",
    "kolom_direct_transfer", "galeri_foto_tamu",
    "qr_code_book", "unique_link_generator", "wa_blast",
  ],
}

export type Selections = {
  premium_web: boolean
  wish_wall: boolean
  reservation_automation: boolean
  kolom_direct_transfer: boolean
  galeri_foto_tamu: boolean
  qr_code_book: boolean
  unique_link_generator: boolean
  undangan_fisik: boolean
  wa_blast: boolean
}

export function deriveSelections(packageType: string, undanganFisik: boolean): Selections {
  const included = PACKAGE_FEATURES[packageType] || []
  return {
    premium_web: included.includes("premium_web"),
    wish_wall: included.includes("wish_wall"),
    reservation_automation: included.includes("reservation_automation"),
    kolom_direct_transfer: included.includes("kolom_direct_transfer"),
    galeri_foto_tamu: included.includes("galeri_foto_tamu"),
    qr_code_book: included.includes("qr_code_book"),
    unique_link_generator: included.includes("unique_link_generator"),
    wa_blast: included.includes("wa_blast"),
    undangan_fisik: undanganFisik,
  }
}

export function calcTotal(
  packageType: string,
  waBlastTier: number,
  expressService: boolean
): number {
  const pkgPrice = PACKAGE_PRICES[packageType] || PACKAGE_PRICES.signature
  const waPrice = waBlastTier ? (WA_TIER_PRICES[waBlastTier] || 0) : 0
  const expressPrice = expressService ? EXPRESS_FEE : 0
  return pkgPrice + waPrice + expressPrice
}

export function normalizePhone(wa: string): string {
  const digits = wa.replace(/\D/g, "").replace(/^0+/, "")
  if (!digits) return ""
  if (digits.startsWith("62")) return `+${digits}`
  return `+62${digits}`
}
