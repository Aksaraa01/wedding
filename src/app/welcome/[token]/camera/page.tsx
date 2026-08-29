"use client"

import { use, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

function formatEndDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function getEndDate(profile: any): string {
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  const candidates = [
    ...sessions.map((s: any) => s?.date).filter(Boolean),
    profile.akad_date,
    profile.resepsi_date,
    profile.estimated_wedding_date,
  ].filter(Boolean) as string[]
  if (candidates.length === 0) return profile.estimated_wedding_date || ""
  let max = candidates[0]
  let maxT = new Date(max).getTime()
  for (const d of candidates) {
    const t = new Date(d).getTime()
    if (!isNaN(t) && t > maxT) { maxT = t; max = d }
  }
  return max
}

export default function CameraPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [coupleName, setCoupleName] = useState("Dimas & Kirana")
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
          setPhotoCount(photos.length)
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
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const frameH = Math.round(canvas.height * 0.12)
      ctx.fillStyle = "rgba(0,0,0,0.35)"
      ctx.fillRect(0, canvas.height - frameH, canvas.width, frameH)
      ctx.fillStyle = "rgba(248,245,240,0.95)"
      ctx.textAlign = "center"
      ctx.font = `${Math.round(canvas.width * 0.045)}px 'Playfair Display', serif`
      ctx.fillText(coupleName, canvas.width / 2, canvas.height - frameH * 0.55)
      ctx.fillStyle = "rgba(248,245,240,0.75)"
      ctx.font = `${Math.round(canvas.width * 0.022)}px 'Playfair Display', serif`
      ctx.fillText(endDate, canvas.width / 2, canvas.height - frameH * 0.22)
      const pad = Math.round(canvas.width * 0.04)
      const cs = Math.round(canvas.width * 0.06)
      const bw = Math.max(2, Math.round(canvas.width * 0.006))
      const r = Math.round(cs * 0.35)
      ctx.strokeStyle = "rgba(255,255,255,0.35)"
      ctx.lineWidth = bw
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      const drawCorner = (x: number, y: number, horiz: number, vert: number) => {
        ctx.beginPath()
        if (horiz === 1 && vert === 1) {
          ctx.moveTo(x, y + r); ctx.arcTo(x, y, x + r, y, r); ctx.lineTo(x + cs - r, y); ctx.moveTo(x, y + r); ctx.lineTo(x, y + cs - r)
        } else if (horiz === -1 && vert === 1) {
          ctx.moveTo(x, y + r); ctx.arcTo(x, y, x - r, y, r); ctx.lineTo(x - cs + r, y); ctx.moveTo(x, y + r); ctx.lineTo(x, y + cs - r)
        } else if (horiz === 1 && vert === -1) {
          ctx.moveTo(x, y - r); ctx.arcTo(x, y, x + r, y, r); ctx.lineTo(x + cs - r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y - cs + r)
        } else {
          ctx.moveTo(x, y - r); ctx.arcTo(x, y, x - r, y, r); ctx.lineTo(x - cs + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y - cs + r)
        }
        ctx.stroke()
      }
      drawCorner(pad, pad, 1, 1)
      drawCorner(canvas.width - pad, pad, -1, 1)
      drawCorner(pad, canvas.height - pad, 1, -1)
      drawCorner(canvas.width - pad, canvas.height - pad, -1, -1)
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
    <div className="h-[90dvh] min-h-[90dvh] max-h-[90dvh] w-full flex flex-col items-center justify-between py-[2vh] px-4 relative max-w-md mx-auto sm:border sm:border-gray-800 overflow-hidden" style={{ backgroundColor: "#1a0b1a", color: "#F8F5F0" }}>
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

      <main className="w-full flex-1 min-h-0 my-[1.5vh] relative flex justify-center items-center">
        <div className="w-full h-full max-h-[44dvh] max-[375px]:max-h-[40dvh] rounded-[clamp(1.5rem,8vw,3rem)] p-[clamp(4px,1.5vw,8px)] shadow-inner relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: "#2d1b2d" }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)" }}></div>
          <div className="w-full h-full rounded-[clamp(1.5rem,6vw,2.5rem)] border-3 overflow-hidden relative z-10 flex items-center justify-center" style={{ borderColor: "#d8b4fe", backgroundColor: "#000" }}>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 z-20">
              <div className="flex justify-between">
                <div className="w-8 h-8 border-t border-l border-white/30 rounded-tl-lg"></div>
                <div className="w-8 h-8 border-t border-r border-white/30 rounded-tr-lg"></div>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="font-serif text-white/70 text-lg tracking-widest uppercase" style={{ fontFamily: "Playfair Display" }}>{coupleName}</div>
                <div className="font-serif text-white/70 text-xs tracking-widest">{endDate}</div>
                <div className="flex justify-between w-full mt-1">
                  <div className="w-8 h-8 border-b border-l border-white/30 rounded-bl-lg"></div>
                  <div className="w-8 h-8 border-b border-r border-white/30 rounded-br-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-charcoal-900/80 backdrop-blur-md rounded-full px-4 py-2 flex gap-4 items-center border border-gray-700 z-30" style={{ backgroundColor: "rgba(17,17,17,0.8)" }}>
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
          <button onClick={() => router.push(`/welcome/${token}/gallery`)} className="w-[clamp(48px,16vw,80px)] h-[clamp(48px,16vw,80px)] rounded-[1.5rem] border flex items-center justify-center text-gray-300 hover:bg-gray-700 transition-colors shrink-0" style={{ backgroundColor: "#2d1b2d", borderColor: "#4b2c4b" }}>
            <span className="material-symbols-outlined text-[22px] sm:text-[28px]">photo_library</span>
          </button>
        </div>
      </footer>
    </div>
  )
}
