"use client"

import { useEffect, useRef } from "react"

type Props = {
  videoId: string
}

type YTPlayer = {
  destroy?: () => void
  unloadModule?: (name: string) => void
  setOption?: (module: string, option: string, value: unknown) => void
  playVideo?: () => void
}

// Fullscreen player for the Sandhya gallery video. Built on the YouTube IFrame
// API (not a bare <iframe>) so we can force captions off — cc_load_policy only
// sets the default and cannot override a viewer's caption preference, whereas
// unloadModule("captions") removes them outright.
export default function VideoModalPlayer({ videoId }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)

  useEffect(() => {
    let cancelled = false

    const create = () => {
      if (cancelled || !hostRef.current) return
      const YT = (window as any).YT
      if (!YT?.Player) return
      const player: YTPlayer = new YT.Player(hostRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          playsinline: 1,
          modestbranding: 1,
          cc_load_policy: 0,
          iv_load_policy: 3,
          origin: window.location.origin,
        },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            try { e.target.unloadModule?.("captions") } catch { /* ignore */ }
            try { e.target.setOption?.("captions", "track", {}) } catch { /* ignore */ }
            try { e.target.playVideo?.() } catch { /* ignore */ }
          },
        },
      })
      playerRef.current = player
    }

    if ((window as any).YT?.Player) {
      create()
    } else {
      const prev = (window as any).onYouTubeIframeAPIReady
      ;(window as any).onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") prev()
        create()
      }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement("script")
        script.src = "https://www.youtube.com/iframe_api"
        script.async = true
        document.body.appendChild(script)
      }
    }

    return () => {
      cancelled = true
      try { playerRef.current?.destroy?.() } catch { /* ignore */ }
      playerRef.current = null
    }
  }, [videoId])

  return <div ref={hostRef} className="absolute inset-0 h-full w-full" />
}
