export const VOUCHER_ERRORS: Record<string, string> = {
  invalid: "Kode voucher tidak valid.",
  inactive: "Voucher ini sudah dinonaktifkan.",
  exhausted: "Kuota voucher ini sudah habis.",
  ineligible: "Voucher ini tidak berlaku untuk paket yang dipilih.",
  already_used: "Voucher ini sudah digunakan.",
  same_voucher: "Kode sama dengan voucher yang sudah dipakai.",
  zero_discount: "Voucher tidak menghasilkan potongan untuk pilihan ini.",
  paid_profile: "Voucher tidak dapat diubah setelah pembayaran.",
  profile_not_found: "Profil tidak ditemukan.",
  not_found: "Voucher aktif tidak ditemukan.",
}

export function voucherErrorMessage(key: string, fallback = "Voucher tidak dapat digunakan."): string {
  return VOUCHER_ERRORS[(key || "").trim()] || fallback
}
