// web_templates.popular_rank — the ops-owned slot in the public "Top 10
// Populer" shelf. One template per position, 1..10; empty means "not ranked".

export const POPULAR_RANK_MAX = 10

export function parsePopularRank(
  raw: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (raw === null || raw === undefined || raw === "") return { ok: true, value: null }
  const n = typeof raw === "number" ? raw : Number(String(raw).trim())
  if (!Number.isInteger(n) || n < 1 || n > POPULAR_RANK_MAX) {
    return { ok: false, error: `Urutan populer harus angka 1–${POPULAR_RANK_MAX}, atau kosong.` }
  }
  return { ok: true, value: n }
}
