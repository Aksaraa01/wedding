"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { compressImage } from "@/lib/imageCompress"
import { newCaptureId } from "@/lib/gallery-client"
import { ASSETS } from "@/lib/assets"

const MAX_CAPTION = 140
const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

type Shot = { file: File; previewUrl: string; captureId: string }

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
  const { coupleName, dateLabel, quota, initialUsed, backHref, doneHref, uploadShot } = props
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [used, setUsed] = useState(initialUsed)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [flash, setFlash] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const [zoom, setZoom] = useState("1×")
  const [shot, setShot] = useState<Shot | null>(null)
  const [caption, setCaption] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [cameraError, setCameraError] = useState("")

  const remaining = Math.max(0, quota - used)

  const startCamera = useCallback(async (mode: "environment" | "user") => {
    try {
      setCameraError("")
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode }, audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      const track = stream.getVideoTracks()[0] as ExtendedTrack | undefined
      setTorchOn(!!track?.getCapabilities?.().torch)
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

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0] as ExtendedTrack | undefined
    if (!track?.applyConstraints || !torchOn) return
    track.applyConstraints({ advanced: [{ torch: flash }] }).catch(() => {})
  }, [flash, torchOn])

  const applyZoom = (label: string) => {
    setZoom(label)
    const target = label === "1×" ? 1 : Number(label) || 1
    const video = videoRef.current
    const track = streamRef.current?.getVideoTracks()[0] as ExtendedTrack | undefined
    if (track?.getCapabilities) {
      try {
        const caps = track.getCapabilities()
        if (caps.zoom && target >= caps.zoom.min && target <= caps.zoom.max) {
          track.applyConstraints?.({ advanced: [{ zoom: target }] }).catch(() => {})
          if (video) video.style.transform = "scale(1)"
          return
        }
      } catch {}
    }
    if (video) video.style.transform = `scale(${target})`
  }

  const captureFromVideo = async (): Promise<File | null> => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return null
    const vw = video.videoWidth
    const vh = video.videoHeight
    // 4:3 cover crop, capped at 1600px — matches the gallery card frame and
    // keeps uploads small before client compression.
    const targetAspect = 4 / 3
    const videoAspect = vw / vh
    let sx = 0, sy = 0, sw = vw, sh = vh
    if (videoAspect > targetAspect) {
      sw = Math.round(vh * targetAspect)
      sx = Math.round((vw - sw) / 2)
    } else {
      sh = Math.round(vw / targetAspect)
      sy = Math.round((vh - sh) / 2)
    }
    const scale = Math.min(1, 1600 / Math.max(sw, sh))
    canvas.width = Math.round(sw * scale)
    canvas.height = Math.round(sh * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.88))
    if (!blob) return null
    return new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
  }

  const takeShot = async (file: File) => {
    const compressed = await compressImage(file)
    setShot({ file: compressed, previewUrl: URL.createObjectURL(compressed), captureId: newCaptureId() })
    setCaption("")
    setError("")
  }

  const handleShutter = async () => {
    if (remaining <= 0) {
      setError("Slot foto Anda sudah habis.")
      return
    }
    const file = await captureFromVideo()
    if (!file) {
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
    await takeShot(file)
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
      const result = await uploadShot({ file: shot.file, caption: caption.trim(), captureId: shot.captureId })
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
    <main className="relative w-full flex-1 min-h-[100dvh] overflow-hidden bg-black select-none flex flex-col justify-between">
      {!shot ? (
        <>
          <div className="absolute inset-0 z-0 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />
          </div>
          <div id="gt-flash" className="absolute inset-0 bg-white opacity-0 pointer-events-none z-40 transition-opacity duration-150" />

          <header className="relative z-20 w-full px-4 pt-4 flex items-center justify-between">
            <button
              aria-label="Kembali"
              onClick={() => router.push(backHref)}
              className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md text-white flex items-center justify-center border border-white/20 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
              <div className="flex flex-col text-left">
                <span className="text-[12px] text-white leading-none font-semibold" style={{ fontFamily: "Playfair Display" }}>{coupleName}</span>
                {dateLabel && <span className="text-[8px] uppercase tracking-widest text-[#ffddba] opacity-90 leading-tight mt-0.5">{dateLabel}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20">
              <span className="w-2 h-2 rounded-full bg-[#ffddba] animate-pulse" />
              <span className="text-[10px] text-white tracking-wider uppercase font-semibold">{frameLabel}</span>
            </div>
          </header>

          {cameraError && (
            <p className="relative z-20 mx-6 mt-3 text-center text-[13px] text-white bg-black/60 rounded-xl px-4 py-3">{cameraError}</p>
          )}
          {error && (
            <p className="relative z-20 mx-6 mt-3 text-center text-[13px] text-white bg-black/60 rounded-xl px-4 py-3">{error}</p>
          )}

          <footer className="relative z-20 w-full px-6 pb-6 pt-3 flex flex-col items-center gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
            <div className="w-full flex items-center justify-between max-w-xs px-2">
              <div className="flex flex-col items-center gap-1">
                <button
                  aria-label="Flash kamera"
                  onClick={() => torchOn && setFlash((v) => !v)}
                  disabled={!torchOn}
                  className={`w-12 h-12 rounded-full backdrop-blur-md border shadow-lg flex items-center justify-center active:scale-90 transition-transform group ${!torchOn ? "bg-black/40 border-white/20 text-white/40" : flash ? "bg-white text-black border-white" : "bg-black/60 border-white/30 text-white"}`}
                >
                  <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">{flash && torchOn ? "flash_on" : "flash_off"}</span>
                </button>
                <span className="text-[10px] text-white/90 font-medium tracking-wider uppercase">Flash</span>
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
                <span className="text-[10px] text-white/90 font-medium tracking-wider uppercase">Putar</span>
              </div>
            </div>
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
          </footer>
        </>
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
              <img src={ASSETS.galeriEnvelope.previewFloralTopRight} alt="" aria-hidden className="absolute -top-12 -right-8 w-44 object-contain pointer-events-none z-0 select-none" style={{ transform: "rotate(12deg)", opacity: 0.8 }} />
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: "rgba(107, 43, 45, 0.4)" }} />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-2xl pointer-events-none" style={{ backgroundColor: "rgba(145,73,74,0.15)" }} />

              <div className="flex flex-col items-center text-center z-10 w-full mb-6" style={{ gap: 6 }}>
                <div className="flex items-center justify-center mb-1">
                  <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="h-10 w-10 rounded-full object-cover drop-shadow-sm" style={{ filter: "brightness(0) invert(1)", opacity: 0.95 }} />
                </div>
                <h2 className="text-[28px] leading-9 font-medium tracking-tight" style={SERIF}>{coupleName}</h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm shadow-sm mt-1" style={{ backgroundColor: "rgba(79, 21, 25, 0.55)" }}>
                  <span className="material-symbols-outlined text-[14px]" style={{ color: "#ffdea4" }}>camera_roll</span>
                  <span className="text-[11px] text-[#fbf9f4] tracking-wider italic">Foto {Math.min(used + 1, quota) || 1} dari {quota || "–"}</span>
                </div>
              </div>

              <div className="relative w-full max-w-[340px] aspect-[4/3] rounded-[1rem] overflow-hidden bg-black shadow-2xl flex items-center justify-center select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shot.previewUrl} alt="Pratinjau foto" className="w-full h-full object-cover" />
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

              <img src={ASSETS.galeriEnvelope.previewFloralBottomLeft} alt="" aria-hidden className="absolute -bottom-10 -left-6 w-36 object-contain pointer-events-none z-0 select-none" style={{ transform: "rotate(-6deg)", opacity: 0.75 }} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
