// Server-safe sanitiser for short, user-entered values that later get displayed
// AND copied (gift account numbers, provider names, shipping addresses).
//
// Bank account numbers and addresses are not rich text: they must never carry
// markup into the database, because every render path downstream (React, the
// WordPress manifest, the clipboard) would have to defend against it. Strip it
// at the write boundary instead.
//
// Keep this dependency-free: it is imported by API routes (Node runtime).

const TAG = /<\/?[a-z][^>]*>/gi

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&amp;/gi, "&")
}

/**
 * Single-line value: tags dropped, entities decoded, whitespace collapsed.
 * Used for account numbers, holder names, provider names, phone, city, postal.
 * `null`/`undefined` pass through untouched so clearing a field still writes
 * NULL and an omitted field is still omitted (no silent "" where a caller
 * relied on the column default).
 */
export function cleanLine(value: unknown, maxLength = 200): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  const raw = String(value)
  const flat = decodeEntities(decodeEntities(raw.replace(TAG, "")))
    .replace(TAG, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
  return flat.slice(0, maxLength)
}

/**
 * Multi-line value (shipping address): same cleaning but newlines survive so a
 * pasted address keeps its line structure.
 */
export function cleanBlock(value: unknown, maxLength = 600): string | null | undefined {
  if (value === null) return null
  if (value === undefined) return undefined
  const raw = String(value)
  const text = decodeEntities(
    decodeEntities(
      raw
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(TAG, ""),
    ),
  )
  return text
    .replace(TAG, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength)
}
