// Event families. 'wedding' is the original Aksaraa product; the rest are the
// Ceriavite (kids) family served from ceriavite.aksaraa.com while every
// invitation keeps its canonical address (apex subdomain in prod, path-form on
// staging/B1 — see coupleUrl).
//
// Pure and client-safe: templates, the registration form, the dashboard and the
// ops console all import from here, so no server-only modules may creep in.

import { siteOrigin } from "./site"
import { normalizeLanguage, type Language } from "./i18n"

export type EventType = "wedding" | "khitanan" | "aqiqah" | "birthday"

export const EVENT_TYPES: EventType[] = ["wedding", "khitanan", "aqiqah", "birthday"]

export const KIDS_EVENT_TYPES: EventType[] = ["khitanan", "aqiqah", "birthday"]

export const KIDS_SITE = "https://ceriavite.aksaraa.com"

// Site origin for the wedding app (prod: wedding.aksaraa.com, staging: e.g.
// wedding-stg.aksaraa.com). Env-driven; defaults preserve prod.
export function weddingSite(): string {
  return siteOrigin()
}

export const WEDDING_SITE = weddingSite()

export function isEventType(value: unknown): value is EventType {
  return typeof value === "string" && (EVENT_TYPES as string[]).includes(value)
}

/** Falls back to 'wedding' for legacy rows and untrusted input. */
export function normalizeEventType(value: unknown): EventType {
  return isEventType(value) ? value : "wedding"
}

/**
 * True for a rite ("khitanan") AND for the stored family value ("kids").
 * Both shapes reach this helper: profiles carry the rite, web_templates carry
 * the family. Accepting only the rite is what emptied the template picker.
 */
export function isKidsEvent(value: unknown): boolean {
  if (value === "kids") return true
  return KIDS_EVENT_TYPES.includes(normalizeEventType(value))
}

// Templates are filtered by FAMILY, not by rite: one khitanan design serves
// khitanan, aqiqah and ulang tahun alike.
export type EventFamily = "wedding" | "kids"

export function eventFamily(value: unknown): EventFamily {
  return isKidsEvent(value) ? "kids" : "wedding"
}

/** Whether a template (family) may be offered for a profile (rite). */
export function templateMatchesEvent(templateFamily: unknown, profileEvent: unknown): boolean {
  return eventFamily(templateFamily) === eventFamily(profileEvent)
}

export function eventSite(value: unknown): string {
  return isKidsEvent(value) ? KIDS_SITE : weddingSite()
}

export const KIDS_EVENT_OPTIONS: { value: EventType; label: string; ceremony: string }[] = [
  { value: "khitanan", label: "Khitanan", ceremony: "Walimatul Khitan" },
  { value: "aqiqah", label: "Aqiqah", ceremony: "Walimatul Aqiqah" },
  { value: "birthday", label: "Ulang Tahun", ceremony: "Ulang Tahun" },
]

// Every string a template or an ops screen needs in order to speak about the
// event correctly. Templates may override any of them from `template_content`;
// these are the defaults.
export type EventLabels = {
  brand: string
  site: string
  eventNoun: string
  eventKicker: string
  coverKicker: string
  subjectLabel: string
  subjectPossessive: string
  subjectOf: string
  mainEventName: string
  secondaryEventName: string
  countdownLabel: string
  giftTitle: string
  wishesTitle: string
  closingHeadline: string
  guestFallback: string
  coupleSeparator: string
}

function weddingLabels(lang: Language): EventLabels {
  if (lang === "en") {
    return {
      brand: "Aksaraa Wedding",
      site: weddingSite(),
      eventNoun: "Wedding",
      eventKicker: "The Wedding of",
      coverKicker: "Wedding Invitation",
      subjectLabel: "The Couple",
      subjectPossessive: "The Couple",
      subjectOf: "Child of",
      mainEventName: "Wedding Ceremony",
      secondaryEventName: "Reception",
      countdownLabel: "Counting Down",
      giftTitle: "Wedding Gift",
      wishesTitle: "Wishes & Prayers",
      closingHeadline: "With love and gratitude",
      guestFallback: "Honored Guest",
      coupleSeparator: "&",
    }
  }
  return {
    brand: "Aksaraa Wedding",
    site: weddingSite(),
    eventNoun: "Pernikahan",
    eventKicker: "Pernikahan",
    coverKicker: "Undangan Pernikahan",
    subjectLabel: "Mempelai",
    subjectPossessive: "Mempelai",
    subjectOf: "Putra/Putri dari",
    mainEventName: "Akad Nikah",
    secondaryEventName: "Resepsi",
    countdownLabel: "Menuju Hari Bahagia",
    giftTitle: "Tanda Kasih",
    wishesTitle: "Ucapan & Doa",
    closingHeadline: "Kami yang berbahagia",
    guestFallback: "Tamu Undangan",
    coupleSeparator: "&",
  }
}

