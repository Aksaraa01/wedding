"use client"

import type React from "react"

type Props = {
  display?: string
  script?: string
  body?: string
  children: React.ReactNode
}

export default function ThemeInjector({ display, script, body, children }: Props) {
  const styleVars: Record<string, string> = {}
  if (display) styleVars["--font-display"] = `"${display}", serif`
  if (script) styleVars["--font-script"] = `"${script}", cursive`
  if (body) styleVars["--font-body"] = `"${body}", sans-serif`

  return <div style={styleVars as React.CSSProperties}>{children}</div>
}