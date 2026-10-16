const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

// Format an ISO date ("2026-09-12") into an Indonesian human string:
// "Sabtu, 12 September 2026". Uses UTC getters to avoid timezone off-by-one.
export function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(`${dateStr}T00:00:00Z`)
  if (isNaN(d.getTime())) return dateStr
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// Uppercase variant matching the WP template display: "SABTU, 12 SEPTEMBER 2026".
export function formatDateUpper(dateStr: string): string {
  return formatDate(dateStr).toUpperCase()
}

// Short Indonesian date without weekday: "2026-10-14" -> "14 Oktober 2026".
// Used for article bylines and cards.
export function formatIdDate(iso: string): string {
  const m = (iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${parseInt(m[3], 10)} ${MONTHS[parseInt(m[2], 10) - 1] || ""} ${m[1]}`
}
