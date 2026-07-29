"use client"

import { useEffect, useState } from "react"

const FONT_CACHE = new Set<string>()

function loadGoogleFont(family: string): Promise<void> {
  if (FONT_CACHE.has(family)) return Promise.resolve()
  FONT_CACHE.add(family)

  return new Promise((resolve, reject) => {
    const link = document.createElement("link")
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@300;400;600&display=swap`
    link.rel = "stylesheet"
    link.onload = () => resolve()
    link.onerror = reject
    document.head.appendChild(link)
  })
}

type Props = {
  display?: string
  script?: string
  body?: string
  children: React.ReactNode
}

export default function ThemeInjector({ display, script, body, children }: Props) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const families = [display, script, body].filter(Boolean) as string[]
    if (families.length === 0) {
      setLoaded(true)
      return
    }
    Promise.all(families.map(loadGoogleFont))
      .then(() => setLoaded(true))
      .catch(() => setLoaded(true))
  }, [display, script, body])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-[#fdf9f0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const styleVars: Record<string, string> = {}
  if (display) styleVars["--font-display"] = `"${display}", serif`
  if (script) styleVars["--font-script"] = `"${script}", cursive`
  if (body) styleVars["--font-body"] = `"${body}", sans-serif`

  return <div style={styleVars as React.CSSProperties}>{children}</div>
}