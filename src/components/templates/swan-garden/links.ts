// One rule for every guest-facing outbound link (maps, live stream): the value
// the couple typed is used only when it is a real absolute address. A bare word
// ("gagsgaga") would otherwise resolve against the invitation host and send the
// guest to https://{slug}.wedding.aksaraa.com/gagsgaga, so it is dropped instead
// of being rendered as a link.
export function externalHref(raw?: string | null): string {
  const value = (raw || "").trim()
  if (!value) return ""
  if (/^https?:\/\//i.test(value)) return value
  if (/^\/\//.test(value)) return `https:${value}`
  if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/.test(value)) return `https://${value}`
  return ""
}
