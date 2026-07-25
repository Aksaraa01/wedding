"use client"

import { useEffect } from "react"

export default function PageTheme({ mode }: { mode: "light" | "dark" }) {
  useEffect(() => {
    document.documentElement.className = mode
  }, [mode])

  return null
}