// Katalog yang boleh dilihat pelanggan. Paket bonus/cetak adalah hadiah
// internal, bukan produk yang bisa dipilih atau ditanyakan.

const BONUS_PACKAGE_CODES = new Set(["bonus_full_custom", "cetak_undangan_bonus"])
const HIDDEN_FEATURES = new Set(["undangan_fisik"])

export function isSellablePackage(code: string): boolean {
  return !!code && !BONUS_PACKAGE_CODES.has(code)
}

export function isCustomerFeature(code: string): boolean {
  return !!code && !HIDDEN_FEATURES.has(code)
}
