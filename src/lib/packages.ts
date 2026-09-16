export const PACKAGE_PRICES: Record<string, number> = {
  cetak_undangan_bonus: 100000,
  bonus_full_custom: 350000,
  essential: 199000,
  signature: 299000,
  prestige: 499000,
  elite: 599000,
  dgb_sistem: 699000,
  dgb_pro: 1699000,
  dgb_premium: 2199000,
  dgb_prestige: 2699000,
}

export const PACKAGE_OLD_PRICES: Record<string, number | null> = {
  cetak_undangan_bonus: null,
  bonus_full_custom: null,
  essential: 299000,
  signature: 450000,
  prestige: 750000,
  elite: 850000,
  dgb_sistem: 999000,
  dgb_pro: 2275000,
  dgb_premium: 2950000,
  dgb_prestige: 3600000,
}

export const PACKAGE_LABELS: Record<string, string> = {
  cetak_undangan_bonus: "BONUS (Cetak Undangan)",
  bonus_full_custom: "BONUS FULL CUSTOM",
  essential: "Essential",
  signature: "Signature",
  prestige: "Prestige",
  elite: "Elite",
  dgb_sistem: "Sistem",
  dgb_pro: "Pro",
  dgb_premium: "Premium",
  dgb_prestige: "Prestige",
}

export const PACKAGE_CODES = [
  "essential",
  "signature",
  "prestige",
  "elite",
  "cetak_undangan_bonus",
  "bonus_full_custom",
  "dgb_sistem",
  "dgb_pro",
  "dgb_premium",
  "dgb_prestige",
] as const

export const PACKAGE_CATEGORY: Record<string, "undangan" | "dgbook"> = {
  essential: "undangan",
  signature: "undangan",
  prestige: "undangan",
  elite: "undangan",
  cetak_undangan_bonus: "undangan",
  bonus_full_custom: "undangan",
  dgb_sistem: "dgbook",
  dgb_pro: "dgbook",
  dgb_premium: "dgbook",
  dgb_prestige: "dgbook",
}

export function getPackageCategory(packageType: string): "Undangan Digital" | "Buku Tamu Digital" {
  return PACKAGE_CATEGORY[packageType] === "undangan" ? "Undangan Digital" : "Buku Tamu Digital"
}

export type PackageCode = (typeof PACKAGE_CODES)[number]

// Packages that ship with the base 100-VIP reminder quota (prestige + elite + all Buku
// Tamu Digital tiers; per matrix "Reminder otomatis ke 100 Customers VIP").
export function hasVipQuotaBase(packageType: string): boolean {
  return packageType === "prestige" || packageType === "elite" || packageType.startsWith("dgb_")
}

export function matrixColumnForPackage(packageType: string, suffix: "value" | "emphasis"): string {
  return `${packageType}_${suffix}`
}

export const WA_TIER_PRICES: Record<number, number> = {
  100: 150000,
  200: 250000,
  300: 300000,
}

export const EXPRESS_FEE = 250000

export const PACKAGE_FEATURES: Record<string, string[]> = {
  essential: ["premium_web", "reservation_automation", "unique_link_generator", "kolom_direct_transfer"],
  signature: ["premium_web", "wish_wall", "reservation_automation", "unique_link_generator", "kolom_direct_transfer"],
  prestige: [
    "premium_web", "wish_wall", "reservation_automation",
    "kolom_direct_transfer", "unique_link_generator", "wa_blast",
  ],
  // BONUS (cetak undangan, assigned via OPS) = Signature-minus.
  cetak_undangan_bonus: [
    "premium_web", "wish_wall", "reservation_automation",
    "unique_link_generator", "kolom_direct_transfer",
  ],
  bonus_full_custom: [
    "premium_web", "wish_wall", "reservation_automation",
    "unique_link_generator", "kolom_direct_transfer",
  ],
  elite: [
    "premium_web", "wish_wall", "reservation_automation",
    "kolom_direct_transfer", "unique_link_generator", "wa_blast",
  ],
  // Buku Tamu Digital tiers carry the full set (prestige + QR book + gallery).
  dgb_sistem: [
    "premium_web", "wish_wall", "reservation_automation",
    "unique_link_generator", "kolom_direct_transfer",
    "galeri_foto_tamu", "qr_code_book", "wa_blast",
  ],
  dgb_pro: [
    "premium_web", "wish_wall", "reservation_automation",
    "unique_link_generator", "kolom_direct_transfer",
    "galeri_foto_tamu", "qr_code_book", "wa_blast",
  ],
  dgb_premium: [
    "premium_web", "wish_wall", "reservation_automation",
    "unique_link_generator", "kolom_direct_transfer",
    "galeri_foto_tamu", "qr_code_book", "wa_blast",
  ],
  dgb_prestige: [
    "premium_web", "wish_wall", "reservation_automation",
    "unique_link_generator", "kolom_direct_transfer",
    "galeri_foto_tamu", "qr_code_book", "wa_blast",
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

export function parseVip(value: unknown): boolean {
  if (value == null) return false
  const s = String(value).trim().toLowerCase()
  return s === "y" || s === "ya" || s === "yes" || s === "true" || s === "1" || s === "✓"
}