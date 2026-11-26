// Pure, client-safe helpers describing which template sections are used.
// Kept out of the components barrel so server-only libs can import it without
// pulling React template components into their graph.

// Templates whose design has no "Kalimat Pembuka" block (the opening card is
// fixed: "The Wedding Of" + couple name). The editor/ops hide that accordion
// and completeness never blocks publishing on it.
const TEMPLATES_WITHOUT_OPENING = new Set(["majestic", "nihara-mist", "dark-split-rail", "evermore", "piano-garden", "altar-garden", "lunar-blossom", "adat-jawa", "adat-jawa-2", "imagine", "still-ever", "teatro", "traditional-bugis-pinishi", "silver-gelatin", "film-roll", "swan-garden"])

export function hidesOpeningSection(code: string | null | undefined): boolean {
  return !!code && TEMPLATES_WITHOUT_OPENING.has(code)
}

// Templates that render the opening *description* without the preset heading.
// The editor then drops the title/preset control so no field is presented that
// the invitation never prints.
const TEMPLATES_WITHOUT_OPENING_TITLE = new Set(["noir"])

export function hidesOpeningTitle(code: string | null | undefined): boolean {
  return !!code && TEMPLATES_WITHOUT_OPENING_TITLE.has(code)
}
