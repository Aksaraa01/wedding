// Shaping helpers for the Aksaraa homepage design catalogue (`aksaraa.com/`).
//
// One umbrella page lists both products: the wedding catalogue and the
// Ceriavite (kids) catalogue. The two families share a card, a preview modal
// and a filter bar, so every helper here is pure and client-safe — the page
// server component and the client catalogue both import it.

export type DesignFamily = "wedding" | "kids"

export type DesignTemplate = {
  id: string
  code: string
  name: string
  description?: string | null
  preview_image_url: string | null
  /**
   * URL the preview modal loads. Our own templates are normalised to a
   * same-origin path (see `localPreviewUrl`); WP masters keep their
   * `wp.aksaraa.com` demo URL.
   */
  preview_url: string
  /** Where "Pilih" sends the visitor: /register (wedding) or /daftar (kids). */
  select_href: string
  family: DesignFamily
  category?: string | null
  tier?: string | null
  no_photo?: boolean | null
  popular_rank?: number | null
  sort_order?: number | null
  created_at?: string | null
}

export function designFamily(eventType: unknown): DesignFamily {
  return eventType === "kids" ? "kids" : "wedding"
}

/**
 * Every in-house preview route exists on every marketing host, so a preview
 * iframe must stay same-origin: `src/proxy.ts` answers with
 * `x-frame-options: SAMEORIGIN`, and a cross-origin
 * `https://ceriavite.aksaraa.com/templates/.../preview` would be refused on
 * `aksaraa.com`. WP masters (`wp.aksaraa.com`) are a public demo and stay
 * absolute.
 */
export function localPreviewUrl(demoUrl: string | null | undefined): string {
  const raw = (demoUrl || "").trim()
  if (!raw) return ""
  if (raw.startsWith("/")) return raw
  try {
    const url = new URL(raw)
    if (url.hostname.endsWith("aksaraa.com") && url.pathname.startsWith("/templates/")) {
      return `${url.pathname}${url.search}`
    }
  } catch {
    // Relative or malformed: hand it to the iframe unchanged.
  }
  return raw
}

/** "Emerald Pavonia Garden" → { head: "Emerald Pavonia", script: "Garden" }. */
export function splitDesignTitle(name: string): { head: string; script: string } {
  const clean = (name || "").trim()
  const parts = clean.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return { head: clean, script: "" }
  const script = parts.pop() as string
  return { head: parts.join(" "), script }
}

/** The three designs the hero carousel races through, best-ranked first. */
export function featuredDesigns(all: DesignTemplate[], limit = 3): DesignTemplate[] {
  return [...all]
    .sort((a, b) => {
      const ar = typeof a.popular_rank === "number" && a.popular_rank > 0 ? a.popular_rank : 999
      const br = typeof b.popular_rank === "number" && b.popular_rank > 0 ? b.popular_rank : 999
      if (ar !== br) return ar - br
      return (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name, "id")
    })
    .slice(0, limit)
}

/** Fallback copy for a featured design that has no description in the DB. */
export function designDescription(t: DesignTemplate): string {
  const desc = (t.description || "").trim()
  if (desc) return desc
  const style = (t.category || "elegan").trim()
  return `Undangan ${style} dengan tata letak rapi, tipografi anggun, dan seluruh informasi acara dalam satu tautan.`
}

/** Preview alt text used by every card and hero phone. */
export function designAlt(t: DesignTemplate): string {
  return `Desain undangan ${t.name}${t.family === "kids" ? " untuk acara ananda" : " pernikahan digital"}`
}
