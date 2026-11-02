"use client"

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"

type Props = {
  name: string
  demoUrl: string
  onClose: () => void
  /** Public gallery: choose this design without leaving the preview. */
  selectHref?: string
}

export default function TemplatePreviewModal({ name, demoUrl, onClose, selectHref }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "errored">("loading")
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

  useEffect(() => {
    safetyRef.current = setTimeout(() => {
      setStatus(s => (s === "loading" ? "errored" : s))
    }, 45000)
    return () => {
      if (safetyRef.current) clearTimeout(safetyRef.current)
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
  }, [])
  const handleError = useCallback(() => {
    if (safetyRef.current) clearTimeout(safetyRef.current)
    setStatus("errored")
  }, [])

  const openTab = useCallback(() => {
    window.open(fullUrl, "_blank", "noopener,noreferrer")
    onClose()
  }, [fullUrl, onClose])

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
          {status === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-white">
              <span className="material-symbols-outlined text-4xl text-secondary animate-pulse">hourglass_top</span>
              <p className="font-body-md text-body-md text-on-surface-variant">Memuat pratinjau&hellip;</p>
            </div>
          )}

          {status === "errored" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-10 bg-white px-6">
              <span className="material-symbols-outlined text-5xl text-outline/50">play_disabled</span>
              <p className="font-body-md text-body-md text-on-surface-variant text-center max-w-xs">
                Pratinjau tidak dapat dimuat secara otomatis
              </p>
              <button
                onClick={openTab}
                className="bg-primary text-on-primary px-10 py-4 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                Buka Pratinjau di Tab Baru
              </button>
            </div>
          )}

          <iframe
            ref={iframeRef}
            src={src}
            className={`w-full h-full border-0 ${status === "loaded" ? "block" : "invisible"}`}
            title={`Pratinjau ${name}`}
            allow="autoplay; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            scrolling="yes"
            style={{ touchAction: "pan-y" }}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      </div>
    </div>
  )
}
