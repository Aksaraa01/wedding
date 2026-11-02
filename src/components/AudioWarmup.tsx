"use client"

import { useEffect } from "react"

// Template music used to ship as `preload="auto"`, so every invitation downloaded
// the full track (0.9–3.2 MB) while the guest was still reading the cover — even
// if they never opened it. The templates now mark their audio with
// `data-warm-audio` and `preload="metadata"`; this upgrades them to a full
// download on the first real interaction (the "Tap to open" press), which is
// typically a second or two before playback starts, so the music still feels
// instant without paying the bytes for visitors who bounce.
export default function AudioWarmup() {
  useEffect(() => {
    let done = false

    const warm = () => {
      if (done) return
      done = true
      document.querySelectorAll<HTMLAudioElement>("audio[data-warm-audio]").forEach((el) => {
        if (el.preload === "auto") return
        try {
          el.preload = "auto"
          el.load()
        } catch {
          /* a blocked/decode-less element is not worth breaking the page for */
        }
      })
    }

    const opts: AddEventListenerOptions = { capture: true, passive: true }
    const events = ["pointerdown", "touchstart", "keydown"] as const
    for (const name of events) window.addEventListener(name, warm, opts)
    return () => {
      for (const name of events) window.removeEventListener(name, warm, opts)
    }
  }, [])

  return null
}
