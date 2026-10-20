"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { normalizeVideoUrl } from "../shared/lib"

export default function BackgroundVideo({ embed, poster, signal = 0 }: { embed: string; poster?: string; signal?: number }) {
  const ref = useRef<HTMLIFrameElement | null>(null)
  const base = normalizeVideoUrl(embed)
  const id = base.split("/").filter(Boolean).pop() || ""
  const [apiReady, setApiReady] = useState(false)

  // Wait for YouTube IFrame API to be ready (only for nudge)
  useEffect(() => {
    if (typeof window === "undefined") return
    if ((window as any).YT?.loaded || (window as any).YT?.Player) {
      setApiReady(true)
      return
    }
    const handler = () => {
      setApiReady(true)
      window.removeEventListener("YouTubeIframeAPIReady", handler)
    }
    window.addEventListener("YouTubeIframeAPIReady", handler)
    return () => window.removeEventListener("YouTubeIframeAPIReady", handler)
  }, [])

  const nudge = useCallback(() => {
    if (!apiReady) return
    try {
      ref.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: "playVideo", args: [] }),
        "*"
      )
    } catch {
      /* ignore */
    }
  }, [apiReady])

  // Re-issue play on signal change (finale enter) or tab visibility
  useEffect(() => {
    nudge()
    const onVisible = () => { if (!document.hidden) nudge() }
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
    <div className="pointer-events-none fixed inset-0 z-0">
      {poster && (
        <img src={poster} alt="" aria-hidden draggable={false} className="absolute inset-0 h-full w-full object-cover" />
      )}
      <iframe
        ref={ref}
        src={`${base}?${params.toString()}`}
        title="Video Latar"
        allow="autoplay; encrypted-media"
        className="absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
        style={{ border: 0 }}
      />
    </div>
  )
}
