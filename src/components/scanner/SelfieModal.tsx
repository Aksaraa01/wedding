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
    <div
      className="fixed inset-0 z-[90] flex flex-col w-full overflow-hidden"
      style={{ backgroundColor: "#1a0b1a", color: "#F8F5F0", height: "100dvh", paddingTop: "max(8px, env(safe-area-inset-top))", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');`}</style>

      <header className="w-full flex items-center justify-between px-4 py-3 shrink-0">
        <button
          onClick={() => onDone(false)}
          className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
          aria-label="Tutup"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
        <div className="text-center flex-1 px-4">
          <h3 className="font-serif text-[15px] font-bold text-white tracking-wide" style={{ fontFamily: "Playfair Display" }}>
            Foto Check-in
          </h3>
          <p className="text-[11px] text-white/60">
            {guestName ? <span className="font-semibold text-white">{guestName}</span> : "Tamu"} • {coupleName || "Aksaraa"}
          </p>
        </div>
        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/80 hover:bg-white/10 transition-colors"
          aria-label="Ganti kamera"
        >
          <span className="material-symbols-outlined text-lg">cameraswitch</span>
        </button>
      </header>

      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-3 sm:px-4 py-2 w-full max-w-[92vw] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[560px] mx-auto">
        {!capturedSrc ? (
          <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center max-h-[68dvh] sm:max-h-[70dvh] md:max-h-[72dvh]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            {countdown !== null ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                <span className="text-7xl font-serif text-white font-bold animate-pulse">{countdown}</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white z-10 pointer-events-none">
                <span className="material-symbols-outlined text-5xl text-white/60 animate-pulse">face</span>
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-white/50 rounded-tl-md" />
              <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-white/50 rounded-tr-md" />
              <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-white/50 rounded-bl-md" />
              <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-white/50 rounded-br-md" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-black/45 backdrop-blur-sm px-4 py-2 flex flex-col items-center gap-0.5">
              <span className="font-serif text-white text-sm tracking-widest" style={{ fontFamily: "Playfair Display" }}>
                {coupleName}
              </span>
              <span className="text-white/70 text-[10px] tracking-widest">{endDate}</span>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-h-[68dvh] sm:max-h-[70dvh] md:max-h-[72dvh]">
            <img src={capturedSrc} alt="Foto check-in" className="w-full h-full object-cover" />
          </div>
        )}
      </main>

      <footer className="w-full shrink-0 px-3 sm:px-4 pb-3 sm:pb-4 pt-3 flex flex-col gap-2 max-w-[92vw] sm:max-w-[420px] md:max-w-[520px] lg:max-w-[560px] mx-auto">
        {uploadError && <p className="text-red-400 text-xs text-center font-medium">{uploadError}</p>}
        {!capturedSrc ? (
          <>
            <button
              onClick={beginCountdown}
              disabled={countdown !== null}
              className="w-full bg-white text-black py-4 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span> Ambil Foto
            </button>
            <button
              onClick={() => onDone(false)}
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold transition-colors"
            >
              Lewati Langkah Ini
            </button>
          </>
        ) : (
          <>
            <button
              onClick={submit}
              disabled={uploading}
              className="w-full bg-white text-black py-4 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-lg"
            >
              {uploading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
              className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 py-3 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
            >
              Ulangi
            </button>
          </>
        )}
      </footer>
    </div>
  )
}