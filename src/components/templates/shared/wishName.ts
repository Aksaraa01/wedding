import type { CSSProperties } from "react"
import { FALLBACK_GUEST_NAME } from "@/lib/guest-slug"

// Placeholders the invitation page substitutes when nobody is identified, plus
// the defaults templates fall back to. None may prefill the author name or be
// treated as "this is the guest".
const PLACEHOLDERS = new Set([
  "",
  "Tamu",
  "Tamu Undangan",
  "Our Beloved Guest",
  FALLBACK_GUEST_NAME,
])

/**
 * Name-field behaviour shared by every in-house Wishes form.
 *
 * - Terbatas (`guest_link_strict !== false`) with a resolved guest row: the name
 *   is the guest's own, prefilled and read-only.
 * - Fleksibel (`guest_link_strict === false`): prefilled from `?to=` when given,
 *   always editable so a forwarded link can introduce itself.
 * - Nobody identified: empty and editable.
 */
export function wishNameState(
  guestName?: string,
  guestId?: string,
  guestLinkStrict?: boolean
): { value: string; locked: boolean } {
  const trimmed = (guestName || "").trim()
  const known = !PLACEHOLDERS.has(trimmed)
  const locked = known && guestLinkStrict !== false && !!guestId
  return { value: known ? trimmed : "", locked }
}

// Optional cue for templates that want to dim a locked field. Kept inline so no
// template stylesheet has to change.
export const LOCKED_FIELD_STYLE: CSSProperties = { cursor: "default" }
