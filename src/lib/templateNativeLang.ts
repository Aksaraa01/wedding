import { normalizeLanguage, normalizeLanguagePreference, type Language, type LanguagePreference } from "./i18n"

/**
 * The language a template's own copy was authored in.
 *
 * `language = "default"` means "follow the design", so the template renders in
 * the language its fallback copy was written in. Every port currently ships an
 * Indonesian base copy (`id`); flip an entry to `"en"` when the reference design
 * was authored in English and its defaults should read that way.
 *
 * This map is the single place to change that decision — templates keep
 * receiving a resolved `"id" | "en"` and need no knowledge of the preference.
 */
export const TEMPLATE_NATIVE_LANG: Record<string, Language> = {
  "adat-bali": "id",
  "adat-banjar": "id",
  "adat-batak": "id",
  "adat-betawi": "id",
  "adat-bugis": "id",
  "adat-dayak": "id",
  "adat-jawa": "id",
  "adat-jawa-2": "id",
  "adat-melayu": "id",
  "adat-minang": "id",
  "adat-palembang": "id",
  "altar-garden": "id",
  "boarding-pass": "id",
  "cinnabar-seal": "id",
  "dark-split-rail": "en",
  "embroidered-garden": "id",
  "emerald-heirloom": "id",
  "evermore": "id",
  "film-roll": "id",
  "fresco": "id",
  "imagine": "id",
  "impasto-mosque-dark-gold": "en",
  "iris": "id",
  "ivory-lace": "id",
  "lace": "id",
  "lentera-zamrud": "id",
  "love-line": "id",
  "lunar-blossom": "id",
  "majestic": "id",
  "manjari": "id",
  "minang-royal": "id",
  "n-film": "id",
  "nihara-mist": "id",
  "noir": "en",
  "olan": "en",
  "pastel-coastal-cut": "id",
  "pastel-dream-cathedral": "id",
  "piano-garden": "id",
  "pixel-paradise": "en",
  "pixel_quest": "en",
  "sandhya": "id",
  "silver-gelatin": "id",
  "skyline-penthouse": "en",
  "songket-marun": "id",
  "still-ever": "id",
  "swan-garden": "id",
  "teatro": "id",
  "traditional-bugis-pinishi": "id",
  "ubin-ottoman": "id",
}

/** Native language of a template, falling back to Indonesian. */
export function templateNativeLanguage(templateCode: string | null | undefined): Language {
  if (!templateCode) return "id"
  return TEMPLATE_NATIVE_LANG[templateCode.toLowerCase()] ?? "id"
}

/**
 * Resolve the couple's stored preference to the language a template renders in.
 * Anything unrecognised keeps today's behaviour (`id`).
 */
export function resolveLanguage(
  preference: unknown,
  templateCode: string | null | undefined,
): Language {
  const pref: LanguagePreference = normalizeLanguagePreference(preference)
  if (pref === "default") return templateNativeLanguage(templateCode)
  return normalizeLanguage(pref)
}
