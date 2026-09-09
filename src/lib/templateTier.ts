export type TemplateTier = "Baru" | "Populer" | "Signature"

export function normalizeTemplateTier(v: unknown): TemplateTier | null {
  const t = String(v ?? "").trim()
  return t === "Baru" || t === "Populer" || t === "Signature" ? t : null
}

export function tierBadgeClass(tier: string | null | undefined): string {
  switch (tier) {
    case "Baru":
      return "bg-[#059669] text-white"
    case "Populer":
      return "bg-[#C5A059] text-white"
    case "Signature":
      return "bg-[#B34E3F] text-white"
    default:
      return ""
  }
}
