// Verifikasi identitas: hanya pasangan terdaftar yang boleh mengakses data
// profil/tamu, dan nomor yang disebutkan harus sama dengan nomor terdaftar.
//
// Modul murni: tidak menyentuh DB atau WhatsApp, supaya aturannya bisa diuji.

export const CODE_TTL_MS = 5 * 60_000
export const MAX_CODE_ATTEMPTS = 5
export const VERIFY_SESSION_TTL_MS = 24 * 60 * 60_000

// Format kanonik yang dipakai `users.phone_number` / `wedding_profiles.whatsapp_number`.
export function normalizeWhatsApp(input: string): string {
  const digits = (input || "").replace(/\D/g, "").replace(/^0+/, "")
  if (!digits) return ""
  return digits.startsWith("62") ? `+${digits}` : `+62${digits}`
}

// Format JID Baileys: 628xxx@s.whatsapp.net
export function toJid(input: string): string {
  const digits = normalizeWhatsApp(input).replace("+", "")
  return digits ? `${digits}@s.whatsapp.net` : ""
}

export function isGroupJid(jid: string): boolean {
  const value = (jid || "").trim()
  return /@g\.us$/i.test(value) || /@broadcast$/i.test(value) || /^status@/i.test(value)
}

export function fromJid(jid: string): string {
  const value = (jid || "").trim()
  // Grup/broadcast TIDAK PERNAH punya nomor telepon. Tanpa ini, angka grup
  // (120363...) dinormalisasi menjadi +6212036... dan bot bisa membalas grup.
  if (!value || isGroupJid(value)) return ""
  return normalizeWhatsApp(value.split("@")[0])
}

export function samePhone(a: string, b: string): boolean {
  const left = normalizeWhatsApp(a)
  return left !== "" && left === normalizeWhatsApp(b)
}

export function maskPhone(input: string): string {
  const phone = normalizeWhatsApp(input)
  if (!phone) return ""
  if (phone.length <= 9) return phone
  return `${phone.slice(0, 6)}${"*".repeat(phone.length - 9)}${phone.slice(-3)}`
}

export function generateCode(random: () => number = Math.random): string {
  const value = 100000 + Math.floor(random() * 900000)
  return String(value)
}

export type VerifyFailure =
  | "not_registered"
  | "phone_mismatch"
  | "no_code"
  | "expired"
  | "too_many_attempts"

export interface VerifyState {
  registeredPhone: string | null
  claimedPhone: string
  codeIssuedAt: number | null
  attempts: number
  now: number
}

export type VerifyResult = { ok: true } | { ok: false; reason: VerifyFailure }

// Dipakai SEBELUM mengirim kode: nomor yang diklaim harus nomor terdaftar.
export function canRequestCode(state: {
  registeredPhone: string | null
  claimedPhone: string
  attempts: number
}): VerifyResult {
  if (!state.registeredPhone) return { ok: false, reason: "not_registered" }
  if (state.attempts >= MAX_CODE_ATTEMPTS) return { ok: false, reason: "too_many_attempts" }
  if (!samePhone(state.claimedPhone, state.registeredPhone)) {
    return { ok: false, reason: "phone_mismatch" }
  }
  return { ok: true }
}

// Dipakai SETELAH kode dimasukkan.
export function checkVerification(state: VerifyState): VerifyResult {
  if (!state.registeredPhone) return { ok: false, reason: "not_registered" }
  if (!samePhone(state.claimedPhone, state.registeredPhone)) {
    return { ok: false, reason: "phone_mismatch" }
  }
  if (state.attempts >= MAX_CODE_ATTEMPTS) return { ok: false, reason: "too_many_attempts" }
  if (state.codeIssuedAt === null) return { ok: false, reason: "no_code" }
  if (state.now - state.codeIssuedAt > CODE_TTL_MS) return { ok: false, reason: "expired" }
  return { ok: true }
}

// Akses profil butuh tiga hal sekaligus: nomor terdaftar, sesi terverifikasi
// yang belum kedaluwarsa, dan profil yang memang milik nomor itu.
export function canAccessProfile(input: {
  registeredPhone: string | null
  senderPhone: string
  verifiedAt: number | null
  now: number
}): VerifyResult {
  if (!input.registeredPhone) return { ok: false, reason: "not_registered" }
  if (!samePhone(input.senderPhone, input.registeredPhone)) {
    return { ok: false, reason: "phone_mismatch" }
  }
  if (input.verifiedAt === null) return { ok: false, reason: "no_code" }
  if (input.now - input.verifiedAt > VERIFY_SESSION_TTL_MS) {
    return { ok: false, reason: "expired" }
  }
  return { ok: true }
}

export const VERIFY_FAILURE_MESSAGES: Record<VerifyFailure, string> = {
  not_registered:
    "Nomor ini belum terdaftar sebagai klien Aksaraa. Kalau sudah daftar, kirim nomor WhatsApp yang dipakai saat registrasi ya Kak.",
  phone_mismatch:
    "Nomornya belum cocok dengan data pendaftaran. Boleh kirim ulang nomor WhatsApp yang terdaftar ya Kak.",
  no_code: "Aku kirim kode verifikasi dulu ya Kak, cek WhatsApp di nomor terdaftar.",
  expired: "Kodenya sudah kedaluwarsa. Aku kirim kode baru ya Kak.",
  too_many_attempts: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi ya Kak.",
}
