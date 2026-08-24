"use client"
import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname } from "next/navigation"
import { TOUR_STEPS } from "@/lib/tourContent"

type Props = { profileId: string }

export default function ProductJourney({ profileId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [step, setStep] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const storageKey = `tour_step_${profileId}`
  const seenKey = `tour_seen_${profileId}`

  const getStep = useCallback(() => {
    const raw = localStorage.getItem(storageKey)
    return raw ? parseInt(raw, 10) : 1
  }, [storageKey])

  const setStepPersist = useCallback((n: number) => {
    localStorage.setItem(storageKey, String(n))
    setStep(n)
  }, [storageKey])

  const isActive = useCallback(() => {
    return localStorage.getItem(seenKey) !== "1" && localStorage.getItem(`tour_active_${profileId}`) === "1"
  }, [seenKey, profileId])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const onStart = () => {
      const s = getStep()
      setStep(s)
    }
    window.addEventListener("tour_start", onStart)
    return () => window.removeEventListener("tour_start", onStart)
  }, [getStep])

  useEffect(() => {
    if (!isActive()) return
    const s = getStep()
    setStep(s)
  }, [pathname, getStep, isActive])

  useEffect(() => {
    if (step === null || !isActive()) return
    const current = TOUR_STEPS.find((s) => s.id === step)
    if (!current) return
    const el = document.querySelector(current.target) as HTMLElement | null
    if (el) {
      const r = el.getBoundingClientRect()
      setTargetRect(r)
      el.scrollIntoView({ behavior: "smooth", block: "center" })
      el.classList.add("tour-highlight")
      return () => el.classList.remove("tour-highlight")
    } else {
      setTargetRect(null)
    }
  }, [step, pathname, isActive])

  const handleNext = useCallback(async () => {
    if (step === null) return
    const next = step + 1
    if (next > TOUR_STEPS.length) {
      localStorage.setItem(seenKey, "1")
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`tour_active_${profileId}`)
      fetch(`/api/dashboard/${profileId}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_seen_tour: true }),
      }).catch(() => {})
      setStep(null)
      return
    }
    const nextStep = TOUR_STEPS.find((s) => s.id === next)
    const currentStep = TOUR_STEPS.find((s) => s.id === step)
    setStepPersist(next)
    if (nextStep && currentStep && nextStep.route !== currentStep.route) {
      const base = `/dashboard/${profileId}`
      const routes: Record<string, string> = {
        dashboard: base,
        editor: `${base}/web-invitation/editor`,
        templates: `${base}/web-invitation/templates`,
      }
      const targetRoute = routes[nextStep.route] || base
      router.push(targetRoute)
    }
  }, [step, setStepPersist, seenKey, storageKey, profileId, router])

  const handleClose = useCallback(() => {
    if (step !== null) {
      localStorage.setItem(seenKey, "1")
      localStorage.removeItem(storageKey)
      localStorage.removeItem(`tour_active_${profileId}`)
      fetch(`/api/dashboard/${profileId}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ has_seen_tour: true }),
      }).catch(() => {})
      setStep(null)
    }
  }, [step, seenKey, storageKey, profileId])

  if (!mounted || step === null || !isActive()) return null
  const current = TOUR_STEPS.find((s) => s.id === step)
  if (!current) return null
  const currentRoute = pathname.includes("/editor") ? "editor" : pathname.includes("/templates") ? "templates" : "dashboard"
  if (current.route !== currentRoute) return null

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
      {targetRect && (
        <div
          className="absolute border-2 border-violet-600 rounded-xl shadow-2xl pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}
      <div className="relative bg-white rounded-[24px] shadow-2xl max-w-[520px] w-full overflow-hidden border border-violet-100 animate-[fadeIn_0.4s_ease]">
        <div className="h-1 w-full bg-[#592259]" />
        <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors" aria-label="Tutup">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
        </button>
        <div className="p-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-violet-600">Langkah {String(current.id).padStart(2, "0")} / 08</span>
            <span className="flex-1 h-px bg-violet-100" />
          </div>
          <h2 className="font-['Playfair_Display'] text-[28px] leading-tight font-bold text-[#1A1817] mb-3">{current.title}</h2>
          <p className="font-['Inter'] text-[14px] leading-relaxed text-[#6B5B73] font-light mb-8">{current.description}</p>
          <div className="flex justify-end">
            <button onClick={handleNext} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold px-8 py-3 rounded-full transition-colors text-[13px] tracking-widest uppercase shadow-lg shadow-violet-600/20">
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .tour-highlight{position:relative;z-index:101;box-shadow:0 0 0 4px #7c3aed, 0 8px 32px rgba(124,58,237,0.25);border-radius:12px;transition:box-shadow 0.3s ease;}`}</style>
    </div>
  )

  return createPortal(modal, document.body)
}

export function startTour(profileId: string) {
  localStorage.setItem(`tour_active_${profileId}`, "1")
  localStorage.setItem(`tour_step_${profileId}`, "1")
  localStorage.removeItem(`tour_seen_${profileId}`)
  window.dispatchEvent(new Event("tour_start"))
}
