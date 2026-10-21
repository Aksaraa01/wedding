"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { normalizeVideoUrl } from "../shared/lib"

export default function BackgroundVideo({ embed, poster, signal = 0, dim = false, clean = false }: { embed: string; poster?: string; signal?: number; dim?: boolean; clean?: boolean }) {
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

  useEffect(() => {
    if (!clean) return
    const el = ref.current
    if (!el) return
    let tries = 0
    const disableCaptions = () => {
      try {
        const win = el.contentWindow
        if (!win) return
        win.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*")
        win.postMessage(JSON.stringify({ event: "command", func: "unloadModule", args: ["captions"] }), "*")
        win.postMessage(JSON.stringify({ event: "command", func: "unloadModule", args: ["cc"] }), "*")
      } catch {
        /* ignore */
      }
    }
    el.addEventListener("load", disableCaptions)
    const id = window.setInterval(() => {
      disableCaptions()
      tries += 1
      if (tries >= 10) window.clearInterval(id)
    }, 1000)
    return () => {
      el.removeEventListener("load", disableCaptions)
      window.clearInterval(id)
    }
  }, [clean])

  if (!/\/embed\//.test(base)) return null

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    controls: "0",
    cc_load_policy: "0",
    iv_load_policy: "3",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    playlist: id,
  })
  if (clean) params.set("showinfo", "0")
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
      {dim && (
        <div
          className="absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(120% 80% at 50% 42%, rgba(0,0,0,0.2), rgba(0,0,0,0.76)), linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.8))",
          }}
        />
      )}
    </div>
  )
}
