"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { SELFIE_FLOWER as FLOWER_DATA, drawSelfieFrame, formatEndDate, getEndDate } from "@/lib/selfieOverlay"

export default function CameraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [coupleName, setCoupleName] = useState("")
  const [endDate, setEndDate] = useState("")
  const [guestId, setGuestId] = useState("")
  const [weddingProfileId, setWeddingProfileId] = useState("")
  const [photoQuota, setPhotoQuota] = useState(20)
  const [photoCount, setPhotoCount] = useState(0)
  const [facing, setFacing] = useState<"environment" | "user">("environment")
  const [flash, setFlash] = useState(false)
  const [taking, setTaking] = useState(false)
  const [zoom, setZoom] = useState("1×")
  const [loading, setLoading] = useState(true)
  const zoomMap: Record<string, number> = { "1×": 1, "2": 2, "3": 3 }

  useEffect(() => {
    ;(async () => {
      try {
        const isTok = token.startsWith("AKS-")
        const query = isTok ? `qr_token=${encodeURIComponent(token)}` : `slug=${encodeURIComponent(token)}`
        const res = await fetch(`/api/check-in?${query}`)
        const data = await res.json()
        if (data.profile) {
          setCoupleName(data.profile.display_name || `${data.profile.bride_name} & ${data.profile.groom_name}`)
          setEndDate(formatEndDate(getEndDate(data.profile)))
        }
        if (data.guest) {
          setGuestId(data.guest.id)
          setWeddingProfileId(data.guest.wedding_profile_id)
          if (typeof data.photoQuota === "number") setPhotoQuota(data.photoQuota)
          const photoCheck = await fetch(`/api/guest-photos?guest_id=${data.guest.id}`)
          const photoData = await photoCheck.json()
          const photos = Array.isArray(photoData.photos) ? photoData.photos : []
          setPhotoCount(photos.filter((p: { source?: string | null }) => p.source !== "selfie").length)
        }
      } catch {}
      setLoading(false)
    })()
  }, [token])

  useEffect(() => {
    document.body.style.overflow = ""
    document.documentElement.style.overflow = ""
  }, [])

  const [torchSupported, setTorchSupported] = useState(false)
  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()[0] as any
    if (!track || typeof track.getCapabilities !== "function") { setTorchSupported(false); return }
    const caps = track.getCapabilities()
    setTorchSupported(!!caps.torch)
    if (!caps.torch) return
    track.applyConstraints({ advanced: [{ torch: flash } as any] }).catch(() => {})
  }, [flash, facing])

  const startCamera = async (mode: "environment" | "user") => {
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } , audio: false })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch {}
  }

  useEffect(() => {
    startCamera(facing)
    return () => { if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop()) }
  }, [facing])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    const target = zoomMap[zoom] || 1
    const track = streamRef.current?.getVideoTracks()[0] as any
    let usedTrackZoom = false
    if (track && typeof track.getCapabilities === "function") {
      const caps = track.getCapabilities()
      if (caps.zoom && typeof caps.zoom.min === "number" && typeof caps.zoom.max === "number") {
        const min = caps.zoom.min, max = caps.zoom.max
        if (target >= min && target <= max) {
          track.applyConstraints({ advanced: [{ zoom: target } as any] }).catch(() => {})
          usedTrackZoom = true
          v.style.transform = "scale(1)"
        } else if (target < min) {
          const cssScale = target / min
          v.style.transform = `scale(${cssScale})`
          track.applyConstraints({ advanced: [{ zoom: min } as any] }).catch(() => {})
        } else {
          const clamped = Math.min(target, max)
          track.applyConstraints({ advanced: [{ zoom: clamped } as any] }).catch(() => {})
          usedTrackZoom = true
          v.style.transform = "scale(1)"
        }
      }
    }
    if (!usedTrackZoom) {
      v.style.transform = `scale(${target})`
    }
    v.style.transformOrigin = "center"
    v.style.transition = "transform 0.2s ease"
  }, [zoom])

  const remaining = Math.max(0, photoQuota - photoCount)

  const handleTake = async () => {
    if (!videoRef.current || !canvasRef.current || !guestId || !weddingProfileId) return
    if (remaining <= 0) { alert("Kuota foto Anda sudah terpenuhi"); return }
    setTaking(true)
    try {
      const video = videoRef.current
      const canvas = canvasRef.current
      const vw = video.videoWidth || 1280
      const vh = video.videoHeight || 720
      const targetAspect = 9 / 16
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
      canvas.height = 1280
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
      await drawSelfieFrame(ctx, canvas.width, canvas.height, coupleName, endDate)
      const blob = await new Promise<Blob | null>(res => canvas.toBlob(b => res(b), "image/jpeg", 0.85))
      if (!blob) return
      const file = new File([blob], `guest-${Date.now()}.jpg`, { type: "image/jpeg" })
      const form = new FormData()
      form.append("file", file)
      form.append("guest_id", guestId)
      form.append("wedding_profile_id", weddingProfileId)
      const uploadRes = await fetch("/api/guest-photos/upload", { method: "POST", body: form })
      if (uploadRes.ok) {
        setPhotoCount(c => c + 1)
        if (flash && navigator.vibrate) navigator.vibrate(50)
      } else {
        const err = await uploadRes.json()
        alert(err.error || "Gagal mengunggah foto")
      }
    } finally {
      setTaking(false)
    }
  }

  return (
    <div className="h-[100dvh] min-h-[100dvh] max-h-[100dvh] w-full flex flex-col items-center justify-between px-4 py-[1vh] relative max-w-md mx-auto sm:border sm:border-gray-800 overflow-hidden" style={{ backgroundColor: "#1a0b1a", color: "#F8F5F0", paddingTop: "max(8px, env(safe-area-inset-top))", paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap');`}</style>
      <header className="w-full flex justify-between items-center z-10 px-2 shrink-0" style={{ height: "clamp(32px,5vh,40px)" }}>
        <div className="flex items-center gap-1">
          <img alt="Aksara Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBOYBQKeEkh398GPxusyxyyIIpudHaBYGcxDefI-Nc5f1VpbxNlbv26Ultv-mY7KaQTTr5if4eZjm1F7P-RUBmaFCbBe08cDvd54h8E9qsy4JUG9MqQotGPVjgqdeCAJ66BB6IyuChC9dGSPm1dInQnX-XiUpxnbuftXobE5M0KCX4I6eYIsUtjDP2kBW7-3SgAyqvmbDYSRQgX9BQeRnmLCaJ3zNsgGp-RQ7ha3P8CbMS48vr9iN_Tsal5-CK5kmRREw" />
        </div>
        <div className="text-center flex-1">
          {loading ? (<div className="h-6 bg-white/10 rounded animate-pulse w-32 mx-auto" />) : (<h3 className="font-headline-md text-xl font-medium mt-2" style={{ fontFamily: "Playfair Display", color: "#F8F5F0" }}>{coupleName}</h3>)}
          {loading ? (<div className="h-3 bg-white/10 rounded animate-pulse w-24 mx-auto mt-1" />) : endDate && (<p className="text-gray-400 text-xs mt-0.5">berakhir {endDate}</p>)}
        </div>
        <div className="w-8" />
      </header>

      <main className="w-full flex-1 min-h-0 my-[1vh] relative flex justify-center items-center">
        <div className="w-[92vw] max-w-[380px] max-h-[64dvh] rounded-[clamp(1.5rem,8vw,3rem)] p-[clamp(4px,1.5vw,8px)] shadow-inner relative overflow-hidden flex items-center justify-center shrink-0" style={{ backgroundColor: "#2d1b2d" }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)" }}></div>
          <div className="w-full h-full rounded-[clamp(1.5rem,6vw,2.5rem)] border-3 overflow-hidden relative z-10 flex items-center justify-center" style={{ borderColor: "#d8b4fe", backgroundColor: "#000" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scale(1)", objectPosition: "center" }} />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none z-20">
              <img src={FLOWER_DATA} alt="" className="absolute top-0 left-0 w-20 h-20 object-contain" />
              <img src={FLOWER_DATA} alt="" className="absolute top-0 right-0 w-20 h-20 object-contain" style={{ transform: "scaleX(-1)" }} />
              <img src={FLOWER_DATA} alt="" className="absolute bottom-0 left-0 w-20 h-20 object-contain" style={{ transform: "scaleY(-1)" }} />
              <img src={FLOWER_DATA} alt="" className="absolute bottom-0 right-0 w-20 h-20 object-contain" style={{ transform: "scale(-1,-1)" }} />
              <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center gap-0.5 pb-5">
                {loading ? (
                  <>
                    <div className="h-4 w-36 bg-white/10 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-white/10 rounded animate-pulse" />
                  </>
                ) : (
                  <>
                    <div className="font-serif text-white text-lg tracking-widest uppercase" style={{ fontFamily: "Playfair Display" }}>{coupleName}</div>
                    <div className="font-serif text-white/85 text-[11px] tracking-widest">{endDate}</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[120px] left-1/2 -translate-x-1/2 bg-charcoal-900/80 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 items-center border border-gray-700 z-30" style={{ backgroundColor: "rgba(17,17,17,0.8)" }}>
          {["1×", "2", "3"].map(z => (
            <button key={z} onClick={() => setZoom(z)} className={zoom === z ? "bg-white text-black text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center" : "text-gray-300 text-sm font-medium hover:text-white transition-colors"}>{z}</button>
          ))}
        </div>
      </main>

      <footer className="w-full z-10 flex flex-col gap-[1.5vh] shrink-0">
        <div className="flex justify-between items-center px-4 w-full">
          <button onClick={() => torchSupported && setFlash(v => !v)} disabled={!torchSupported} className={`w-12 h-12 rounded-full border flex items-center justify-center transition-colors ${!torchSupported ? "opacity-40 cursor-not-allowed border-gray-700 text-gray-500" : flash ? "bg-white text-black border-white" : "border-gray-700 text-gray-300 hover:bg-gray-800"}`}>
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M11.412 15.655 9.75 21.75l3.745-4.012M9.257 13.5H3.75l2.659-2.849m2.048-2.194L14.25 2.25 12 10.5h8.25l-4.707 5.043M8.457 8.457 3 3m5.457 5.457 7.086 7.086m0 0L21 21" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </button>
          <span className="text-gray-400 text-[10px] sm:text-xs tracking-[0.2em] font-medium uppercase">Kamera {facing === "environment" ? "Belakang" : "Depan"}</span>
          <button onClick={() => setFacing(f => f === "environment" ? "user" : "environment")} className="w-[clamp(40px,12vw,48px)] h-[clamp(40px,12vw,48px)] rounded-full border border-gray-700 flex items-center justify-center text-gray-300 hover:bg-gray-800 transition-colors shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" strokeLinecap="round" strokeLinejoin="round"></path></svg>
          </button>
        </div>
        <div className="flex justify-between items-center px-2">
          <div className="w-[clamp(48px,16vw,80px)] h-[clamp(48px,16vw,80px)] rounded-[1.5rem] border flex flex-col items-center justify-center p-2 shrink-0" style={{ backgroundColor: "#2d1b2d", borderColor: "#a855f7" }}>
            {loading ? (<div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/10 rounded animate-pulse" />) : (<span className="font-bold text-[clamp(18px,6vw,24px)] leading-none" style={{ color: "#d8b4fe" }}>{remaining}</span>)}
            <span className="text-gray-400 text-[10px] tracking-widest mt-1 uppercase">Sisa</span>
          </div>
          <button aria-label="Take photo" onClick={handleTake} disabled={taking || remaining <= 0} className="w-[clamp(64px,18vw,96px)] h-[clamp(64px,18vw,96px)] rounded-full border-4 border-gray-700 p-1 flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50 shrink-0">
            <div className="w-full h-full rounded-full" style={{ backgroundColor: taking ? "#4b2c4b" : "#8b5cf6" }}></div>
          </button>
          <button onClick={() => router.push(`/welcome/${token}/gallery`)} aria-label="Buka Galeri" className="w-[clamp(48px,16vw,80px)] h-[clamp(48px,16vw,80px)] rounded-[1.5rem] border flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors shrink-0" style={{ backgroundColor: "#2d1b2d", borderColor: "#4b2c4b" }}>
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 4v10h14V7H5Zm3 3 1.5 2-2.5 3H17l-3-4-2 2.5-1-1-1.5 2H8Z"/></svg>
          </button>
        </div>
      </footer>
    </div>
  )
}
