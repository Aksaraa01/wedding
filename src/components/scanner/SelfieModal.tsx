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
          // HD ideals (see PhotoboothCamera): no constraint = 640x480 feed
          // that the 1080x1440 canvas would merely upscale without detail.
          video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
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
    // 1080x1440 HD capture (3:4). Frame overlay scales proportionally;
    // output stays well under the 2MB upload cap at q0.85.
    canvas.width = 1080
    canvas.height = 1440
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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[90] w-full h-[100dvh] overflow-hidden bg-black flex flex-col" style={{ color: "#F8F5F0" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');`}</style>

      {/* Full-bleed camera */}
      <div className="absolute inset-0 w-full h-full">
        {!capturedSrc ? (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </>
        ) : (
          <img src={capturedSrc} alt="Foto check-in" className="absolute inset-0 w-full h-full object-contain" />
        )}
        {/* Viewfinder frame corners */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute top-[max(16px,env(safe-area-inset-top))] left-4 w-10 h-10 border-t-2 border-l-2 border-white/60 rounded-tl-lg" />
          <div className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 w-10 h-10 border-t-2 border-r-2 border-white/60 rounded-tr-lg" />
          <div className="absolute bottom-[max(120px,calc(env(safe-area-inset-bottom)+96px))] left-4 w-10 h-10 border-b-2 border-l-2 border-white/60 rounded-bl-lg" />
          <div className="absolute bottom-[max(120px,calc(env(safe-area-inset-bottom)+96px))] right-4 w-10 h-10 border-b-2 border-r-2 border-white/60 rounded-br-lg" />
        </div>
        {/* Countdown overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 z-20">
            <span className="text-8xl font-serif text-white font-bold animate-pulse">{countdown}</span>
          </div>
        )}
        {!capturedSrc && countdown === null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="material-symbols-outlined text-6xl text-white/50 animate-pulse">face</span>
          </div>
        )}
        {/* Couple name/date band (preview) */}
        <div className="absolute bottom-[max(96px,calc(env(safe-area-inset-bottom)+72px))] left-0 right-0 bg-black/45 backdrop-blur-sm px-4 py-2.5 flex flex-col items-center gap-0.5 z-10">
          <span className="font-serif text-white text-sm tracking-widest" style={{ fontFamily: "Playfair Display" }}>
            {coupleName || "Aksaraa"}
          </span>
          <span className="text-white/70 text-[10px] tracking-widest">{endDate}</span>
        </div>
      </div>

      {/* Header overlay */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 via-black/30 to-transparent" style={{ paddingTop: "max(12px, env(safe-area-inset-top))" }}>
        <button
          onClick={() => onDone(false)}
          className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          aria-label="Tutup"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>
        <div className="text-center flex-1 px-3">
          <p className="text-[10px] uppercase tracking-[0.35em] text-white/70 font-bold">
            Foto Check-in
          </p>
          <h3 className="text-3xl font-semibold text-white tracking-wide truncate mt-1" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {guestName || "Tamu"}
          </h3>
        </div>
        <button
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="w-9 h-9 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-colors"
          aria-label="Ganti kamera"
        >
          <span className="material-symbols-outlined text-lg">cameraswitch</span>
        </button>
      </header>

      {/* Footer overlay */}
      <footer className="absolute bottom-0 inset-x-0 z-30 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col gap-2">
        {uploadError && <p className="text-red-400 text-xs text-center font-medium bg-black/50 rounded-full px-3 py-1 mx-auto">{uploadError}</p>}
        {!capturedSrc ? (
          <>
            <button
              onClick={beginCountdown}
              disabled={countdown !== null}
              className="w-full max-w-md mx-auto bg-white text-black py-4 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-xl"
            >
              <span className="material-symbols-outlined text-sm">photo_camera</span> Ambil Foto
            </button>
            <button
              onClick={() => onDone(false)}
              className="w-full max-w-md mx-auto bg-white/15 backdrop-blur-md text-white border border-white/20 py-3 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-white/25 transition-colors"
            >
              Lewati Langkah Ini
            </button>
          </>
        ) : (
          <>
            <button
              onClick={submit}
              disabled={uploading}
              className="w-full max-w-md mx-auto bg-white text-black py-4 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold flex justify-center items-center gap-2 disabled:opacity-50 shadow-xl"
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
              className="w-full max-w-md mx-auto bg-white/15 backdrop-blur-md text-white border border-white/20 py-3 rounded-full font-sans text-[11px] uppercase tracking-widest font-bold hover:bg-white/25 transition-colors disabled:opacity-50"
            >
              Ulangi
            </button>
          </>
        )}
      </footer>
    </div>
  )
}