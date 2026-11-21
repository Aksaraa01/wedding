export function normalizeDemoUrl(raw: unknown, code: string, baseUrl: string): string {
  const base = baseUrl.replace(/\/$/, "")
  const value = typeof raw === "string" ? raw.trim() : ""
  if (value) {
    if (/^https?:\/\//i.test(value)) return value
    if (value.startsWith("/")) return `${base}${value}`
    return `${base}/${value.replace(/^\/+/, "")}`
  }
  return `${base}/templates/${encodeURIComponent(code)}/preview`
}

export function formatTemplateReply(data: unknown): string | null {
  if (!data || typeof data !== "object") return null
  const payload = data as {
    category_filter?: string
    total_matches?: number
    templates?: { name?: string; category?: string | null; demo_url?: string }[]
    inactive_matches?: { name?: string; category?: string | null }[]
  }
  const templates = Array.isArray(payload.templates) ? payload.templates : []
  const inactive = Array.isArray(payload.inactive_matches) ? payload.inactive_matches : []
  const category = typeof payload.category_filter === "string" && payload.category_filter !== "(semua)"
    ? ` kategori ${payload.category_filter}`
    : ""

  if (templates.length === 0) {
    if (inactive.length > 0) {
      const names = inactive.slice(0, 3).map((t) => t.name).filter(Boolean).join(", ")
      return `Untuk template${category}, ${names || "template yang dimaksud"} belum tersedia saat ini, Kak. Kalau mau, aku bisa bantu cek pilihan lain.`
    }
    return `Maaf Kak, aku belum menemukan template${category} yang tersedia sekarang. Coba sebutkan gaya yang Kakak suka, nanti aku bantu carikan.`
  }

  const lines = [`Ini beberapa template${category} yang bisa Kakak lihat:`]
  for (const t of templates.slice(0, 3)) {
    const name = t?.name || "Template"
    const cat = t?.category ? ` (${t.category})` : ""
    const link = t?.demo_url ? String(t.demo_url) : ""
    lines.push(link ? `• ${name}${cat} — ${link}` : `• ${name}${cat}`)
  }
  if (Number(payload.total_matches || 0) > 3) {
    lines.push("Kalau mau pilihan lain, bilang aja gaya atau warnanya ya, Kak.")
  }
  return lines.join("\n")
}
