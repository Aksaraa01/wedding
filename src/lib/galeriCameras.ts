// Client-safe Galeri Tamu film camera presets (no server imports).
// The couple picks one type in Detail Acara; it is baked into every guest
// capture via canvas ctx.filter at upload time (same zero-cost model as
// frames). Unknown/empty values fall back to Portra 400.

import { ASSETS } from "@/lib/assets"

export type GaleriCameraId =
  | "normal"
  | "fuji-quicksnap"
  | "kodak-funsaver"
  | "ilford-hp5"
  | "cinestill-800t"
  | "agfa-vista"
  | "lomo-metropolis"
  | "polaroid-600"
  | "portra-400"

export const DEFAULT_CAMERA: GaleriCameraId = "normal"

export type CameraPreset = {
  id: GaleriCameraId
  name: string
  desc: string
  swatch: string
  // CSS filter string, applied to canvas 2d ctx.filter before drawing.
  css: string
}

export const GALERI_CAMERAS: CameraPreset[] = [
  { id: "normal", name: "Normal", desc: "Tanpa Filter", swatch: "#e7e5e4", css: "" },  { id: "fuji-quicksnap", name: "Fuji QuickSnap", desc: "Vivid Greens", swatch: "#4d7c0f", css: "contrast(1.12) saturate(1.2) hue-rotate(8deg) brightness(1.02)" },
  { id: "kodak-funsaver", name: "Kodak FunSaver", desc: "Warm Gold", swatch: "#d97706", css: "sepia(0.28) saturate(1.35) contrast(1.1) brightness(1.06)" },
  { id: "ilford-hp5", name: "Ilford HP5 B&W", desc: "Deep Mono", swatch: "#525252", css: "grayscale(1) contrast(1.35) brightness(0.96)" },
  { id: "cinestill-800t", name: "Cinestill 800T", desc: "Cinematic Teal", swatch: "#0e7490", css: "contrast(1.15) hue-rotate(185deg) saturate(1.25) brightness(0.98)" },
  { id: "agfa-vista", name: "Agfa Vista 200", desc: "Vibrant Retro", swatch: "#dc2626", css: "saturate(1.4) contrast(1.15) hue-rotate(-8deg) brightness(1.02)" },
  { id: "lomo-metropolis", name: "Lomo Metropolis", desc: "Desaturated", swatch: "#78716c", css: "saturate(0.65) contrast(1.25) brightness(0.95)" },
  { id: "polaroid-600", name: "Polaroid 600", desc: "Pastel Cream", swatch: "#e7e5e4", css: "sepia(0.18) brightness(1.1) contrast(0.92) saturate(1.08)" },
  { id: "portra-400", name: "Portra 400", desc: "Soft Warmth", swatch: "#b45309", css: "contrast(1.04) saturate(1.12) brightness(1.05) sepia(0.1)" },
]

const BY_ID: Record<string, CameraPreset> = Object.fromEntries(
  GALERI_CAMERAS.map((c) => [c.id, c])
)

export function normalizeCameraId(v: unknown): GaleriCameraId {
  return typeof v === "string" && v in BY_ID ? (v as GaleriCameraId) : DEFAULT_CAMERA
}

export function cameraCss(id: GaleriCameraId): string {
  return BY_ID[id]?.css || ""
}

export function cameraPreset(v: unknown): CameraPreset {
  return BY_ID[normalizeCameraId(v)] || BY_ID[DEFAULT_CAMERA]
}

// Static sample photo behind every swatch (same image, like the HTML
// mocks) — never the couple's dynamic photo.
export const CAMERA_SWATCH_IMG = ASSETS.defaultGallery[0]
