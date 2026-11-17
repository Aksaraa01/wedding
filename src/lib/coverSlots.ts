import type { ContentSpec } from "@/types/template"

// A cover slot can be tied to an invitation section. Hiding that section in
// the editor/ops hides the slot field, but never deletes the stored photo —
// turning the section back on restores it at the same index.
export type CoverSlotGate = "events" | "rundown" | "video" | "gift" | "dresscode"

export type CoverSlotGateData = {
  sessions?: unknown[] | null
  rundown?: unknown[] | null
  rundown_visible?: boolean | null
  video_url?: string | null
  video_section_visible?: boolean | null
  gift_section_visible?: boolean | null
  gift_accounts?: unknown[] | null
  gift_address?: string | null
  dresscode?: { colors?: unknown[] | null; title?: string | null; description?: string | null } | null
  dresscode_visible?: boolean | null
  feature_gates?: { video?: boolean; gift_address?: boolean } | null
}

function hasItems(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0
}

export function coverSlotVisible(gate: string | null | undefined, data: CoverSlotGateData): boolean {
  if (!gate) return true
  if (gate === "events") return hasItems(data.sessions)
  if (gate === "rundown") return data.rundown_visible !== false && hasItems(data.rundown)
  if (gate === "video") {
    return (
      data.feature_gates?.video !== false &&
      data.video_section_visible !== false &&
      !!(data.video_url || "").trim()
    )
  }
  if (gate === "gift") {
    if (data.gift_section_visible === false) return false
    return hasItems(data.gift_accounts) || !!(data.gift_address || "").trim()
  }
  if (gate === "dresscode") {
    if (data.dresscode_visible === false) return false
    const dress = data.dresscode
    return !!dress && (hasItems(dress.colors) || !!(dress.title || "").trim() || !!(dress.description || "").trim())
  }
  return true
}

// Slot indexes to render, in template order. Indexes are stable: a hidden slot
// leaves a gap instead of shifting the photos that follow it.
// `slotCount` is the count resolved by the caller for templates without a
// content spec (WP templates read it from `wp_manifest.cover_photos`); without
// it every WP template reports zero slots.
export function visibleCoverSlotIndexes(
  spec: ContentSpec | undefined,
  data: CoverSlotGateData,
  slotCount?: number,
): number[] {
  const count = spec?.cover_slots ?? slotCount ?? 0
  if (count <= 0) return []
  const gates = spec?.cover_slot_sections
  const indexes: number[] = []
  for (let index = 0; index < count; index++) {
    if (coverSlotVisible(gates?.[index], data)) indexes.push(index)
  }
  return indexes
}