function kidsBase(lang: Language): EventLabels {
  if (lang === "en") {
    return {
      brand: "Ceriavite",
      site: KIDS_SITE,
      eventNoun: "Celebration",
      eventKicker: "Walimatul Khitan",
      coverKicker: "Khitanan Invitation",
      subjectLabel: "Our Child",
      subjectPossessive: "Our Son",
      subjectOf: "Son of",
      mainEventName: "Walimatul Khitan",
      secondaryEventName: "Celebration",
      countdownLabel: "Counting Down",
      giftTitle: "Gift",
      wishesTitle: "Wishes & Prayers",
      closingHeadline: "With love and gratitude",
      guestFallback: "Honored Guest",
      coupleSeparator: "",
    }
  }
  return {
    brand: "Ceriavite",
    site: KIDS_SITE,
    eventNoun: "Acara",
    eventKicker: "Walimatul Khitan",
    coverKicker: "Undangan Khitanan",
    subjectLabel: "Ananda",
    subjectPossessive: "Putra Kami",
    subjectOf: "Putra dari",
    mainEventName: "Walimatul Khitan",
    secondaryEventName: "Syukuran",
    countdownLabel: "Menuju Hari Bahagia",
    giftTitle: "Tanda Kasih",
    wishesTitle: "Ucapan & Doa",
    closingHeadline: "Kami yang berbahagia",
    guestFallback: "Tamu Undangan",
    coupleSeparator: "",
  }
}

const KIDS_BY_TYPE: Record<string, { id: Partial<EventLabels>; en: Partial<EventLabels> }> = {
  khitanan: {
    id: { eventNoun: "Khitanan", eventKicker: "Walimatul Khitan", coverKicker: "Undangan Khitanan", mainEventName: "Walimatul Khitan", secondaryEventName: "Syukuran" },
    en: { eventNoun: "Khitanan", eventKicker: "Walimatul Khitan", coverKicker: "Khitanan Invitation", mainEventName: "Walimatul Khitan", secondaryEventName: "Celebration" },
  },
  aqiqah: {
    id: { eventNoun: "Aqiqah", eventKicker: "Walimatul Aqiqah", coverKicker: "Undangan Aqiqah", mainEventName: "Walimatul Aqiqah", secondaryEventName: "Syukuran" },
    en: { eventNoun: "Aqiqah", eventKicker: "Walimatul Aqiqah", coverKicker: "Aqiqah Invitation", mainEventName: "Walimatul Aqiqah", secondaryEventName: "Celebration" },
  },
  birthday: {
    id: { eventNoun: "Ulang Tahun", eventKicker: "Ulang Tahun", coverKicker: "Undangan Ulang Tahun", mainEventName: "Ulang Tahun", secondaryEventName: "Syukuran" },
    en: { eventNoun: "Birthday", eventKicker: "Birthday Celebration", coverKicker: "Birthday Invitation", mainEventName: "Birthday Celebration", secondaryEventName: "Celebration" },
  },
}

export type SubjectGender = "putra" | "putri"

export function normalizeSubjectGender(value: unknown): SubjectGender | null {
  return value === "putra" || value === "putri" ? value : null
}

/**
 * Labels for one profile. `gender` only changes the words used about the child
 * ("Putra Kami" / "Putri Kami"); it never changes which column holds the data.
 * `lang` defaults to "id" so existing callers keep Bahasa behavior.
 */
export function eventLabels(event: unknown, gender?: unknown, lang?: unknown): EventLabels {
  const type = normalizeEventType(event)
  const l = normalizeLanguage(lang)
  if (type === "wedding") return weddingLabels(l)

  const merged: EventLabels = { ...kidsBase(l), ...(KIDS_BY_TYPE[type]?.[l] || {}) }
  const g = normalizeSubjectGender(gender)
  if (g === "putri") {
    return l === "en"
      ? { ...merged, subjectPossessive: "Our Daughter", subjectOf: "Daughter of" }
      : { ...merged, subjectPossessive: "Putri Kami", subjectOf: "Putri dari" }
  }
  return merged
}

/** "Ananda Raka" / "Rafi & Novi", a single display name for lists and copy. */
export function subjectDisplayName(
  event: unknown,
  names: { groom?: string | null; bride?: string | null; groomFull?: string | null; brideFull?: string | null },
): string {
  if (normalizeEventType(event) === "wedding") {
    return [names.groom, names.bride].filter(Boolean).join(" & ")
  }
  const child = (names.groomFull || names.groom || "").trim()
  return child
}

/** Maps a request host to the event family it markets. */
export function eventTypeFromHost(host: string | null | undefined): EventType | null {
  const h = (host || "").toLowerCase()
  if (!h) return null
  if (h === "ceriavite.aksaraa.com" || h.startsWith("ceriavite.")) return "khitanan"
  return null
}
