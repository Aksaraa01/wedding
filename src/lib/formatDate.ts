const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const MONTHS_ID = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

type DateLang = "id" | "en"

// Format an ISO date ("2026-09-12") into a human string.
// Default is Indonesian for backward compatibility. Uses UTC getters to avoid timezone off-by-one.
export function formatDate(dateStr: string, lang: DateLang = "id"): string {
  if (!dateStr) return ""
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (isNaN(d.getTime())) return dateStr
  const days = lang === "en" ? DAYS_EN : DAYS_ID
  const months = lang === "en" ? MONTHS_EN : MONTHS_ID
  return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// Uppercase variant. For English, title-case-ish upper is less natural, but we preserve
// the existing behavior shape; callers can choose casing.
export function formatDateUpper(dateStr: string, lang: DateLang = "id"): string {
  return formatDate(dateStr, lang).toUpperCase()
}

// Short date without weekday: "2026-10-14" -> "14 Oktober 2026" / "14 October 2026".
export function formatIdDate(iso: string, lang: DateLang = "id"): string {
  const m = (iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  const months = lang === "en" ? MONTHS_EN : MONTHS_ID
  return `${parseInt(m[3], 10)} ${months[parseInt(m[2], 10) - 1] || ""} ${m[1]}`
}

// Backward-compatible aliases for callers that imported the old constant names.
export const DAYS = DAYS_ID
export const MONTHS = MONTHS_ID
