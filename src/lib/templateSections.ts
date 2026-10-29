// Pure, client-safe helpers describing which template sections are used.
// Kept out of the components barrel so server-only libs can import it without
// pulling React template components into their graph.

// Templates whose design has no "Kalimat Pembuka" block (the opening card is
// fixed: "The Wedding Of" + couple name). The editor/ops hide that accordion
// and completeness never blocks publishing on it.
const TEMPLATES_WITHOUT_OPENING = new Set(["nihara-mist", "dark-split-rail", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa", "adat-jawa-2", "imagine", "still-ever", "embroidered-garden"])

export function hidesOpeningSection(code: string | null | undefined): boolean {
  return !!code && TEMPLATES_WITHOUT_OPENING.has(code)
}
