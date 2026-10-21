"use client"

import { useEffect, useRef } from "react"

type Props = {
  videoId: string
  title?: string
  controls?: boolean
  signal?: number
}

type YTPlayer = {
  destroy?: () => void
  getIframe?: () => HTMLIFrameElement | null
  mute?: () => void
  playVideo?: () => void
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void
}

let apiPromise: Promise<any> | null = null

function loadYouTubeApi(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"))
  const w = window as any
  if (w.YT?.Player) return Promise.resolve(w.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise((resolve) => {
    const prev = w.onYouTubeIframeAPIReady
    w.onYouTubeIframeAPIReady = () => {
      try {
        if (typeof prev === "function") prev()
      } catch {
        /* ignore */
      }
      resolve(w.YT)
    }
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const script = document.createElement("script")
      script.src = "https://www.youtube.com/iframe_api"
      script.async = true
      document.body.appendChild(script)
      return
    }
    const started = Date.now()
    const timer = window.setInterval(() => {
      if (w.YT?.Player || Date.now() - started > 8000) {
        window.clearInterval(timer)
        resolve(w.YT)
      }
    }, 100)
  })
  return apiPromise
}

// Off-screen embeds often ignore autoplay=1. Building the player through the
// IFrame API lets us explicitly mute + play on ready and whenever the frame
// re-enters the viewport, which works on mobile Safari too.
export default function AutoplayYouTube({ videoId, title = "Video", controls = false, signal = 0 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    let cancelled = false

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !hostRef.current || !YT?.Player) return
        const host = hostRef.current
        playerRef.current = new YT.Player(host, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            mute: 1,
            loop: 1,
            playlist: videoId,
            controls: controls ? 1 : 0,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            showinfo: 0,
            cc_load_policy: 0,
            iv_load_policy: 3,
            disablekb: 1,
            fs: 0,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: { target: YTPlayer }) => {
              const player = event.target
              try {
                player.mute?.()
                player.playVideo?.()
              } catch {
                /* ignore */
              }
              const iframe = player.getIframe?.()
              if (iframe && typeof IntersectionObserver !== "undefined") {
                observerRef.current?.disconnect()
                observerRef.current = new IntersectionObserver(
                  (entries) => {
                    if (!entries.some((entry) => entry.isIntersecting)) return
                    try {
                      player.mute?.()
                      player.playVideo?.()
                    } catch {
                      /* ignore */
                    }
                  },
                  { threshold: 0.25 }
                )
                observerRef.current.observe(iframe)
              }
            },
            onStateChange: (event: { data: number; target: YTPlayer }) => {
              if (event.data === 0) {
                try {
                  event.target.seekTo?.(0, true)
                  event.target.playVideo?.()
                } catch {
                  /* ignore */
                }
              }
            },
          },
        })
      })
      .catch(() => {
        /* leave the poster/black frame if the API is unavailable */
      })

    return () => {
      cancelled = true
      observerRef.current?.disconnect()
      observerRef.current = null
      try {
        playerRef.current?.destroy?.()
      } catch {
        /* ignore */
      }
      playerRef.current = null
    }
  }, [videoId, controls])

  useEffect(() => {
    const unlock = () => {
      try {
        playerRef.current?.mute?.()
        playerRef.current?.playVideo?.()
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("pointerdown", unlock, { once: true, capture: true })
    window.addEventListener("keydown", unlock, { once: true, capture: true })
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true })
      window.removeEventListener("keydown", unlock, { capture: true })
    }
  }, [])

  useEffect(() => {
    if (!signal) return
    try {
      playerRef.current?.mute?.()
      playerRef.current?.playVideo?.()
    } catch {
      /* ignore */
    }
  }, [signal])

  return <div ref={hostRef} aria-label={title} />
}
