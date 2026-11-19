// Bagian murni modul re-engage (tanpa DB) supaya bisa diuji tanpa Supabase.
// Worker-nya ada di src/lib/cs/reengage.ts.

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000

export interface ReengageSettings {
  enabled: boolean
  dryRun: boolean
  days: number
  dailyCap: number
  quietStart: number
  quietEnd: number
}

export function reengageSettings(env: NodeJS.ProcessEnv = process.env): ReengageSettings {
  return {
    enabled: env.CS_REENGAGE_ENABLED === "1",
    // Aman secara default: hitung saja, jangan kirim.
    dryRun: env.CS_REENGAGE_DRY_RUN !== "0",
    days: Math.max(1, Number(env.CS_REENGAGE_DAYS || 3)),
    dailyCap: Math.max(1, Number(env.CS_REENGAGE_DAILY_CAP || 25)),
    quietStart: 9,
    quietEnd: 20,
  }
}

export function wibHour(now: number): number {
  return new Date(now + WIB_OFFSET_MS).getUTCHours()
}

export function withinQuietWindow(settings: ReengageSettings, now = Date.now()): boolean {
  const hour = wibHour(now)
  return hour >= settings.quietStart && hour < settings.quietEnd
}

export interface ReengageCandidate {
  contactId: string
  conversationId: string
  name: string | null
  phone: string | null
  waJid: string | null
  couple: string | null
  daysSilent: number
}

export function reengageMessage(candidate: ReengageCandidate): string {
  const greeting = candidate.name && candidate.name !== "-" ? `Halo Kak ${candidate.name}!` : "Halo Kak!"
  const couple = candidate.couple ? ` Undangan ${candidate.couple} sudah siap.` : ""
  return [greeting, `${couple} Mau saya bantu lanjutkan prosesnya sekarang?`]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}
