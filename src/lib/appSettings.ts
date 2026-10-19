import { supabaseAdmin } from "@/lib/supabase"
import { cachedRead } from "@/lib/refCache"

// DB-driven app config (app_settings key/value). Durations live in the DB so
// they can change without a deploy. Short TTL so an edit reflects quickly.

const TTL_MS = 60_000

export async function getSetting<T = unknown>(key: string, fallback: T): Promise<T> {
  return cachedRead<T>(`setting:${key}`, TTL_MS, async () => {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle()
    if (error || !data) return fallback
    return ((data as { value?: T }).value ?? fallback) as T
  })
}

async function getNumericSetting(key: string, fallback: number): Promise<number> {
  const raw = await getSetting<unknown>(key, fallback)
  const n = typeof raw === "string" ? parseInt(raw, 10) : Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : fallback
}

// Days after the event window before guest photos are eligible for deletion.
export function getPhotoRetentionDays(): Promise<number> {
  return getNumericSetting("galeri_photo_retention_days", 7)
}

// Lead days before the deletion date that a couple appears in the H-3 reminder column.
export function getClearanceReminderDays(): Promise<number> {
  return getNumericSetting("clearance_reminder_days", 3)
}
