"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/imageCompress"
import { applyGaleriFrame, frameStageFlorals, normalizeFrameSelection } from "@/lib/galeriFrames"
import { newCaptureId } from "@/lib/gallery-client"
import { ASSETS } from "@/lib/assets"
import GaleriCardPreview from "@/components/gallery/GaleriCardPreview"

const MAX_CAPTION = 140
const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

type Shot = { file: File; previewUrl: string; captureId: string; aspect: number }

// Largest centered rect of `aspect` (w/h) that fits inside w x h.
function fitGuide(w: number, h: number, aspect: number, margin = 0.9) {
  let gw = w * margin
  let gh = gw / aspect
  if (gh > h * margin) {
    gh = h * margin
    gw = gh * aspect
  }
  return { x: (w - gw) / 2, y: (h - gh) / 2, w: gw, h: gh }
}

// Capture window placement: inside the free area between the two-row header
// and the control bar/rail, biased upward so it never hides behind the
// overlays. Used by both the viewfinder and the shutter so they always agree.
function captureGuide(viewW: number, viewH: number, aspect: number, landscape: boolean) {
  const reserveTop = landscape ? 10 : 112
  const reserveBottom = landscape ? 10 : 156
  const reserveRight = landscape ? 78 : 8
  const availW = Math.max(120, viewW - 8 - reserveRight)
  const availH = Math.max(120, viewH - reserveTop - reserveBottom)
  const fit = fitGuide(availW, availH, aspect, 1)
  return {
    x: 8 + (availW - fit.w) / 2,
    // Biased upward: the window sits close under the header instead of dead
    // centre, so the guest's face lands in frame without tilting the phone.
    y: reserveTop + (availH - fit.h) * 0.25,
    w: fit.w,
    h: fit.h,
  }
}

type ExtendedCapabilities = MediaTrackCapabilities & {
  torch?: boolean
  zoom?: { min: number; max: number; step: number }
}

type ExtendedTrack = Omit<MediaStreamTrack, "getCapabilities" | "applyConstraints"> & {
  getCapabilities?: () => ExtendedCapabilities
  applyConstraints?: (c: unknown) => Promise<void>
}

export type PhotoboothCameraProps = {
  coupleName: string
  dateLabel?: string
  frameId?: string
  cameraFilter?: string
  cameraName?: string
  quota: number
  initialUsed: number
  backHref: string
  doneHref: string
  // Builds the identity-specific upload payload; must POST to
  // /api/guest-photos/upload and resolve with the new used count.
  // Rejects with the user-facing error message on failure.
  uploadShot: (args: { file: File; caption: string; captureId: string }) => Promise<{ used: number }>
}

