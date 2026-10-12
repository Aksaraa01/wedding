"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GUEST_CATEGORIES } from "@/lib/guest-slug"
import { sanitizeGuestName } from "@/lib/nameClean"
import { getDeviceId, saveIdentity } from "@/lib/gallery-client"
import { ASSETS } from "@/lib/assets"

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

// Step 2: guest identity. Name + category are both mandatory and stored
// with every uploaded photo (denormalized — later edits don't rewrite history).
export default function GalleryIdentityPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [couple, setCouple] = useState("")
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [error, setError] = useState("")
  const [checking, setChecking] = useState(true)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/gallery/${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.status && data.status !== "active") {
          router.replace(`/g/${encodeURIComponent(token)}`)
          return
        }
        setCouple(data?.event?.couple_name || "")
      })
      .catch(() => router.replace(`/g/${encodeURIComponent(token)}`))
      .finally(() => setChecking(false))
  }, [token, router])

  const handleContinue = () => {
    if (toast) return
    const cleanName = sanitizeGuestName(name).replace(/ +/g, " ").trim()
    if (!cleanName) {
      setError("Tulis nama kamu dulu sebelum lanjut.")
      return
    }
    if (!category) {
      setError("Pilih kategorimu dulu sebelum lanjut.")
      return
    }
    setError("")
    const clean = cleanName.slice(0, 32)
    saveIdentity(token, { name: clean, category, device_id: getDeviceId() })
    setToast(`Menyiapkan bilik foto untuk ${clean}...`)
    setTimeout(() => {
      router.push(`/g/${encodeURIComponent(token)}/home`)
    }, 900)
  }

  if (checking) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="w-10 h-10 border-2 border-[#4f1519] border-t-transparent rounded-full animate-spin" />
      </main>
    )
  }

  return (
    <main className="flex-1 flex flex-col relative w-full px-5 pt-10 pb-10" style={SANS}>
      <img src={ASSETS.galeriEnvelope.botanicalTopLeft} alt="" aria-hidden className="pointer-events-none absolute -top-12 -left-8 w-44 h-52 object-contain select-none z-0" style={{ transform: "rotate(-6deg)", opacity: 0.9 }} />
      <img src={ASSETS.galeriEnvelope.botanicalBottomRight} alt="" aria-hidden className="pointer-events-none absolute -bottom-14 -right-8 w-48 h-48 object-contain select-none z-0" style={{ transform: "rotate(6deg)", opacity: 0.95 }} />

      <div className="relative w-full bg-white rounded-2xl p-6 sm:p-8 shadow-[0_12px_36px_-6px_rgba(43,45,39,0.1),0_4px_16px_-2px_rgba(86,101,81,0.06)] flex flex-col items-center text-center z-10">
        <div className="flex items-center justify-center mb-2">
          <img src={ASSETS.galeriEnvelope.aksaraaLogo} alt="Aksaraa Wedding" className="h-10 w-10 rounded-full object-cover mx-auto drop-shadow-sm" />
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          <span className="w-5 h-px" style={{ backgroundColor: "#c4c8bf" }} />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold" style={{ color: "#6B2B2D" }}>Wedding Memories</span>
          <span className="w-5 h-px" style={{ backgroundColor: "#c4c8bf" }} />
        </div>
        <h2 className="text-[22px] leading-[30px] font-medium mb-2" style={{ ...SERIF, color: "#1b1c19" }}>
          Dari siapa kenangan ini?
        </h2>
        <p className="text-[12px] leading-[18px] text-[#444841] max-w-xs mb-6 italic">
          Tulis nama kamu sebelum mengabadikan momen berharga{couple ? ` bersama ${couple}` : ""}.
        </p>

        <form
          className="w-full flex flex-col gap-3.5"
          onSubmit={(e) => {
            e.preventDefault()
            handleContinue()
          }}
        >
          <div className="relative w-full">
            <input
              autoComplete="name"
              value={name}
              maxLength={32}
              onChange={(e) => {
                setName(e.target.value)
                setError("")
              }}
              placeholder="Tulis nama panggilanmu..."
              className="w-full h-12 px-5 text-center text-[14px] text-[#1b1c19] placeholder:text-[#747871]/70 placeholder:italic bg-[#f5f3ee] rounded-full outline-none transition-all duration-200 focus:bg-white focus:shadow-[0_0_0_2px_#566551,0_4px_12px_rgba(86,101,81,0.12)]"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4f1519]/60 flex items-center">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </div>
          </div>

          <div className="relative w-full">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value)
                setError("")
              }}
              aria-label="Kategori tamu"
              className={`w-full h-12 px-5 text-center text-[14px] bg-[#f5f3ee] rounded-full outline-none transition-all duration-200 focus:bg-white focus:shadow-[0_0_0_2px_#566551] appearance-none ${category ? "text-[#1b1c19]" : "text-[#747871]"}`}
            >
              <option value="">Pilih kategorimu...</option>
              {GUEST_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4f1519]/60 flex items-center">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </div>
          </div>

          {error && <p className="text-[13px] text-[#ba1a1a]">{error}</p>}

          <button
            type="submit"
            className="group relative w-full h-12 mt-2 text-white rounded-full text-[13px] tracking-wider uppercase font-semibold flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(107,43,45,0.3)] hover:bg-[#4F1519] transition-all active:scale-[0.98]"
            style={{ backgroundColor: "#6B2B2D" }}
          >
            Lanjutkan
            <span className="material-symbols-outlined text-[18px] transition-transform duration-200 group-hover:translate-x-1">arrow_forward</span>
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-5 text-[#c4c8bf] w-full max-w-[140px]">
          <span className="h-px flex-1 bg-[#c4c8bf]/60" />
          <span className="text-[15px] leading-none select-none" style={{ ...SERIF, color: "rgba(79,21,25,0.7)" }}>✤</span>
          <span className="h-px flex-1 bg-[#c4c8bf]/60" />
        </div>
      </div>

      <div className={`transition-all duration-300 fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#30312e] text-[#f2f1ec] rounded-full shadow-lg flex items-center gap-2 z-50 ${toast ? "opacity-100 -translate-y-2" : "opacity-0 pointer-events-none"}`}>
        <span className="material-symbols-outlined text-[18px]" style={{ color: "#ffdea4" }}>favorite</span>
        <span className="text-[13px] font-semibold">{toast || ""}</span>
      </div>
    </main>
  )
}
