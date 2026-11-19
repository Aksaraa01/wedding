// Satu percakapan punya satu pemilik. `status` adalah sumber kebenarannya:
//
//   bot    → AI bebas membalas
//   human  → AI diam (diambil alih tim, atau tim membalas dari WhatsApp)
//   closed → percakapan selesai
//
// `ai_paused_until` hanya dipakai untuk jeda OTOMATIS (eskalasi): kalau
// terisi dan sudah lewat, AI boleh jalan lagi. Jeda manual (toggle tim /
// balasan dari WhatsApp) sengaja menyimpan null supaya tidak pernah
// "bangun sendiri" di tengah percakapan yang sedang ditangani manusia.

export interface OwnerRow {
  status?: string | null
  ai_paused_until?: string | null
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
