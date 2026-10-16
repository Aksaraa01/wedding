"use client"

import type { CSSProperties, ReactNode } from "react"

const DISPLAY_CSS = "var(--font-display, 'Playfair Display'), serif"
const BODY_CSS = "var(--font-body, 'Plus Jakarta Sans'), sans-serif"
const PIXEL_CSS = "var(--font-pixel, 'Press Start 2P'), monospace"
const SCRIPT_CSS = "var(--font-script, 'Alex Brush'), cursive"

// Style objects (not raw strings) so templates can do `style={FONT_PIXEL}` or
// `{ ...FONT_PIXEL, textShadow: "…" }`.
export const FONT_DISPLAY: CSSProperties = { fontFamily: DISPLAY_CSS }
export const FONT_BODY: CSSProperties = { fontFamily: BODY_CSS }
export const FONT_PIXEL: CSSProperties = { fontFamily: PIXEL_CSS }
export const FONT_SCRIPT: CSSProperties = { fontFamily: SCRIPT_CSS }

type SkinProps = {
  display?: string
  body?: string
  pixel?: string
  script?: string
  children: ReactNode
}

// Template display/body/pixel/script families are self-hosted in fonts.css
// — no runtime fetch. Renders immediately (display=swap handles the swap,
// no splash gate needed).
export default function Skin({ display = "Playfair Display", body = "Plus Jakarta Sans", pixel, script, children }: SkinProps) {
  const vars: Record<string, string> = { "--font-display": DISPLAY_CSS, "--font-body": BODY_CSS }
  if (pixel) vars["--font-pixel"] = PIXEL_CSS
  if (script) vars["--font-script"] = SCRIPT_CSS
  return <div style={vars as CSSProperties}>{children}</div>
}