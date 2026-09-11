"use client"

import { useEffect, useState } from "react"
import type { CSSProperties, ReactNode } from "react"

const FONT_CACHE = new Set<string>()

function loadFont(href: string): Promise<void> {
  if (FONT_CACHE.has(href)) return Promise.resolve()
  FONT_CACHE.add(href)
  return new Promise((resolve) => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    link.onload = () => resolve()
    link.onerror = () => resolve()
    document.head.appendChild(link)
  })
}

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

// Loads the template fonts and exposes them as CSS vars with a dark splash
// (no bright flash in immersive dark themes).
export default function Skin({ display = "Playfair Display", body = "Plus Jakarta Sans", pixel, script, children }: SkinProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const urls = [
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(display)}:wght@400;600;700&display=swap`,
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(body)}:wght@300;400;500;600;700;800&display=swap`,
    ]
    if (pixel) urls.push(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(pixel)}&display=swap`)
    if (script) urls.push(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(script)}&display=swap`)
    Promise.all(urls.map(loadFont)).then(() => setReady(true))
  }, [display, body, pixel, script])

  if (!ready) {
    return <div className="min-h-screen bg-[#05070c]" />
  }

  const vars: Record<string, string> = { "--font-display": DISPLAY_CSS, "--font-body": BODY_CSS }
  if (pixel) vars["--font-pixel"] = PIXEL_CSS
  if (script) vars["--font-script"] = SCRIPT_CSS
  return <div style={vars as CSSProperties}>{children}</div>
}