// Shared photobooth (camera + preview-with-caption), GT-styled, used by both
// the Galeri Tamu flow (/g) and Buku Tamu Digital (/welcome). Identity and
// quota enforcement stay in the callers; this component only captures,
// previews, and uploads.
export default function PhotoboothCamera(props: PhotoboothCameraProps) {
  const { coupleName, dateLabel, frameId, cameraFilter, cameraName, quota, initialUsed, backHref, doneHref, uploadShot } = props
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [used, setUsed] = useState(initialUsed)
  // The couple's frame drives both the upload bake and the caption-screen
  // preview. "none" keeps the original maroon capture UI untouched.
  const frameSelection = normalizeFrameSelection(frameId)
  const framedMode = frameSelection !== "none"
  // Preview chrome shows the SAME art the canvas bake draws for the active
  // frame (the ivory card carries the dahlia cluster).
  const stageFlorals = frameStageFlorals(frameSelection)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [flash, setFlash] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  // Real (sensor) zoom only: a CSS "zoom" would no longer be part of what the
  // capture takes now that the shutter grabs the full camera frame.
  const [zoomSupported, setZoomSupported] = useState(false)
  const [zoom, setZoom] = useState("1×")
  const [shot, setShot] = useState<Shot | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [cameraError, setCameraError] = useState("")
  const [screenAspect, setScreenAspect] = useState(0)
  const [view, setView] = useState({ w: 0, h: 0 })
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenSupported, setFullscreenSupported] = useState(false)
  const [fullscreenHint, setFullscreenHint] = useState("")
  // Capture orientation: follow the device layout by default, but let the guest
  // force Tegak/Mendatar (rotation lock and some in-app browsers never rotate
  // the page, so the box alone cannot tell us how they are holding it).
  const [orientation, setOrientation] = useState<"auto" | "portrait" | "landscape">("auto")

  const remaining = Math.max(0, quota - used)

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    try {
      setCameraError("")
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      // Request HD: without width/height ideals browsers fall back to
      // 640x480, and the 1600px canvas cap below can only downscale —
      // never recover — detail. `ideal` degrades gracefully on weak hardware.
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const track = stream.getVideoTracks()[0] as ExtendedTrack | undefined
      setTorchOn(!!track?.getCapabilities?.().torch)
      setZoomSupported(!!track?.getCapabilities?.().zoom)
    } catch {
      setCameraError("Kamera tidak dapat diakses. Izinkan akses kamera.")
    }
  }, [])

  useEffect(() => {
    if (!shot) startCamera(facing)
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [facing, shot, startCamera])

  // Track the screen aspect so the hint follows rotation (and InAppBrowser
  // quirks where the page does not re-layout).
  useEffect(() => {
    const measure = () => setScreenAspect(window.innerWidth / Math.max(1, window.innerHeight))
    measure()
    window.addEventListener("resize", measure)
    window.addEventListener("orientationchange", measure)
    return () => {
      window.removeEventListener("resize", measure)
      window.removeEventListener("orientationchange", measure)
    }
  }, [])

  // The capture window is a designed crop (4:3 when the phone is landscape,
  // 4:5 when portrait) — that keeps guest photos and the baked cards
  // proportional. It follows the LIVE element box, never a cached stream size:
  // several browsers swap the camera frame on rotation without firing
  // `loadedmetadata`, which made a landscape phone crop as portrait.
  useEffect(() => {
    const screen = screenRef.current
    if (!screen) return
    const measure = () => setView({ w: screen.clientWidth, h: screen.clientHeight })
    measure()
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null
    if (ro) ro.observe(screen)
    window.addEventListener("resize", measure)
    window.addEventListener("orientationchange", measure)
    return () => {
      if (ro) ro.disconnect()
      window.removeEventListener("resize", measure)
      window.removeEventListener("orientationchange", measure)
    }
  }, [shot])

  const screenLandscape = view.w > 0 && view.h > 0 ? view.w >= view.h : screenAspect >= 1
  const landscapeView =
    orientation === "landscape"
      ? true
      : orientation === "portrait"
        ? false
        : view.w > 0 && view.h > 0
          ? view.w >= view.h
          : screenAspect >= 1
  // Tegak = 4:5 (fills the width on a portrait screen). Mendatar = the actual
  // landscape screen ratio when the page is landscape (so the guide fills the
  // screen with no empty side bands); 16:9 when forced on a portrait screen.
  const screenRatio = view.w > 0 && view.h > 0 ? view.w / view.h : screenAspect || 1
  const targetAspect = landscapeView
    ? screenLandscape && screenRatio > 1
      ? Math.min(2.6, Math.max(1.4, screenRatio))
      : 16 / 9
    : 4 / 5
  const guide = view.w > 0 && view.h > 0 ? captureGuide(view.w, view.h, targetAspect, screenLandscape) : null

  // The viewfinder box mounts after the first layout pass, and remounts on
  // retake: re-attach the already-open stream so the preview never waits for a
  // second getUserMedia.
  useEffect(() => {
    const video = videoRef.current
    const stream = streamRef.current
    if (!video || !stream) return
    if (video.srcObject !== stream) {
      video.srcObject = stream
      void video.play().catch(() => {})
    }
  }, [view.w, view.h, shot])

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0] as ExtendedTrack | undefined
    if (!track?.applyConstraints || !torchOn) return
    track.applyConstraints({ advanced: [{ torch: flash }] }).catch(() => {})
  }, [flash, torchOn])

  // Fullscreen removes the browser chrome so the viewfinder can use the whole
  // display. iOS Safari does not expose the API for non-video elements, so the
  // control only renders where it actually works.
  useEffect(() => {
    type FsDoc = Document & { webkitFullscreenElement?: Element | null }
    type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
    const doc = document as FsDoc
    const el = document.documentElement as FsEl
    setFullscreenSupported(typeof el.requestFullscreen === "function" || typeof el.webkitRequestFullscreen === "function")
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement || doc.webkitFullscreenElement))
    update()
    document.addEventListener("fullscreenchange", update)
    document.addEventListener("webkitfullscreenchange", update as EventListener)
    return () => {
      document.removeEventListener("fullscreenchange", update)
      document.removeEventListener("webkitfullscreenchange", update as EventListener)
    }
  }, [])

  const toggleFullscreen = async (): Promise<boolean> => {
    type FsDoc = Document & { webkitFullscreenElement?: Element | null; webkitExitFullscreen?: () => Promise<void> }
    type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }
    const doc = document as FsDoc
    try {
      const active = document.fullscreenElement || doc.webkitFullscreenElement
      if (active) {
        if (document.exitFullscreen) await document.exitFullscreen()
        else await doc.webkitExitFullscreen?.()
        return true
      }
      // Try <html>, then <body>, then the vendor-prefixed variants — in-app
      // browsers implement different subsets.
      const targets = [document.documentElement as FsEl, document.body as FsEl]
      for (const el of targets) {
        try {
          if (typeof el.requestFullscreen === "function") {
            await el.requestFullscreen({ navigationUI: "hide" })
            if (document.fullscreenElement || doc.webkitFullscreenElement) return true
          } else if (typeof el.webkitRequestFullscreen === "function") {
            await el.webkitRequestFullscreen()
            if (document.fullscreenElement || doc.webkitFullscreenElement) return true
          }
        } catch {}
      }
      setFullscreenHint("Layar penuh diblokir browser ini — tutup tab aplikasi lalu buka di Chrome")
      return false
    } catch {
      return false
    }
  }

  // Chrome only grants fullscreen on a user gesture, so arm a one-shot
  // listener: the first tap anywhere in the camera puts it fullscreen.
  const fullscreenArmed = useRef(false)
  useEffect(() => {
    if (!fullscreenSupported) return
    const onFirstTap = () => {
      if (fullscreenArmed.current) return
      fullscreenArmed.current = true
      if (!document.fullscreenElement && !(document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement) {
        void toggleFullscreen()
      }
    }
    window.addEventListener("pointerdown", onFirstTap, { once: true })
    return () => window.removeEventListener("pointerdown", onFirstTap)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullscreenSupported])

  const applyZoom = (label: string) => {
    setZoom(label)
    const target = label === "1×" ? 1 : Number(label) || 1
    const track = streamRef.current?.getVideoTracks()[0] as ExtendedTrack | undefined
    if (track?.getCapabilities) {
      try {
        const caps = track.getCapabilities()
        if (caps.zoom && target >= caps.zoom.min && target <= caps.zoom.max) {
          track.applyConstraints?.({ advanced: [{ zoom: target }] }).catch(() => {})
        }
      } catch {}
    }
  }

  const captureFromVideo = async (): Promise<{ file: File; aspect: number } | null> => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return null
    const vw = video.videoWidth
    const vh = video.videoHeight
    const Ew = video.clientWidth || view.w
    const Eh = video.clientHeight || view.h
    if (!Ew || !Eh) return null
    // Take exactly the rect the viewfinder outlines. Aspect follows the chosen
    // orientation (auto = the live layout box), and the rect is mapped through
    // the object-cover transform so the framing is whatever the guest sees.
    const shotAspect = targetAspect
    const g = captureGuide(Ew, Eh, shotAspect, screenLandscape)
    const cover = Math.max(Ew / vw, Eh / vh)
    const offX = (Ew - vw * cover) / 2
    const offY = (Eh - vh * cover) / 2
    const sw = g.w / cover
    const sh = g.h / cover
    const sx = Math.max(0, Math.min(vw - sw, (g.x - offX) / cover))
    const sy = Math.max(0, Math.min(vh - sh, (g.y - offY) / cover))
    // Cap the long edge at 1800px — the same budget the upload cap expects.
    const out = Math.min(1, 1800 / Math.max(sw, sh))
    canvas.width = Math.round(sw * out)
    canvas.height = Math.round(sh * out)
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.88))
    if (!blob) return null
    const aspect = canvas.width / Math.max(1, canvas.height)
    return { file: new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }), aspect }
  }

  const takeShot = async (file: File, aspect: number) => {
    const compressed = await compressImage(file)
    setShot({ file: compressed, previewUrl: URL.createObjectURL(compressed), captureId: newCaptureId(), aspect })
    setCaption("")
    setError("")
  }

  const handleShutter = async () => {
    if (remaining <= 0) {
      setError("Slot foto Anda sudah habis.")
      return
    }
    const captured = await captureFromVideo()
    if (!captured) {
      setError("Gagal mengambil foto. Coba lagi.")
      return
    }
    // Shutter feedback on every capture (the torch toggle drives the
    // continuous LED separately).
    {
      const el = document.getElementById("gt-flash")
      if (el) {
        el.classList.remove("opacity-0")
        el.classList.add("opacity-95")
        setTimeout(() => {
          el.classList.remove("opacity-95")
          el.classList.add("opacity-0")
        }, 120)
      }
    }
    await takeShot(captured.file, captured.aspect)
  }

  const handleUpload = async () => {
    if (!shot || uploading) return
    if (remaining <= 0) {
      setError("Slot foto Anda sudah habis.")
      return
    }
    setUploading(true)
    setError("")
    try {
      // Bake the couple-selected frame into the JPG (couple/date + caption on
      // the legacy frames). applyGaleriFrame never throws: worst case the raw
      // shot uploads.
      const framed = await applyGaleriFrame(shot.file, {
        frame: frameSelection,
        couple: coupleName,
        date: dateLabel || "",
        caption: caption.trim(),
        cameraFilter: cameraFilter || "",
      })
      // Baking the frame can re-encode at source size; normalize once more so
      // the server's 1.5MB guest cap is met without a rejected upload.
      const upload = await compressImage(framed, {
        maxDimension: 1800,
        maxBytes: 1.5 * 1024 * 1024,
        initialQuality: 0.88,
      })
      const result = await uploadShot({ file: upload, caption: caption.trim(), captureId: shot.captureId })
      setUsed(result.used)
      URL.revokeObjectURL(shot.previewUrl)
      setShot(null)
      setCaption("")
      router.push(doneHref)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah foto")
    } finally {
      setUploading(false)
    }
  }

  const frameLabel = quota > 0 ? `Frame ${Math.min(used + 1, quota)}/${quota}` : ""

  return (
    <main className="relative w-full h-[100dvh] min-h-[100dvh] overflow-hidden bg-black select-none flex flex-col justify-between">
      {!shot ? (
        <>
          <div
            ref={screenRef}
            className="absolute inset-0 z-0 overflow-hidden bg-black"
            // A tap on the preview drops the browser chrome (trusted gesture).
            onClick={() => {
              if (!isFullscreen && fullscreenSupported) void toggleFullscreen()
            }}
          >
            {/* Full-screen viewfinder; the outlined rect is exactly the shot. */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
              style={cameraFilter ? { filter: cameraFilter } : undefined}
            />
            <canvas ref={canvasRef} className="hidden" />
            {guide && (
              <div
                className="absolute pointer-events-none rounded-[6px]"
                style={{
                  left: guide.x,
                  top: guide.y,
                  width: guide.w,
                  height: guide.h,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,0.22)",
                  outline: "1px solid rgba(255,255,255,0.35)",
                }}
              >
                <span className="absolute w-5 h-5 border-t-2 border-l-2 border-white/85 rounded-tl-sm" style={{ top: 6, left: 6 }} />
                <span className="absolute w-5 h-5 border-t-2 border-r-2 border-white/85 rounded-tr-sm" style={{ top: 6, right: 6 }} />
                <span className="absolute w-5 h-5 border-b-2 border-l-2 border-white/85 rounded-bl-sm" style={{ bottom: 6, left: 6 }} />
                <span className="absolute w-5 h-5 border-b-2 border-r-2 border-white/85 rounded-br-sm" style={{ bottom: 6, right: 6 }} />
              </div>
            )}
          </div>
          <div id="gt-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none z-40 transition-opacity duration-150" />

          <header
            className={`relative z-20 w-full px-4 pt-4 flex gap-2 ${
              screenLandscape ? "flex-row items-center justify-between" : "flex-col"
            }`}
          >
            {/* Row 1 — the main chip: couple + date on one line. */}
            <div className={`flex items-center gap-2 ${screenLandscape ? "max-w-[54%] shrink-0" : ""}`}>
              <button
                aria-label="Kembali"
                onClick={() => router.push(backHref)}
                className="w-10 h-10 shrink-0 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
              <div className="flex-1 min-w-0 flex items-center justify-center px-3.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                <div className="flex flex-col items-center text-center min-w-0">
                  <span className="w-full text-[13px] text-white leading-tight font-semibold truncate text-center" style={{ fontFamily: "Playfair Display" }}>{coupleName}</span>
                  {dateLabel && <span className="w-full text-[8.5px] uppercase tracking-[0.18em] text-[#ffddba] opacity-90 leading-tight mt-0.5 truncate text-center">{dateLabel}</span>}
                </div>
              </div>
            </div>
            {/* Row 2 — count + camera (+ fullscreen). */}
            <div className="flex items-center justify-center gap-1.5">
              <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#ffddba] animate-pulse" />
                <span className="text-[10px] text-white tracking-wider uppercase font-semibold whitespace-nowrap">{frameLabel}</span>
              </div>
              {cameraName && (
                <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
                  <span className="material-symbols-outlined text-[13px] text-white/80">camera</span>
                  <span className="text-[10px] text-white tracking-wider uppercase font-semibold whitespace-nowrap">{cameraName}</span>
                </div>
              )}
              {fullscreenSupported && !screenLandscape && (
                <button
                  aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
                  onClick={() => void toggleFullscreen()}
                  className={`h-7 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center gap-1 border border-white/20 active:scale-95 transition-transform ${isFullscreen ? "w-7" : "px-2.5"}`}
                >
                  <span className="material-symbols-outlined text-[16px]">{isFullscreen ? "fullscreen_exit" : "fullscreen"}</span>
                  {!isFullscreen && <span className="text-[9px] font-semibold uppercase tracking-wider">Penuh</span>}
                </button>
              )}
            </div>
          </header>

          {cameraError && (
            <p className="relative z-20 mx-6 mt-3 text-center text-[13px] text-white bg-black/60 rounded-xl px-4 py-3">{cameraError}</p>
          )}
          {error && (
            <p className="relative z-20 mx-6 mt-3 text-center text-[13px] text-white bg-black/60 rounded-xl px-4 py-3">{error}</p>
          )}
          {fullscreenHint && (
            <p className="relative z-20 mx-6 mt-3 text-center text-[12px] text-white bg-black/70 rounded-xl px-4 py-2">{fullscreenHint}</p>
          )}

          {screenLandscape && fullscreenSupported && (
            <button
              aria-label={isFullscreen ? "Keluar layar penuh" : "Layar penuh"}
              onClick={() => void toggleFullscreen()}
              className="absolute bottom-3 left-3 z-20 h-9 px-2.5 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center gap-1 border border-white/20 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[18px]">{isFullscreen ? "fullscreen_exit" : "fullscreen"}</span>
              {!isFullscreen && <span className="text-[9px] font-semibold uppercase tracking-wider">Penuh</span>}
            </button>
          )}
          {screenLandscape && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20">
              <button
                aria-label="Foto tegak"
                onClick={() => {
                  setOrientation("portrait")
                  if (!isFullscreen && fullscreenSupported) void toggleFullscreen()
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors ${!landscapeView ? "bg-white text-black" : "text-white/80"}`}
              >
                <span className="material-symbols-outlined text-[14px]">crop_portrait</span>
                Tegak
              </button>
              <button
                aria-label="Foto mendatar"
                onClick={() => {
                  setOrientation("landscape")
                  if (!isFullscreen && fullscreenSupported) void toggleFullscreen()
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors ${landscapeView ? "bg-white text-black" : "text-white/80"}`}
              >
                <span className="material-symbols-outlined text-[14px]">crop_landscape</span>
                Mendatar
              </button>
            </div>
          )}
          <footer
            className={
              screenLandscape
                ? "absolute right-1.5 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2.5"
                : "relative z-20 w-full px-6 pb-6 pt-3 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            }
          >
            <div className={`flex items-center gap-1.5 p-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 ${screenLandscape ? "hidden" : ""}`}>
              <button
                aria-label="Foto tegak"
                onClick={() => {
                  setOrientation("portrait")
                  if (!isFullscreen && fullscreenSupported) void toggleFullscreen()
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors ${!landscapeView ? "bg-white text-black" : "text-white/80"}`}
              >
                <span className="material-symbols-outlined text-[14px]">crop_portrait</span>
                Tegak
              </button>
              <button
                aria-label="Foto mendatar"
                onClick={() => {
                  setOrientation("landscape")
                  if (!isFullscreen && fullscreenSupported) void toggleFullscreen()
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase transition-colors ${landscapeView ? "bg-white text-black" : "text-white/80"}`}
              >
                <span className="material-symbols-outlined text-[14px]">crop_landscape</span>
                Mendatar
              </button>
            </div>
            <div className={screenLandscape ? "flex flex-col items-center gap-2.5" : "w-full flex items-center justify-between max-w-xs px-2"}>
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label="Flash kamera"
                  onClick={() => torchOn && setFlash((v) => !v)}
                  disabled={!torchOn}
                  className={`w-12 h-12 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center active:scale-90 transition-transform group ${!torchOn ? "bg-black/40 border-white/20 text-white/40" : flash ? "bg-white text-black border-white" : "bg-black/60 border-white/30 text-white"}`}
                >
                  <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">{flash && torchOn ? "flash_on" : "flash_off"}</span>
                </button>
                {!screenLandscape && <span className="text-[10px] text-white/90 font-medium tracking-wider uppercase">Flash</span>}
              </div>
              <button
                aria-label="Ambil foto"
                onClick={handleShutter}
                className="w-20 h-20 rounded-full bg-[#6b2b2d] p-1.5 shadow-2xl active:scale-95 transition-all ring-4 ring-white/40"
              >
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1">
                  <div className="w-full h-full rounded-full flex items-center justify-center" style={{ backgroundColor: "#4f1519" }}>
                    <span className="material-symbols-outlined text-white text-[26px]">photo_camera</span>
                  </div>
                </div>
              </button>
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label="Putar kamera"
                  onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
                  className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-white active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined text-[24px]">flip_camera_ios</span>
                </button>
                {!screenLandscape && <span className="text-[10px] text-white/90 font-medium tracking-wider uppercase">Putar</span>}
              </div>
            </div>
            {zoomSupported && (
              <div className="flex items-center gap-2">
                {(["1×", "2", "3"] as const).map((z) => (
                  <button
                    key={z}
                    onClick={() => applyZoom(z)}
                    className={`w-9 h-9 rounded-full text-[12px] font-bold ${zoom === z ? "bg-white text-black" : "bg-black/60 text-white border border-white/30"}`}
                  >
                    {z}
                  </button>
                ))}
              </div>
            )}
          </footer>
        </>
      ) : framedMode ? (
        <div className="relative flex-1 flex flex-col w-full min-h-0 px-4 pt-3 pb-4 overflow-hidden" style={{ ...SANS, backgroundColor: "#fbf9f4", color: "#1b1c19" }}>
          <div className="w-full flex items-center gap-3 h-14 max-w-lg mx-auto shrink-0">
            <button
              aria-label="Kembali"
              onClick={() => {
                if (shot) URL.revokeObjectURL(shot.previewUrl)
                setShot(null)
                setCaption("")
                setError("")
              }}
              className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-[#1b1c19] hover:bg-[#f0eee9] transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold truncate" style={{ color: "#6b2b2d" }}>{coupleName}</span>
              <h1 className="text-[18px] leading-[26px] font-semibold -mt-0.5" style={SERIF}>Live Capture Session</h1>
            </div>
            <div className="ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full" style={{ backgroundColor: "#f0eee9", color: "#4f1519" }}>
              <span className="material-symbols-outlined text-[14px]">camera_roll</span>
              <span className="text-[10px] tracking-wider uppercase font-semibold">
                {quota > 0 ? `Foto ${Math.min(used + 1, quota)}/${quota}` : "Foto"}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 w-full flex flex-col items-center gap-3 pt-1">
            {/* The card IS the uploaded JPG: same painter, same frame art.
                It scales to whatever space is left, so nothing ever scrolls. */}
            <div className="flex-1 min-h-0 flex items-center justify-center w-full">
              <GaleriCardPreview
                imageUrl={shot.previewUrl}
                frame={frameSelection}
                couple={coupleName}
                date={dateLabel || ""}
                caption={caption}
                cameraFilter={cameraFilter}
                className="max-h-full rounded-[0.85rem] shadow-[0_18px_40px_-18px_rgba(27,28,25,0.35)]"
              />
            </div>

            <div className="w-full max-w-[540px] shrink-0 flex flex-col gap-3">
            {/* Caption lives OUTSIDE the frame: it is stored with the photo
                and shown in the gallery / keepsake book. */}
            <div className="w-full rounded-[1.1rem] border border-[#d9c1c0]/60 bg-white px-4 py-2.5 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="gt-caption" className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] font-semibold" style={{ color: "#6b2b2d" }}>
                  <span className="material-symbols-outlined text-[15px] opacity-80">edit_note</span>
                  Pesan Kenangan
                </label>
                <span className="text-[10px] font-medium tracking-wide text-[#444841]/60">{caption.length}/{MAX_CAPTION}</span>
              </div>
              <textarea
                id="gt-caption"
                rows={2}
                maxLength={MAX_CAPTION}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={`Tulis ucapan atau cerita untuk ${coupleName}...`}
                className="w-full bg-transparent resize-none border-0 p-0 text-[#1b1c19] placeholder:text-[#444841]/40 text-[13px] focus:outline-none focus:ring-0 leading-relaxed"
              />
              <p className="text-[10.5px] leading-snug text-[#444841]/70 mt-1.5">
                Pesan tersimpan bersama foto di galeri &amp; buku kenangan.
              </p>
            </div>

            {error && (
              <p className="text-[13px] text-[#93000a] text-center" role="alert">{error}</p>
            )}

            <div className="w-full grid grid-cols-2 gap-3.5">
              <button
                onClick={() => {
                  URL.revokeObjectURL(shot.previewUrl)
                  setShot(null)
                  setCaption("")
                  setError("")
                }}
                disabled={uploading}
                className="h-12 w-full rounded-full border border-[#6b2b2d]/35 bg-white hover:bg-[#f5f3ee] active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 text-[13px] font-semibold tracking-wide shadow-sm disabled:opacity-50"
                style={{ color: "#6b2b2d" }}
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                Ulangi Foto
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="h-12 w-full rounded-full hover:brightness-110 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 font-semibold text-[13px] tracking-wide shadow-md disabled:opacity-50"
                style={{ backgroundColor: "#6b2b2d", color: "#fbf9f4" }}
              >
                {uploading ? "Mengunggah..." : "Lanjut"}
                {!uploading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex-1 flex flex-col w-full px-5 pt-4 pb-8 overflow-y-auto" style={{ ...SANS, backgroundColor: "#fbf9f4", color: "#1b1c19" }}>
          <div className="w-full flex items-center gap-3 h-16 max-w-lg mx-auto">
            <button
              aria-label="Kembali"
              onClick={() => {
                if (shot) URL.revokeObjectURL(shot.previewUrl)
                setShot(null)
                setCaption("")
                setError("")
              }}
              className="w-11 h-11 -ml-1 rounded-full flex items-center justify-center text-[#1b1c19] hover:bg-[#f0eee9] transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] uppercase tracking-[0.14em] font-semibold truncate" style={{ color: "#6b2b2d" }}>{coupleName}</span>
              <h1 className="text-[18px] leading-[26px] font-semibold -mt-0.5" style={SERIF}>Live Capture Session</h1>
            </div>
          </div>

          <div className="flex flex-col w-full pb-6 max-w-lg mx-auto">
            <div className="relative w-full rounded-[1rem] px-5 pt-7 pb-6 flex flex-col items-center shadow-xl overflow-hidden" style={{ backgroundColor: "#6b2b2d", color: "#fbf9f4" }}>
              {stageFlorals.tr && (
                <img src={stageFlorals.tr} alt="" aria-hidden className="absolute -top-12 -right-8 w-44 object-contain pointer-events-none z-0 select-none" style={{ transform: "rotate(12deg)", opacity: 0.8 }} />
              )}
              {stageFlorals.tl && (
                <img src={stageFlorals.tl} alt="" aria-hidden className="absolute -top-12 -left-8 w-44 object-contain pointer-events-none z-0 select-none" style={{ transform: "rotate(-12deg)", opacity: 0.8 }} />
              )}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: "rgba(107, 43, 45, 0.4)" }} />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: "rgba(145,73,74,0.15)" }} />

              <div className="flex flex-col items-center text-center z-10 w-full mb-6" style={{ gap: 6 }}>
                <div className="flex items-center justify-center mb-1">
                  <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="h-10 w-10 rounded-full object-cover drop-shadow-sm bg-white" style={{ opacity: 0.95 }} />
                </div>
                <h2 className="text-[28px] leading-9 font-medium tracking-tight" style={SERIF}>{coupleName}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm mt-1" style={{ backgroundColor: "rgba(79, 21, 25, 0.55)" }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: "#ffdea4" }}>camera_roll</span>
                  <span className="text-[11px] text-[#fbf9f4] tracking-wider italic">Foto {Math.min(used + 1, quota) || 1} dari {quota || "–"}</span>
                </div>
              </div>

              <div
                className="relative w-full max-w-[340px] rounded-[1rem] overflow-hidden bg-black shadow-2xl flex items-center justify-center select-none"
                style={{ aspectRatio: String(shot.aspect || 4 / 3) }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.previewUrl} alt="Pratinjau foto" className="w-full h-full object-cover" style={cameraFilter ? { filter: cameraFilter } : undefined} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute inset-3 rounded-[1rem] pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-white/70 rounded-tl-sm" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-white/70 rounded-tr-sm" />
                  </div>
                  <div className="self-center flex items-center gap-1 opacity-50">
                    <div className="w-3 h-px bg-white" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    <div className="w-3 h-px bg-white" />
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-white/70 rounded-bl-sm" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-white/70 rounded-br-sm" />
                  </div>
                </div>
              </div>

              <div className="w-full max-w-[340px] z-10 mb-4 px-1 py-1 flex flex-col gap-1.5 mt-3">
                <div className="flex items-center justify-between" style={{ color: "rgba(255,218,217,0.8)" }}>
                  <label htmlFor="gt-caption" className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,218,217,0.9)" }}>
                    <span className="material-symbols-outlined text-[15px] opacity-80">edit_note</span>
                    Pesan Kenangan
                  </label>
                  <span className="text-[10px] font-medium tracking-wide" style={{ color: "rgba(255,218,217,0.6)" }}>{caption.length}/{MAX_CAPTION}</span>
                </div>
                <div className="relative flex items-center border-b border-white/30 focus-within:border-white/80 transition-colors pb-1.5">
                  <textarea
                    id="gt-caption"
                    rows={2}
                    maxLength={MAX_CAPTION}
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder={`Tulis ucapan atau cerita untuk ${coupleName}...`}
                    className="w-full bg-transparent resize-none border-0 p-0 text-[#fbf9f4] placeholder:text-white/40 text-[13px] focus:outline-none focus:ring-0 leading-relaxed"
                  />
                </div>
              </div>

              {error && <p className="text-[13px] text-[#ffdad9] mb-3 text-center max-w-[340px] z-10">{error}</p>}

              <div className="w-full max-w-[340px] grid grid-cols-2 gap-3.5 z-10 mb-2">
                <button
                  onClick={() => {
                    URL.revokeObjectURL(shot.previewUrl)
                    setShot(null)
                    setCaption("")
                    setError("")
                  }}
                  disabled={uploading}
                  className="h-12 w-full rounded-full bg-black/20 hover:bg-black/30 active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 text-[#fbf9f4] text-[13px] font-semibold tracking-wide shadow-sm disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  Ulangi Foto
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="h-12 w-full rounded-full bg-[#fbf9f4] hover:bg-white active:scale-95 transition-all duration-200 flex items-center justify-center gap-1.5 font-semibold text-[13px] tracking-wide shadow-md disabled:opacity-50"
                  style={{ color: "#6b2b2d" }}
                >
                  {uploading ? "Mengunggah..." : "Lanjut"}
                  {!uploading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
                </button>
              </div>

              {stageFlorals.bl && (
                <img src={stageFlorals.bl} alt="" aria-hidden className="absolute -bottom-10 -left-6 w-36 object-contain pointer-events-none z-0 select-none" style={{ transform: "rotate(-6deg)", opacity: 0.75 }} />
              )}
              {stageFlorals.br && (
                <img src={stageFlorals.br} alt="" aria-hidden className="absolute -bottom-10 -right-6 w-36 object-contain pointer-events-none z-0 select-none" style={{ transform: "rotate(6deg)", opacity: 0.75 }} />
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
