"use client"

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"

type Props = {
  name: string
  demoUrl: string
  onClose: () => void
  /** Public gallery: choose this design without leaving the preview. */
  selectHref?: string
}

// A template preview is a full page in an iframe: the document itself arrives in
// a few hundred ms, while the decorative art and embeds keep streaming after it.
// `load` therefore only fires once every subresource (including third-party
// images and YouTube) has settled, which says nothing about whether the guest is
// waiting or the network is bad. Reveal the document early, and only warn when
// assets are still missing well after the frame is visible.
const REVEAL_FALLBACK_MS = 2500
const SLOW_ASSETS_MS = 8000
const HARD_TIMEOUT_MS = 45000

export default function TemplatePreviewModal({ name, demoUrl, onClose, selectHref }: Props) {
  const hasPreview = Boolean(demoUrl)
  const [status, setStatus] = useState<"loading" | "loaded" | "errored">(hasPreview ? "loading" : "errored")
  const [revealed, setRevealed] = useState(false)
  const [slow, setSlow] = useState(false)
  const [offline, setOffline] = useState(false)
  const [noticeDismissed, setNoticeDismissed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const safetyRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // The in-app preview loads the template through the lightweight Aksaraa render
  // (?aksaraa_preview=1 skips interactive-only JS, keeps CSS + music). The full
  // functional demo URL is kept for the "open in new tab" fallback / real visitors.
  const fullUrl = demoUrl
  const src = (() => {
    if (!demoUrl || !demoUrl.includes("wp.aksaraa.com")) return demoUrl
    const url = new URL(demoUrl)
    if (!url.searchParams.has("aksaraa_preview")) url.searchParams.set("aksaraa_preview", "1")
    return url.toString()
  })()

  // Hard timeout: never spin forever. Network-slow is handled by the notice below.
  useEffect(() => {
    if (!hasPreview) return
    safetyRef.current = setTimeout(() => {
      setStatus(s => (s === "loading" ? "errored" : s))
    }, HARD_TIMEOUT_MS)
    return () => {
      if (safetyRef.current) clearTimeout(safetyRef.current)
    }
  }, [attempt, hasPreview])

  useEffect(() => {
    if (!hasPreview || status !== "loading") return
    const id = setTimeout(() => setSlow(true), SLOW_ASSETS_MS)
    return () => clearTimeout(id)
  }, [status, attempt, hasPreview])

  // Do not keep the preview hidden until every asset on the WP page settles.
  useEffect(() => {
    if (!hasPreview || status !== "loading" || revealed) return
    const id = setTimeout(() => setRevealed(true), REVEAL_FALLBACK_MS)
    return () => clearTimeout(id)
  }, [status, attempt, hasPreview, revealed])

  useEffect(() => {
    const sync = () => setOffline(typeof navigator !== "undefined" && navigator.onLine === false)
    sync()
    window.addEventListener("online", sync)
    window.addEventListener("offline", sync)
    return () => {
      window.removeEventListener("online", sync)
      window.removeEventListener("offline", sync)
    }
  }, [])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  // The modal is position:absolute (not fixed) because Android Chrome refuses
  // to touch-scroll an iframe whose ancestor is position:fixed. Scroll the page
  // to the top synchronously before paint so the absolute backdrop covers the
  // viewport.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleLoad = useCallback(() => {
    if (safetyRef.current) clearTimeout(safetyRef.current)
    setStatus("loaded")
    setSlow(false)
    setRevealed(true)
  }, [])
  const handleError = useCallback(() => {
    if (safetyRef.current) clearTimeout(safetyRef.current)
    setStatus("errored")
  }, [])

  const openTab = useCallback(() => {
    if (!fullUrl) return
    window.open(fullUrl, "_blank", "noopener,noreferrer")
    onClose()
  }, [fullUrl, onClose])

  const retry = useCallback(() => {
    if (!hasPreview) return
    setStatus("loading")
    setSlow(false)
    setRevealed(false)
    setNoticeDismissed(false)
    setAttempt(a => a + 1)
  }, [hasPreview])

  const showNotice = status === "loading" && !noticeDismissed && (offline || slow)

  return (
    <div className="absolute top-0 left-0 w-full z-[200] bg-black/80" style={{ height: "100dvh" }} onClick={onClose}>
      <div className="absolute inset-0 sm:inset-4 lg:inset-8 flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 bg-white px-4 py-3 sm:px-6 sm:py-4 shrink-0 sm:rounded-t-lg">
          <h2 className="font-headline-md text-[16px] sm:text-headline-md text-primary truncate pr-2">{name}</h2>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            {selectHref && (
              <a
                href={selectHref}
                className="rounded-full bg-primary px-4 py-2 font-label-md text-[10px] uppercase tracking-widest text-on-primary transition-colors hover:bg-secondary sm:px-6 sm:py-2.5 sm:text-[11px]"
              >
                Pilih Template
              </a>
            )}
            <button onClick={onClose} aria-label="Tutup pratinjau" className="text-on-surface-variant hover:text-primary shrink-0">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div className="flex-1 relative min-h-0 bg-white overflow-y-auto overflow-x-hidden rounded-b-lg shadow-2xl">
          {showNotice && (
            <div
              role="status"
              className="absolute top-0 inset-x-0 z-20 flex items-start gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900"
            >
              <span className="material-symbols-outlined text-[20px] leading-5 shrink-0">wifi_off</span>
              <p className="font-body-md text-[13px] leading-5 flex-1">
                {offline
                  ? "Anda sedang offline. Pratinjau akan dimuat ulang saat koneksi kembali."
                  : "Pratinjau masih memuat aset."}
              </p>
              <button
                onClick={() => setNoticeDismissed(true)}
                className="shrink-0 rounded-full p-0.5 hover:bg-amber-100"
                aria-label="Tutup info pratinjau"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          )}

          {status === "loading" && !revealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-white px-6">
              <span className="material-symbols-outlined text-4xl text-secondary animate-pulse">hourglass_top</span>
              <p className="font-body-md text-body-md text-on-surface-variant text-center">
                {offline ? "Menunggu koneksi…" : "Memuat pratinjau…"}
              </p>
            </div>
          )}

          {/* The frame is revealed early so the page can paint progressively, but
              the browser is still fetching assets behind it. This is not a failure,
              so it only reports progress: the retry / open-in-new-tab actions stay
              in the errored state where they are actually needed. */}
          {status === "loading" && revealed && !offline && (
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-white backdrop-blur">
              <span
                className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              <span className="font-body-md text-[11px] leading-none">Memuat aset…</span>
            </div>
          )}

          {status === "errored" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 bg-white px-6">
              <span className="material-symbols-outlined text-5xl text-outline/50">play_disabled</span>
              <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-xs">
                {hasPreview
                  ? "Pratinjau tidak dapat dimuat secara otomatis"
                  : "Pratinjau belum tersedia untuk template ini"}
              </p>
              {hasPreview && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={retry}
                    className="bg-primary text-on-primary px-8 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Coba Lagi
                  </button>
                  <button
                    onClick={openTab}
                    className="bg-white border border-secondary text-secondary px-8 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                    Buka di Tab Baru
                  </button>
                </div>
              )}
            </div>
          )}

          {hasPreview && (
            <iframe
              key={attempt}
              ref={iframeRef}
              src={src}
              className={`w-full h-full border-0 ${revealed ? "block" : "invisible"}`}
              title={`Pratinjau ${name}`}
              allow="autoplay; encrypted-media"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              scrolling="yes"
              style={{ touchAction: "pan-y" }}
              onLoad={handleLoad}
              onError={handleError}
            />
          )}
        </div>
      </div>
    </div>
  )
}
