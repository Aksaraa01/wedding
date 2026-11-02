"use client"

import { useEffect, useRef, useState } from "react"

type Props = {
  videoId: string
  title?: string
  controls?: boolean
  signal?: number
  // Background loops want to start muted on mount; a "watch the film" player
  // must wait for the guest's click so it can start with sound.
  autoplay?: boolean
  onPlay?: () => void
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
export default function AutoplayYouTube({ videoId, title = "Video", controls = false, signal = 0, autoplay = true, onPlay }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  // The player (≈470 KB of YouTube JS plus the video itself) used to be created
  // on mount, so a film section below the fold cost ~1.5 MB before the guest ever
  // scrolled to it. It now mounts two screens early; autoplay is unchanged, and a
  // YouTube poster fills the slot until then.
  const [active, setActive] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  // Keep the latest callback out of the player effect: rebuilding the player
  // on every parent render would restart the film.
  const onPlayRef = useRef(onPlay)
  onPlayRef.current = onPlay

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    // Two screens of margin: the player is fully ready (and autoplaying) before
    // the film can be seen. Loading it on mount instead costs ~1.5 MB on every
    // invitation, including guests who never scroll this far; the poster above
    // means the section is never an empty black box.
    if (typeof IntersectionObserver === "undefined") {
      setActive(true)
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setActive(true)
        io.disconnect()
      },
      { rootMargin: "200% 0px" }
    )
    io.observe(host)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!active) return
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
            // A background loop starts muted so the browser allows autoplay; a
            // "watch the film" player must stay silent-until-clicked instead.
            autoplay: autoplay ? 1 : 0,
            mute: autoplay ? 1 : 0,
            loop: autoplay ? 1 : 0,
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
              if (!autoplay) return
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
              if (event.data === 1) onPlayRef.current?.()
              if (event.data !== 0 || !autoplay) return
              try {
                event.target.seekTo?.(0, true)
                event.target.playVideo?.()
              } catch {
                /* ignore */
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
  }, [active, videoId, controls, autoplay])

  useEffect(() => {
    if (!autoplay) return
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
  }, [autoplay])

  useEffect(() => {
    if (!signal || !autoplay) return
    try {
      playerRef.current?.mute?.()
      playerRef.current?.playVideo?.()
    } catch {
      /* ignore */
    }
  }, [signal, autoplay])

  return (
    <div ref={hostRef} aria-label={title} className="relative h-full w-full">
      {!active && (
        <img
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  )
}
