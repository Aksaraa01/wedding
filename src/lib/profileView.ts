// One view model per profile.
//
// WHY THIS EXISTS
// ---------------
// The Ceriavite work first spread `event_type === "khitanan"` / `isKidsEvent()`
// checks through 13 files (41 call sites): the dashboard chrome, the editor form,
// the ops console, the guest hub and the template renderer each decided on their
// own what a kids invitation shows. The same rule was implemented three times,
// so a fix in one surface never reached the others — that produced a string of
// "why is this still visible in ops?" bugs.
//
// Everything that branches on the event family now asks this module instead:
//
//     const view = profileView(profile)
//     if (view.chrome.packageButton) { … }
//     if (view.sections.story) { … }
//
// Adding a rite (akikah, birthday) or a second kids template should never require
// a new conditional outside this file.
//
// Pure and client-safe: no server-only imports.

import {
  eventFamily,
  eventLabels,
  isKidsEvent,
  normalizeEventType,
  normalizeSubjectGender,
  type EventFamily,
  type EventLabels,
  type EventType,
} from "@/lib/eventType"
import { resolveCoupleName } from "@/lib/coupleName"

export type ProfileViewInput = {
  event_type?: string | null
  subject_gender?: string | null
  /** Invitation language ("id" | "en"); defaults to "id". */
  language?: string | null
  package_type?: string | null
  slug?: string | null

  // first person slot: the child for kids events, the groom for weddings
  groom_name?: string | null
  groom_full_name?: string | null
  groom_photo_url?: unknown
  groom_parents?: string | null
  groom_instagram?: string | null

  // second person slot: empty for kids events
  bride_name?: string | null
  bride_full_name?: string | null
  bride_photo_url?: unknown
  bride_parents?: string | null
  bride_instagram?: string | null

  // per-profile section toggles
  story_visible?: boolean | null
  video_section_visible?: boolean | null
  inviting_families_visible?: boolean | null
  gift_section_visible?: boolean | null
  dresscode_visible?: boolean | null
  livestream_visible?: boolean | null
  rundown_visible?: boolean | null
  contacts_visible?: boolean | null

  /** `profile.package_gates` as delivered by the dashboard/ops APIs. */
  package_gates?: Partial<Record<PackageGateKey, { included?: boolean } | null>> | null
}

export type PackageGateKey =
  | "story"
  | "cinematic_video"
  | "inviting_families"
  | "gift_address"

type SectionState = {
  /** Render the section at all. False means: not in the package, hide it. */
  story: boolean
  video: boolean
  inviting: boolean
  gift: boolean
  dresscode: boolean
  livestream: boolean
  rundown: boolean
  contacts: boolean
  /** Photos belong to a design that draws them (no-photo templates opt out). */
  gallery: boolean
}

type ChromeState = {
  /** "PAKET …" information pill in the dashboard header. */
  packagePill: boolean
  /** "Ganti Paket" gear — meaningless in a flat single-price product. */
  packageButton: boolean
  /** Guest gallery tile/button. */
  guestGallery: boolean
  /** Check-in (QR guestbook) tile in the dashboard stat row. */
  checkInTile: boolean
  /** Instagram hashtag field in the editor and the ops form. */
  hashtagField: boolean
  /** Couple-initials monogram field. */
  initialsField: boolean
  /** Second person block in the editor and the ops form. */
  secondPerson: boolean
  /** "Kelola Tamu & Meja" vs "Kelola Tamu". */
  tableLabel: boolean
  /** Category chip in the guest-hub message composer, or null for weddings. */
  messageCategory: "khitanan" | null
}

type Subject = {
  /** Nickname: cover headline, slug source. */
  name: string
  /** Full name: the "Ananda" / "Putri Kami" block. */
  fullName: string
  photo: unknown
  parents: string
  instagram: string
  gender: "putra" | "putri" | null
}

export type ProfileView = {
  family: EventFamily
  rite: EventType
  kids: boolean
  labels: EventLabels
  subject: Subject
  partner: { name: string; fullName: string; parents: string; photo: unknown }
  /** Display name for lists, headers and share cards. */
  displayName: string
  /** Name after "Kami yang berbahagia," in composed messages. */
  signOffName: string
  sections: SectionState
  chrome: ChromeState
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

function visible(toggle: boolean | null | undefined, gateIncluded?: boolean): boolean {
  if (gateIncluded === false) return false
  return toggle !== false
}

/**
 * @param input  a profile row, or the whitelisted `profile` object from an API
 * @param opts   `noPhotoTemplate` silences the gallery; `preview` forces chrome on
 *               so design previews show the full interface
 */
export function profileView(input: ProfileViewInput | null | undefined): ProfileView {
  const p = input || {}
  const rite = normalizeEventType(p.event_type)
  const family = eventFamily(p.event_type)
  const kids = isKidsEvent(p.event_type)
  const labels = eventLabels(p.event_type, p.subject_gender, p.language)
  const gates = p.package_gates || {}
  const ceriavite = (p.package_type || "") === "ceriavite"

  const subject: Subject = {
    name: str(p.groom_name),
    fullName: str(p.groom_full_name) || str(p.groom_name),
    photo: p.groom_photo_url,
    parents: str(p.groom_parents),
    instagram: str(p.groom_instagram),
    gender: normalizeSubjectGender(p.subject_gender),
  }

  const partner = {
    name: str(p.bride_name),
    fullName: str(p.bride_full_name),
    parents: str(p.bride_parents),
    photo: p.bride_photo_url,
  }

  const displayName = kids
    ? subject.fullName || subject.name || resolveCoupleName(p)
    : resolveCoupleName(p)

  // Kids invitations sign off with the parents; weddings with the couple.
  const signOffName = kids
    ? subject.parents || subject.fullName || subject.name
    : resolveCoupleName(p)

  // Package gates win over toggles: a section the package does not include can
  // never be turned on from the editor.
  const storyGate = gates.story?.included
  const videoGate = gates.cinematic_video?.included
  const invitingGate = gates.inviting_families?.included

  const sections: SectionState = {
    story: visible(p.story_visible, storyGate),
    video: visible(p.video_section_visible, videoGate),
    inviting: visible(p.inviting_families_visible, invitingGate),
    gift: visible(p.gift_section_visible),
    dresscode: visible(p.dresscode_visible),
    livestream: visible(p.livestream_visible),
    rundown: visible(p.rundown_visible),
    contacts: visible(p.contacts_visible),
    gallery: true,
  }

  const chrome: ChromeState = {
    // The pill states what was bought; it stays for every family.
    packagePill: true,
    // A flat one-price product has nothing to upgrade to, and /customize is the
    // wedding matrix which has no ceriavite column.
    packageButton: !ceriavite,
    guestGallery: !kids,
    checkInTile: !kids,
    hashtagField: !kids,
    initialsField: !kids,
    secondPerson: !kids,
    tableLabel: !kids,
    messageCategory: kids ? "khitanan" : null,
  }

  return { family, rite, kids, labels, subject, partner, displayName, signOffName, sections, chrome }
}

/** Convenience for surfaces that only need the headline name. */
export function profileDisplayName(input: ProfileViewInput | null | undefined): string {
  return profileView(input).displayName
}
