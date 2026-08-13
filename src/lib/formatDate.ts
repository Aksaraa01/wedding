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
