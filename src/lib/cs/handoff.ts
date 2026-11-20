// Satu percakapan punya satu pemilik. `status` adalah sumber kebenarannya:
//
//   bot    → AI bebas membalas
//   human  → AI diam (diambil alih tim, atau tim membalas dari WhatsApp)
//   closed → percakapan selesai
//
// `ai_paused_until` menyimpan batas waktu jeda:
//  - Balasan manusia (dari HP CS maupun /ops/cs) → jeda OTOMATIS 10 menit,
//    direset setiap balasan manusia berikutnya.
//  - Toggle "AI dijeda" dan claim → null, artinya SENGAJA permanen supaya bot
//    tidak bangun sendiri di tengah percakapan yang sedang ditangani tim.
//  - Eskalasi otomatis → 4 jam.
//
// Jeda yang lebih lama selalu menang: satu balasan manusia tidak boleh
// memperpendek eskalasi 4 jam yang sedang berjalan.

export interface OwnerRow {
  status?: string | null
  ai_paused_until?: string | null
}

export const DEFAULT_HUMAN_COOLDOWN_MIN = 10

export function humanCooldownMinutes(env: NodeJS.ProcessEnv = process.env): number {
  const value = Number(env.CS_HUMAN_COOLDOWN_MIN || DEFAULT_HUMAN_COOLDOWN_MIN)
  if (!Number.isFinite(value) || value <= 0) return DEFAULT_HUMAN_COOLDOWN_MIN
  return Math.min(Math.round(value), 24 * 60)
}

export function humanCooldownUntil(now = Date.now(), minutes = humanCooldownMinutes()): string {
  return new Date(now + minutes * 60_000).toISOString()
}

/**
 * Batas jeda setelah balasan manusia: 10 menit dari sekarang, kecuali sudah ada
 * jeda yang lebih panjang (mis. eskalasi 4 jam) — yang lebih lama dipertahankan.
 */
export function nextPauseUntil(
  current: string | null | undefined,
  now = Date.now(),
  minutes = humanCooldownMinutes()
): string {
  const cooldown = humanCooldownUntil(now, minutes)
  if (!current) return cooldown
  const currentMs = new Date(current).getTime()
  if (!Number.isFinite(currentMs)) return cooldown
  return currentMs > now + minutes * 60_000 ? current : cooldown
}

export function aiPaused(row: OwnerRow | null | undefined, now = Date.now()): boolean {
  if (!row) return false
  if (row.status !== "human") return false
  if (!row.ai_paused_until) return true
  return new Date(row.ai_paused_until).getTime() > now
}

// Jeda otomatis yang sudah kedaluwarsa: status dikembalikan ke bot.
export function shouldAutoResume(row: OwnerRow | null | undefined, now = Date.now()): boolean {
  if (!row || row.status !== "human" || !row.ai_paused_until) return false
  return new Date(row.ai_paused_until).getTime() <= now
}
