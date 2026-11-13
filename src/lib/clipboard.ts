// Pure, client-safe clipboard helper. The ONLY place in the app allowed to call
// document.execCommand (scripts/predeploy-guard.mjs enforces that) so no future
// template can hand-roll a copy path again.
//
// Why this exists: a copy action must never put markup on the clipboard. On
// iOS/iPadOS Safari the automatic telephone detector rewrites phone-shaped text
// nodes into <a href="tel:…"> in the DOM, so any copy implementation that reads
// innerHTML copies the anchor instead of the value — a bank account number
// 7297648165 reached guests as "<a href=\"tel:7297648165\">7297648165</a>"
// (the digits appear twice: href + link text). We always serialise plain text.

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
 * Everything that reaches the clipboard goes through here: <br> becomes a
 * newline, every other tag (including a detector-injected <a href="tel:…">) is
 * dropped, entities are decoded and markup is stripped again in case the source
 * was HTML-escaped. Whitespace runs are collapsed, newlines preserved.
 */
export function plainText(value: string): string {
  const stripped = String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(TAG, "")
  // decode twice: an escaped-and-escaped payload ("&amp;lt;a …") must not leak
  // markup, and a double-encoded ampersand must not stay as "&amp;".
  return decodeEntities(decodeEntities(stripped))
    .replace(TAG, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function legacyCopy(text: string): boolean {
  try {
    const field = document.createElement("textarea")
    field.value = text
    field.style.position = "fixed"
    field.style.top = "0"
    field.style.left = "0"
    field.style.opacity = "0"
    // Non-readonly on purpose: iOS Safari refuses to select a readonly
    // textarea, which silently no-ops execCommand('copy').
    document.body.appendChild(field)
    field.focus()
    field.select()
    if (field.setSelectionRange) {
      try {
        field.setSelectionRange(0, text.length)
      } catch {
        /* ignore */
      }
    }
    const copied = document.execCommand("copy")
    document.body.removeChild(field)
    return copied
  } catch {
    return false
  }
}

/** Copy `value` as plain text. Resolves true when something was written. */
export async function copyPlainText(value: string): Promise<boolean> {
  const text = plainText(value)
  if (!text) return false
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      /* cross-origin iframe without clipboard-write, insecure context, … */
    }
  }
  return legacyCopy(text)
}
