"use client"

import { useCallback, useEffect, useRef } from "react"
import { normalizeVideoUrl } from "../shared/lib"

// Fixed full-viewport background video behind the content rail — replaces the
// black page background on desktop and mobile (mobile has no media panel, so the
// video shows through the full-width rail). Muted/looping, non-interactive.
//
// Autoplay notes: muted autoplay is allowed by default, but can still be blocked
// (iOS Low Power Mode, Safari/Chrome autoplay site settings, data saver). So we
// (a) only mount after the "Buka Undangan" tap (a user gesture), (b) keep a
// poster frame behind the player so it is never black, and (c) nudge playback
// via the YouTube IFrame API on load and when the tab becomes visible again.
export default function BackgroundVideo({ embed, poster, signal = 0 }: { embed: string; poster?: string; signal?: number }) {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const base = normalizeVideoUrl(embed)
  const id = base.split("/").filter(Boolean).pop() || ""

  const nudge = useCallback(() => {
    try {
      ref.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      )
    } catch {
      /* ignore */
    }
  }, [])

  // Re-issue play whenever the invitation opens (guest gesture) or the tab
  // regains focus — covers browsers that defer muted autoplay until then.
  useEffect(() => {
    nudge()
    const onVisible = () => {
      if (!document.hidden) nudge()
    }
    document.addEventListener("visibilitychange", onVisible)
    return () => document.removeEventListener("visibilitychange", onVisible)
  }, [nudge, signal])

  if (!/\/embed\//.test(base)) return null

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    playlist: id,
  })
  if (typeof window !== "undefined") params.set("origin", window.location.origin)

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black">
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <iframe
        ref={ref}
        onLoad={nudge}
        src={`${base}?${params.toString()}`}
        title="Video Latar"
        allow="autoplay; encrypted-media"
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        style={{ border: 0 }}
      />
      <div className="absolute inset-0 bg-black/20" />
    </div>
  )
}
