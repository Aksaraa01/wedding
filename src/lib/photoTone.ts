// Photo tone is a per-template content choice: `template_content.photo_tone`
// stores the couple's explicit pick ("mono" | "color"). The legacy
// `wedding_profiles.grayscale` boolean still counts when it is on, and a
// template that is monochrome by design keeps mono as its default so existing
// invitations do not silently flip to colour.
export type PhotoTone = "mono" | "color"

// Templates whose identity is monochrome photography. Absent an explicit
// `photo_tone`, these render grayscale.
export const MONO_DEFAULT_TEMPLATES = new Set(["silver-gelatin"])

export function templateDefaultsToMono(templateCode?: string | null): boolean {
  return !!templateCode && MONO_DEFAULT_TEMPLATES.has(templateCode)
}

export function resolvePhotoTone(
  templateContent: Record<string, string> | null | undefined,
  grayscale?: boolean | null,
  monoByDefault = false
): PhotoTone {
  const explicit = templateContent?.photo_tone
  if (explicit === "color" || explicit === "mono") return explicit
  if (grayscale === true) return "mono"
  return monoByDefault ? "mono" : "color"
}
