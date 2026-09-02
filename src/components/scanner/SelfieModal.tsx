"use client"

import { useEffect, useRef, useState } from "react"
import { drawSelfieFrame } from "@/lib/selfieOverlay"

interface SelfieModalProps {
  open: boolean
  guestName: string
  coupleName: string
  endDate: string
  guestId?: string | null
  weddingProfileId?: string | null
  onDone: (uploaded: boolean, error?: string) => void
}

export default function SelfieModal({
  open,
  guestName,
  coupleName,
  endDate,
  guestId,
  weddingProfileId,
  onDone,
}: SelfieModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturedSrc, setCapturedSrc] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")

  // Start the selfie camera whenever the modal opens.
  useEffect(() => {
    if (!open) return
    setCountdown(null)
    setCapturedSrc(null)
    setCapturedBlob(null)
    setUploadError("")

    const start = async (mode: "user" | "environment") => {
      try {
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
      } catch {}
    }
    start(facing)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facing])

  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const vw = video.videoWidth || 720
    const vh = video.videoHeight || 960
    const targetAspect = 3 / 4
    const videoAspect = vw / vh
    let sx = 0, sy = 0, sw = vw, sh = vh
    if (videoAspect > targetAspect) {
      sw = Math.round(vh * targetAspect)
      sx = Math.round((vw - sw) / 2)
    } else {
      sh = Math.round(vw / targetAspect)
      sy = Math.round((vh - sh) / 2)
    }
    canvas.width = 720
    canvas.height = 960
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
    void drawSelfieFrame(ctx, canvas.width, canvas.height, coupleName, endDate).then(() => {
      canvas.toBlob((b) => {
        if (!b) return
        setCapturedBlob(b)
        setCapturedSrc(URL.createObjectURL(b))
      }, "image/jpeg", 0.85)
    })
  }

  const beginCountdown = () => {
    if (countdown !== null) return
    let n = 3
    setCountdown(n)
    const tick = () => {
      n -= 1
      if (n > 0) {
        setCountdown(n)
        timerRef.current = setTimeout(tick, 1000)
      } else {
        setCountdown(null)
        capture()
      }
    }
    timerRef.current = setTimeout(tick, 1000)
  }

  const retake = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setCountdown(null)
    setCapturedSrc(null)
    setCapturedBlob(null)
    setUploadError("")
  }

  const submit = async () => {
    if (!capturedBlob) return
    if (!guestId || !weddingProfileId) {
      onDone(false)
      return
    }
    setUploading(true)
    setUploadError("")
    try {
      const file = new File([capturedBlob], `selfie-${Date.now()}.jpg`, { type: "image/jpeg" })
      const form = new FormData()
      form.append("file", file)
      form.append("guest_id", guestId)
      form.append("wedding_profile_id", weddingProfileId)
      form.append("source", "selfie")
      const res = await fetch("/api/guest-photos/upload", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto")
      onDone(true)
    } catch (err: any) {
      setUploadError(err?.message || "Gagal mengunggah foto. Coba lagi atau lewati.")
      setUploading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="bg-background border border-outline-variant w-full max-w-[min(92vw,26rem)] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-5 sm:p-6 text-center space-y-4 shrink-0">
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-primary">Foto Check-in</h3>
            <p className="text-xs text-on-surface-variant/80">
              Dokumentasikan kehadiran {guestName ? <span className="font-semibold text-primary">{guestName}</span> : "tamu"} Anda.
            </p>
          </div>

          {!capturedSrc ? (
            <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden border border-outline-variant flex items-center justify-center max-h-[50dvh]">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />
              {countdown !== null ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                  <span className="text-7xl font-serif text-white font-bold animate-pulse">{countdown}</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white z-10 pointer-events-none">
                  <span className="material-symbols-outlined text-5xl text-white/70 animate-pulse">face</span>
                </div>
              )}
              <div className="absolute inset-0 pointer-events-none z-20">
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-md" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-md" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-md" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-md" />
              </div>
            </div>
          ) : (
            <div className="relative w-full aspect-[3/4] bg-black rounded-xl overflow-hidden border border-outline-variant max-h-[50dvh]">
              <img src={capturedSrc} alt="Foto check-in" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6 pt-1 space-y-3 overflow-y-auto shrink-0">
          {uploadError && (
            <p className="text-error text-xs text-center font-medium">{uploadError}</p>
          )}
          {!capturedSrc ? (
            <>
              <button
                onClick={beginCountdown}
                disabled={countdown !== null}
                className="w-full bg-primary hover:bg-secondary text-on-primary py-3.5 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span> Ambil Foto
              </button>
              <button
                onClick={() => onDone(false)}
                className="w-full bg-transparent hover:bg-surface-container text-on-surface-variant border border-outline-variant/60 py-3 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all"
              >
                Lewati Langkah Ini
              </button>
            </>
          ) : (
            <>
              <button
                onClick={submit}
                disabled={uploading}
                className="w-full bg-primary hover:bg-secondary text-on-primary py-3.5 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan Foto...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm">check</span> Simpan Foto
                  </>
                )}
              </button>
              <button
                onClick={retake}
                disabled={uploading}
                className="w-full bg-transparent hover:bg-surface-container text-on-surface-variant border border-outline-variant/60 py-3 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all disabled:opacity-50"
              >
                Ulangi
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}