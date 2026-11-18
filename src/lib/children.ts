// Ceriavite: one invitation may introduce more than one ananda (siblings
// sharing the same ceremony). The parent line stays single and shared — it is
// the same Bapak/Ibu for every child, so it lives in `groom_parents` and is
// never repeated per child.
//
// Pure and client-safe: the dashboard editor, the ops console and the three
// kids templates all read the same shape, so no server-only module may creep in.

export type InvitationChild = {
  name: string
  full_name: string
  photo_url: string
  instagram: string
}

// A family inviting more than eight children on one card is out of scope; the
// cap also keeps the editor (and the template grids) from growing unbounded.
export const MAX_CHILDREN = 8

function str(value: unknown): string {
  if (typeof value === "string") return value.trim()
  if (typeof value === "number") return String(value)
  return ""
}

function asList(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

/** First usable photo of a `groom_photo_url`-shaped value (may be a JSON string). */
function firstPhoto(value: unknown): string {
  const list = asList(value)
  for (const entry of list) {
    const url = str(entry)
    if (url) return url
  }
  return typeof value === "string" && !value.trim().startsWith("[") ? value.trim() : ""
}

/** Instagram handle without the leading @ (stored form). */
export function cleanInstagram(value: unknown): string {
  return str(value).replace(/^@+/, "").trim()
}

export function instagramUrl(value: unknown): string {
  const handle = cleanInstagram(value)
  return handle ? `https://instagram.com/${handle}` : ""
}

function normalizeChild(entry: unknown): InvitationChild {
  const row = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {}
  return {
    name: str(row.name),
    full_name: str(row.full_name),
    photo_url: str(row.photo_url),
    instagram: cleanInstagram(row.instagram),
  }
}

/**
 * Every row an EDITOR must keep on screen, blank ones included. A newly added
 * ananda is an empty object until the couple types — filtering it out would make
 * "Tambah Ananda" look like it did nothing.
 */
export function readChildren(raw: unknown): InvitationChild[] {
  return asList(raw).map(normalizeChild).slice(0, MAX_CHILDREN)
}

/** Stored `children` column → normalized list (blank entries dropped). */
export function parseChildren(raw: unknown): InvitationChild[] {
  return readChildren(raw).filter((child) => !!child.name || !!child.full_name || !!child.photo_url)
}

/**
 * What an invitation should render. Stored `children` wins; an invitation made
 * before the column existed falls back to the legacy single slot so nothing
 * changes for it.
 */
export function resolveChildren(input: {
  children?: unknown
  groom_name?: unknown
  groom_full_name?: unknown
  groom_photo_url?: unknown
  groom_instagram?: unknown
}): InvitationChild[] {
  const stored = parseChildren(input?.children)
  if (stored.length > 0) return stored
  const legacy: InvitationChild = {
    name: str(input?.groom_name),
    full_name: str(input?.groom_full_name),
    photo_url: firstPhoto(input?.groom_photo_url),
    instagram: cleanInstagram(input?.groom_instagram),
  }
  return legacy.name || legacy.full_name || legacy.photo_url ? [legacy] : []
}

/** Nickname first: it is what the cover and the guest-facing label use. */
export function childDisplayName(child: InvitationChild): string {
  return (child.name || child.full_name || "Ananda").trim()
}

/** Full name first: the "Putra/Putri Kami" block prints the formal name. */
export function childFullName(child: InvitationChild): string {
  return (child.full_name || child.name || "Ananda").trim()
}

/**
 * Names as a sentence list: "Raka", "Raka & Rizky", "Raka, Rizky & Rafa".
 * Two ananda read as a pair, three or more keep the commas and put `&` only
 * before the last name — the same shape the wedding templates use for a couple.
 */
export function joinChildNames(names: unknown[]): string {
  const list = names.map((name) => str(name)).filter(Boolean)
  if (list.length <= 1) return list[0] ?? ""
  if (list.length === 2) return `${list[0]} & ${list[1]}`
  return `${list.slice(0, -1).join(", ")} & ${list[list.length - 1]}`
}

/** Nicknames as one line — cover headline, closing name, RSVP dock. */
export function childNamesLine(children: InvitationChild[]): string {
  return joinChildNames(children.map(childDisplayName))
}

/** Formal names as one line — calendar title, share copy, OG. */
export function childFullNamesLine(children: InvitationChild[]): string {
  return joinChildNames(children.map(childFullName))
}

/** Same shape, but with every photo swapped for its pre-generated thumbnail. */
export function thumbChildren(children: InvitationChild[], thumb: (url: string) => string): InvitationChild[] {
  return children.map((child) => ({
    ...child,
    photo_url: child.photo_url ? thumb(child.photo_url) || child.photo_url : "",
  }))
}

/** Up to two letters, used when a child has no photo yet. */
export function childInitials(child: InvitationChild): string {
  const words = childFullName(child)
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean)
  if (words.length === 0) return "A"
  if (words.length === 1) return words[0].slice(0, 1).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}
