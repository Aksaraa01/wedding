import type { EscalationReason, Intent } from "./policy"
import { OUT_OF_SCOPE_REPLY } from "./policy"

const BY_REASON: Record<EscalationReason, string> = {
  human_requested: "Siap Kak, aku sambungkan ke tim ya. Sebentar.",
  complaint:
    "Aduh, maaf banget ya Kak. Ini aku teruskan ke tim biar langsung dicek. Boleh info nama pemesan atau nomor pesanannya?",
  refund:
    "Oke Kak, buat pembatalan aku sambungkan ke tim ya. Boleh info nama pemesan dan nomor pesanannya?",
  reschedule:
    "Oke, buat ubah tanggal aku sambungkan ke tim dulu ya Kak. Tanggal barunya kira-kira kapan?",
  data_change:
    "Buat ubah data undangan, aku sambungkan ke tim ya Kak. Data apa yang mau diganti?",
  voucher:
    "Boleh aku cek dulu ya Kak, biar voucher-nya pasti kepakai. Ini aku teruskan ke tim dulu.",
  discount:
    "Buat penyesuaian harga, aku sambungkan ke tim ya Kak. Lagi lihat paket yang mana?",
  payment:
    "Oke Kak, buat pembayaran aku sambungkan ke tim ya. Boleh info nama pemesan dan nomor pesanannya?",
  sensitive_data: "Bagian itu aku teruskan ke tim ya Kak, biar datanya dicek langsung.",
  low_confidence: "Sebentar ya Kak, aku cek dulu ke tim biar nggak salah info.",
  no_profile: "Aku belum nemu profil yang nyambung ke nomor ini. Aku sambungkan ke tim dulu ya Kak.",
}

export function escalationReply(reason: EscalationReason, _intent?: Intent): string {
  return BY_REASON[reason] || BY_REASON.low_confidence
}

export function verifyRequiredReply(): string {
  return "Boleh sebutkan PIN undangan Kakak (4–6 angka) biar aku pastikan ini benar pemiliknya? Kalau belum punya PIN, balas nomor WhatsApp yang dipakai saat daftar ya."
}

export function verifyCodeSentReply(maskedPhone: string): string {
  return `Kode 6 digit sudah aku kirim ke ${maskedPhone}. Balas di sini ya Kak, berlaku 5 menit.`
}

export function verifyCodeWrongReply(): string {
  return 'Kodenya belum cocok. Coba cek lagi ya Kak, atau balas "kirim ulang" untuk kode baru.'
}

export function verificationSuccessReply(): string {
  return "Sip, sudah terverifikasi. Sekarang aku bisa bantu cek status undangan dan lengkapi datanya."
}

export function notRegisteredReply(): string {
  return "Nomor itu belum terdaftar sebagai klien Aksaraa. Coba nomor yang dipakai saat daftar ya Kak."
}

export function refuseReply(): string {
  return OUT_OF_SCOPE_REPLY
}

export function safeFallbackReply(): string {
  return "Sebentar ya Kak, aku cek dulu ke tim biar nggak salah info."
}

export function optOutReply(): string {
  return "Oke Kak, kami nggak akan kirim pesan lagi. Kalau nanti butuh, tinggal chat sini ya."
}

export function offlineReply(): string {
  return "CS Aksaraa lagi nggak aktif. Pesan Kakak sudah masuk, nanti dibalas tim ya."
}

// Verifikasi dibedakan: PIN hanya masuk akal kalau nomor pengirim sudah
// terdaftar. Kalau belum, tanya nomor yang dipakai saat daftar (lalu OTP).
export function verifyPromptReply(hasProfile: boolean): string {
  return hasProfile
    ? verifyRequiredReply()
    : "Nomor WhatsApp ini belum terdaftar di data kami. Boleh kirim nomor WhatsApp yang dipakai saat daftar? Nanti aku kirim kode verifikasi ke nomor itu."
}

// Konfirmasi identitas: nomor pengirim hanya petunjuk, bukan bukti. Jangan
// pernah menganggap pengirim adalah pemilik akun sebelum dia mengonfirmasi.
export function identityConfirmReply(coupleName: string): string {
  return `Nomor ini terdaftar sebagai *${coupleName}*. Betul ini akun Kakak? Balas "ya" untuk lanjut verifikasi, atau "bukan" kalau ini bukan akun Kakak.`
}

export function identityNotMineReply(): string {
  return "Baik, aku tidak akan menganggap nomor ini sebagai pemilik akun. Kirim nomor WhatsApp yang dipakai saat daftar ya Kak, nanti aku verifikasi ke nomor itu."
}
