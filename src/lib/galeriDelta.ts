// Shared delta math for paid Galeri top-ups (undangan add-on, gt, dgb incremental).
// Every total goes through the same price-book + voucher helpers as every writer.
import { calcTotalWithVoucherBook } from "@/lib/packages"
import { matchGaleriTier, type GaleriTierRow } from "@/lib/packages"
import type { PriceBook } from "@/lib/packages"

export type GaleriDeltaInput = {
  book: PriceBook
  basePackage: string
  waTier: number
  express: boolean
  voucherDiscount: number
  stored: { photos: number; guests: number } | null
  next: { photos: number; guests: number } | null
}

// Returns tier/price for either side (null -> no Galeri). The caller owns
// the package/wa/express snapshot; this only resolves tier and totals.
export function computeGaleriDelta(
  tierRows: GaleriTierRow[],
  input: GaleriDeltaInput,
): { storedTier: string | null; storedPrice: number; storedTotal: number; newTier: string | null; newPrice: number; newTotal: number; delta: number } {
  const storedMatch = input.stored ? matchGaleriTier(tierRows, input.stored.photos, input.stored.guests) : null
  const newMatch = input.next ? matchGaleriTier(tierRows, input.next.photos, input.next.guests) : null
  const storedPrice = storedMatch?.price ?? 0
  const newPrice = newMatch?.price ?? 0
  const storedTotal = calcTotalWithVoucherBook(input.book, input.basePackage, input.waTier, input.express, input.voucherDiscount, storedPrice)
  const newTotal = calcTotalWithVoucherBook(input.book, input.basePackage, input.waTier, input.express, input.voucherDiscount, newPrice)
  const delta = Math.max(0, newTotal - storedTotal)
  return {
    storedTier: storedMatch?.tier ?? null,
    storedPrice,
    storedTotal,
    newTier: newMatch?.tier ?? null,
    newPrice,
    newTotal,
    delta,
  }
}
