// Price source of truth: the packages / product_price_tiers / galeri_tiers
// tables (via getPriceBook server-side or /api/packages/prices client-side).
// This module holds NO money amounts — only codes, labels, bands, and pure
// total math over a caller-supplied PriceBook.
export type PriceBook = {
  base: Record<string, number>
  old: Record<string, number | null>
  waTiers: Record<number, number>
  express: number
}

export function emptyPriceBook(): PriceBook {
  return { base: {}, old: {}, waTiers: {}, express: 0 }
}

export function priceParts(
  book: PriceBook,
  packageType: string,
  waBlastTier: number,
  expressService: boolean,
  galeriPrice = 0
) {
  return {
    base: Math.max(0, Math.floor(book.base[packageType] ?? 0)),
    waBlast: waBlastTier ? Math.max(0, Math.floor(book.waTiers[waBlastTier] ?? 0)) : 0,
    express: expressService ? Math.max(0, Math.floor(book.express)) : 0,
    galeri: Math.max(0, Math.floor(galeriPrice) || 0),
  }
}

export function calcTotalBook(
  book: PriceBook,
  packageType: string,
  waBlastTier: number,
  expressService: boolean,
  galeriPrice = 0
): number {
  const parts = priceParts(book, packageType, waBlastTier, expressService, galeriPrice)
  return parts.base + parts.waBlast + parts.express + parts.galeri
}

// Grand total minus voucher discount (locked at registration, preserved across
// later package/add-on changes). Never negative.
export function calcTotalWithVoucherBook(
  book: PriceBook,
  packageType: string,
  waBlastTier: number,
  expressService: boolean,
  voucherDiscount?: number | null,
  galeriPrice = 0
): number {
  const discount = Math.max(0, Math.floor(Number(voucherDiscount) || 0))
  return Math.max(0, calcTotalBook(book, packageType, waBlastTier, expressService, galeriPrice) - discount)
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
  gt: "Galeri Tamu",
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
  "gt",
] as const

export const DGB_BASE_QUOTA: Record<string, { photos: number; guests: number }> = {
  dgb_sistem: { photos: 2, guests: 200 },
  dgb_pro: { photos: 2, guests: 200 },
  dgb_premium: { photos: 3, guests: 200 },
  dgb_prestige: { photos: 4, guests: 200 },
}

export const PACKAGE_CATEGORY: Record<string, "undangan" | "dgbook" | "galeri"> = {
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
  gt: "galeri",
}

export function getPackageCategory(packageType: string): "Undangan Digital" | "Buku Tamu Digital" | "Galeri Tamu" {
  const cat = PACKAGE_CATEGORY[packageType]
  if (cat === "galeri") return "Galeri Tamu"
  return cat === "undangan" ? "Undangan Digital" : "Buku Tamu Digital"
}

// Group-qualified label for UI + WhatsApp, e.g. "Buku Tamu Digital: Sistem".
// A bare tier name must never appear without its product family. Codes whose
// label already equals their group (gt) collapse to the single name.
export function packageDisplayName(code: string | null | undefined): string {
  const c = (code || "").trim()
  if (!c) return "Paket"
  const label = PACKAGE_LABELS[c] || c
  const cat = PACKAGE_CATEGORY[c] ? getPackageCategory(c) : ""
  if (!cat || cat === label) return label
  return `${cat}: ${label}`
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

// WA tier quantities shipped by the product (100/200/300). Per-tier PRICES
// live in product_price_tiers and arrive via PriceBook.
export const WA_TIERS = [100, 200, 300] as const

// Galeri Tamu slider model (standalone tab + Undangan add-on share it).
// Tiers are fully DB-driven: galeri_tiers rows carry their own name +
// photo/guest bounds + price, matched by range. Renaming rows, adding rows,
// or reshaping bands needs zero code changes.
export type GaleriTierRow = {
  tier: string
  photoMin: number
  photoMax: number
  guestMin: number
  guestMax: number
  price: number
}

// First row whose bounds contain the slider position wins. Null = no tier
// covers this combination (caller must surface it, never invent a price).
export function matchGaleriTier(
  rows: GaleriTierRow[],
  photosPerGuest: number,
  guestCount: number
): GaleriTierRow | null {
  const photos = Math.floor(photosPerGuest)
  const guests = Math.floor(guestCount)
  for (const row of rows || []) {
    if (
      Number.isFinite(row.photoMin) && Number.isFinite(row.photoMax) &&
      Number.isFinite(row.guestMin) && Number.isFinite(row.guestMax) &&
      photos >= row.photoMin && photos <= row.photoMax &&
      guests >= row.guestMin && guests <= row.guestMax
    ) {
      return row
    }
  }
  return null
}

export const GALERI_PHOTO_MIN = 1
export const GALERI_PHOTO_MAX = 10
export const GALERI_GUEST_MIN = 10
export const GALERI_GUEST_MAX = 200
// Absolute per-event photo ceiling regardless of slider math.
export const GALERI_EVENT_CAP_MAX = 2000

export function galeriEventCap(photosPerGuest: number, guestCount: number): number {
  return Math.min(Math.max(1, photosPerGuest) * Math.max(1, guestCount), GALERI_EVENT_CAP_MAX)
}

// Quota fallback for GT rows without a slider config (shouldn't happen —
// registration, customize, and Ops all require one — but the upload path
// must never divide by zero or lock out).
export const GALLERY_DEFAULT_QUOTA = 5
export const GALLERY_DEFAULT_CAP = 500

export function isGalleryPackage(packageType: string): boolean {
  return packageType === "gt"
}

export const PACKAGE_FEATURES: Record<string, string[]> = {
  essential: ["premium_web", "wish_wall", "reservation_automation", "unique_link_generator", "kolom_direct_transfer"],
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
  // Galeri Kenangan Tamu (standalone, single package): event QR + guest
  // gallery only. Slider tiers (galeri_tiers) price it.
  gt: ["galeri_foto_tamu"],
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