"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toTransformedUrl } from "@/lib/storageUrl"
import { loadIdentity } from "@/lib/gallery-client"
import { ASSETS } from "@/lib/assets"

type ResolveData = {
  status: string
  quota?: number
  used?: number
  remaining?: number
  event?: { couple_name: string; photo_url: string; date_label: string; start_label: string; end_label: string }
}

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

function CornerFlourish({ flip }: { flip?: boolean }) {
  return (
    <svg
      className={`absolute top-0 w-24 h-24 pointer-events-none select-none ${flip ? "right-0 translate-x-2 -translate-y-2 scale-x-[-1]" : "left-0 -translate-x-2 -translate-y-2"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 100 100"
      style={{ color: "rgba(107, 43, 45, 0.25)" }}
    >
      <path d="M12 2C16 28 32 44 58 48M2 12C28 16 44 32 48 58" strokeLinecap="round" strokeWidth="1.2" />
      <path d="M22 6C24 16 32 24 42 26M6 22C16 24 24 32 26 42" strokeDasharray="2 3" strokeLinecap="round" strokeWidth="1" />
      <circle cx="28" cy="18" fill="currentColor" fillOpacity="0.3" r="2.5" />
      <circle cx="18" cy="28" fill="currentColor" fillOpacity="0.3" r="2.5" />
      <path d="M38 12C44 14 50 20 52 28M12 38C14 44 20 50 28 52" strokeWidth="0.8" />
    </svg>
  )
}

// Photobooth home. Guards on identity and window status.
export default function GalleryHomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [data, setData] = useState<ResolveData | null>(null)
  const [who, setWho] = useState("")

  useEffect(() => {
    const identity = loadIdentity(token)
    if (!identity) {
      router.replace(`/g/${encodeURIComponent(token)}/identitas`)
      return
    }
    setWho(`${identity.name} (${identity.category})`)
    fetch(`/api/gallery/${encodeURIComponent(token)}?device_id=${encodeURIComponent(identity.device_id)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.status && d.status !== "active") {
          router.replace(`/g/${encodeURIComponent(token)}`)
          return
        }
        setData(d)
      })
      .catch(() => router.replace(`/g/${encodeURIComponent(token)}`))
  }, [token, router])

  if (!data) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  const remaining = data.remaining ?? 0
  const photoUrl = data.event?.photo_url ? toTransformedUrl(data.event.photo_url, { width: 800, quality: 70 }) : ""

  return (
    <main className="flex-1 flex flex-col relative w-full px-5 pt-16 pb-10" style={{ ...SANS, backgroundColor: "#fbf9f4", color: "#1b1c19" }}>
      <div className="flex flex-col w-full relative">
        <div className="relative w-full rounded-[1rem] bg-white shadow-md overflow-hidden p-4 sm:p-6 flex flex-col items-center">
          <CornerFlourish />
          <CornerFlourish flip />

          <header className="flex flex-col items-center text-center mt-1 mb-6 z-10">
            <div className="mb-4">
              <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="h-12 w-12 rounded-full object-cover drop-shadow-sm mx-auto" />
            </div>
            <h2 className="text-[28px] leading-9 italic tracking-normal" style={SERIF}>
              {data.event?.couple_name || ""}
            </h2>
            <div className="flex items-center justify-center gap-3 mt-2 text-[#c4c8bf] w-40">
              <span className="h-px flex-1 bg-[#c4c8bf]/60" />
              <span className="material-symbols-outlined text-[14px]" style={{ color: "#6B2B2D" }}>eco</span>
              <span className="h-px flex-1 bg-[#c4c8bf]/60" />
            </div>
          </header>

          <div className="relative w-full max-w-[340px] aspect-[4/4.5] rounded-[1rem] overflow-hidden bg-[#f0eee9] shadow-sm flex flex-col justify-end">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl || ASSETS.defaults.couple}
              alt={`${data.event?.couple_name || "Mempelai"} Wedding Portrait`}
              className="absolute inset-0 w-full h-full object-cover rounded-[1rem]"
            />
            <div className="absolute inset-0 border border-[#c4c8bf]/40 rounded-[1rem] pointer-events-none m-4" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/80 via-white/30 to-transparent pointer-events-none" />
          </div>

          <div className="text-center px-4 mt-4 max-w-[320px] z-10">
            <p className="italic text-[15px] leading-[22px] text-[#444841]" style={SERIF}>
              “Abadikan momen indah bersama kami dalam kenangan abadi.”
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 my-4 text-[#444841]/70">
            <span className="text-[10px]" style={{ color: "#4f1519" }}>✦</span>
            <span className="text-[11px] tracking-[0.18em] uppercase">{who}</span>
            <span className="text-[10px]" style={{ color: "#4f1519" }}>✦</span>
          </div>

          <div className="w-full max-w-[340px] flex flex-col gap-2 z-10 mb-1">
            <button
              onClick={() => router.push(`/g/${encodeURIComponent(token)}/kamera`)}
              disabled={remaining <= 0}
              className="w-full h-12 text-white rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold shadow-md active:scale-[0.98] transition-all disabled:opacity-50"
              style={{ backgroundColor: "#6b2b2d" }}
            >
              <span className="material-symbols-outlined text-[20px]">photo_camera</span>
              <span className="tracking-wide">{remaining > 0 ? "TAMBAHKAN MOMEN" : "Slot Habis"}</span>
            </button>
            <button
              onClick={() => router.push(`/g/${encodeURIComponent(token)}/galeri`)}
              className="w-full h-12 bg-[#f5f3ee] text-[#1b1c19] rounded-full flex items-center justify-center gap-2 text-[13px] font-semibold shadow-sm active:scale-[0.98] transition-all hover:bg-[#eae8e3]"
            >
              <span className="material-symbols-outlined text-[20px]" style={{ color: "#6b2b2d" }}>photo_library</span>
              <span className="tracking-wide">LIHAT GALERI KENANGAN</span>
            </button>
          </div>

          <div className="w-full flex items-center justify-center gap-2 mt-3 opacity-60">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c4c8bf]" />
            <span className="w-8 h-px bg-[#c4c8bf]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#c4c8bf]" />
          </div>
        </div>
      </div>
    </main>
  )
}
