"use client"

import { useEffect, useRef } from "react"

// Polling that respects tab visibility: ticks are skipped while the tab is
// hidden (background/minimized/locked), and one fresh fetch fires immediately
// when the tab becomes visible again. Cuts API + Supabase log volume from
// forgotten tabs with zero UX change on active screens (LED wall, usher
// phones, ops board). Safe for deferred writes too (e.g. scanner offline
// sync): pending work stays local and flushes on the visibility refetch.
export function useVisiblePoll(fn: () => void, ms: number, active = true) {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    if (!active || typeof document === "undefined") return
    const tick = () => {
      if (document.hidden) return
      fnRef.current()
    }
    const onVisible = () => {
      if (!document.hidden) fnRef.current()
    }
    const iv = setInterval(tick, ms)
    document.addEventListener("visibilitychange", onVisible)
    return () => {
      clearInterval(iv)
      document.removeEventListener("visibilitychange", onVisible)
    }
  }, [ms, active])
}
