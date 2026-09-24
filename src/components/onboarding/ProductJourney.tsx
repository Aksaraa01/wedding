"use client"
import { useEffect, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRouter, usePathname } from "next/navigation"
import { TOUR_STEPS, type TourStep } from "@/lib/tourContent"

type Props = { profileId: string }

const ROUTES: Record<TourStep["route"], string> = {
  dashboard: "",
  editor: "/web-invitation/editor",
  templates: "/web-invitation/templates",
  "qr-guestbook": "/qr-guestbook",
  guests: "/guests",
  "reservation-automation": "/reservation-automation",
  "wish-wall": "/wish-wall",
  "qr-live": "/qr-guestbook/live",
}

function routeOf(pathname: string): TourStep["route"] {
  if (pathname.includes("/qr-guestbook/live")) return "qr-live"
  if (pathname.includes("/qr-guestbook")) return "qr-guestbook"
  if (pathname.includes("/reservation-automation")) return "reservation-automation"
  if (pathname.includes("/wish-wall")) return "wish-wall"
  if (pathname.includes("/guests")) return "guests"
  if (pathname.includes("/editor")) return "editor"
  if (pathname.includes("/templates")) return "templates"
  return "dashboard"
}

export default function ProductJourney({ profileId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [step, setStep] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [selections, setSelections] = useState<Record<string, boolean> | null>(null)
  const [cardH, setCardH] = useState(400)
  const cardRef = useCallback((node: HTMLDivElement | null) => {
    if (node) setCardH(node.offsetHeight)
  }, [])

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

  // Load package selections so the journey can skip steps the package lacks
  // (e.g. Buku Tamu Digital is not in Undangan Digital packages).
  useEffect(() => {
    let cancelled = false
    fetch(`/api/dashboard/${profileId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.selections) setSelections(data.selections)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [profileId])

  const visibleSteps = TOUR_STEPS.filter(
    (s) => !s.feature || selections === null || selections[s.feature] === true
  )

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

  // If the stored step is filtered out (package lacks the feature), jump forward.
  useEffect(() => {
    if (step === null || !isActive() || selections === null) return
    if (!visibleSteps.some((s) => s.id === step)) {
      const next = visibleSteps.find((s) => s.id > step)
      if (next) {
        setStepPersist(next.id)
        const base = `/dashboard/${profileId}`
        router.push(`${base}${ROUTES[next.route]}`)
      } else {
        setStep(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selections])

  useEffect(() => {
    if (step === null || !isActive()) return
    const current = TOUR_STEPS.find((s) => s.id === step)
    if (!current) return
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768
    const selector = isMobile && (current as any).targetMobile ? (current as any).targetMobile : current.target
    const tryFind = () => {
      if (current.target === "[data-tour='konfirmasi']" || current.target === "[data-tour='feedback']") {
        const secName = current.target.includes("konfirmasi") ? "konfirmasi" : "feedback"
        const sec = document.querySelector(`[data-section='${secName}']`) as HTMLElement | null
        if (sec) {
          const collapsed = sec.getAttribute("data-collapsed") === "true" || sec.querySelector("[data-collapsed='true']")
          if (collapsed) window.dispatchEvent(new CustomEvent("tour_open_section", { detail: secName }))
        }
      }
      if (current.target === "[data-tour='template-pesan']") {
        window.dispatchEvent(new CustomEvent("tour_open_template"))
      }
      const pickVisible = (cands: HTMLElement[]) =>
        cands.find((c) => {
          const s = window.getComputedStyle(c)
          const r = c.getBoundingClientRect()
          return s.display !== "none" && s.visibility !== "hidden" && r.width > 0 && r.height > 0
        }) || cands.find((c) => { const r = c.getBoundingClientRect(); return r.width > 0 && r.height > 0 }) || cands[0] || null
      let cands = Array.from(document.querySelectorAll(selector)) as HTMLElement[]
      let el: HTMLElement | null = cands.length ? pickVisible(cands) : null
      if (isMobile && current.target === "[data-tour='konten']") {
        const aside = document.querySelector("[data-tour='konten']") as HTMLElement | null
        if (aside) {
          const st = window.getComputedStyle(aside)
          if (st.display === "none" || aside.offsetParent === null) {
            window.dispatchEvent(new CustomEvent("tour_show_konten"))
          }
        }
      }
      if (!el && (current.target === "[data-tour='feedback']" || current.target === "[data-tour='konfirmasi']")) {
        const secName = current.target.includes("konfirmasi") ? "konfirmasi" : "feedback"
        const sec = document.querySelector(`[data-section='${secName}']`) as HTMLElement | null
        if (sec) {
          const inner = sec.querySelector(selector) as HTMLElement | null
          if (inner) el = pickVisible([inner] as HTMLElement[]) || inner
          else el = sec
        }
      }
      if (!el && current.target === "[data-tour='ganti-tema']") {
        const all = Array.from(document.querySelectorAll("[data-tour='ganti-tema']")) as HTMLElement[]
        el = pickVisible(all)
      }
      if (el) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 && r.height === 0) {
          const inner = el.querySelector("button, a, [role='button']") as HTMLElement | null
          if (inner && inner.getBoundingClientRect().width > 0) el = inner
          else {
            const vis = cands.length ? pickVisible(cands.filter((c) => c !== el)) : null
            if (vis) el = vis
          }
        }
      }
      return el
    }
    let el: HTMLElement | null = tryFind()
    let ro: ResizeObserver | null = null
    let iv: ReturnType<typeof setInterval> | null = null
    let mo: MutationObserver | null = null
    const attach = (target: HTMLElement) => {
      const updateRect = () => {
        const r = target.getBoundingClientRect()
        if (r.width > 0 || r.height > 0) setTargetRect(r.toJSON() as DOMRect)
      }
      updateRect()
      target.scrollIntoView({ behavior: "smooth", block: "center" })
      target.classList.add("tour-highlight")
      ro = new ResizeObserver(updateRect)
      ro.observe(target)
      window.addEventListener("resize", updateRect)
      window.addEventListener("scroll", updateRect, true)
      return () => {
        target.classList.remove("tour-highlight")
        ro?.disconnect()
        window.removeEventListener("resize", updateRect)
        window.removeEventListener("scroll", updateRect, true)
      }
    }
    let detach: (() => void) | null = null
    if (el && el.getBoundingClientRect().width > 0) {
      detach = attach(el)
    } else {
      setTargetRect(null)
      let tries = 0
      iv = setInterval(() => {
        tries++
        const found = tryFind()
        if (found && found.getBoundingClientRect().width > 0) {
          if (iv) clearInterval(iv)
          mo?.disconnect()
          el = found
          detach = attach(found)
        } else if (tries > 20) {
          if (iv) clearInterval(iv)
          mo?.disconnect()
          if (found) {
            el = found
            detach = attach(found)
          }
        }
      }, 300)
      mo = new MutationObserver(() => {
        const found = tryFind()
        if (found && found.getBoundingClientRect().width > 0) {
          if (iv) clearInterval(iv)
          mo?.disconnect()
          el = found
          detach = attach(found)
        }
      })
      mo.observe(document.body, { childList: true, subtree: true, attributes: true })
    }
    // Re-sync the highlight rect while the step is active: late layout
    // shifts (images/fonts loading, collapsibles opening) move the target
    // without firing scroll/resize, leaving a stale rect behind.
    const poll = setInterval(() => {
      const found = tryFind()
      if (!found) return
      if (found !== el) {
        el?.classList.remove("tour-highlight")
        el = found
        found.classList.add("tour-highlight")
        try { ro?.observe(found) } catch {}
        found.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      const r = found.getBoundingClientRect()
      if (r.width === 0 && r.height === 0) return
      setTargetRect((prev) => {
        if (!prev) return r.toJSON() as DOMRect
        if (
          Math.abs(prev.top - r.top) > 2 ||
          Math.abs(prev.left - r.left) > 2 ||
          Math.abs(prev.width - r.width) > 2 ||
          Math.abs(prev.height - r.height) > 2
        ) return r.toJSON() as DOMRect
        return prev
      })
    }, 500)
    return () => {
      clearInterval(poll)
      if (iv) clearInterval(iv)
      mo?.disconnect()
      if (detach) detach()
      else if (el) (el as HTMLElement).classList.remove("tour-highlight")
    }
  }, [step, pathname, isActive])

  const finishTour = useCallback(() => {
    localStorage.setItem(seenKey, "1")
    localStorage.removeItem(storageKey)
    localStorage.removeItem(`tour_active_${profileId}`)
    fetch(`/api/dashboard/${profileId}/web-invitation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ has_seen_tour: true }),
    }).catch(() => {})
    setStep(null)
  }, [seenKey, storageKey, profileId])

  const handleNext = useCallback(async () => {
    if (step === null) return
    const currentStep = TOUR_STEPS.find((s) => s.id === step)
    const nextStep = visibleSteps.find((s) => s.id > step)
    if (!nextStep) {
      finishTour()
      return
    }
    setStepPersist(nextStep.id)
    if (currentStep && nextStep.route !== currentStep.route) {
      const base = `/dashboard/${profileId}`
      router.push(`${base}${ROUTES[nextStep.route]}`)
    }
  }, [step, visibleSteps, setStepPersist, finishTour, profileId, router])

  const handleClose = useCallback(() => {
    if (step !== null) finishTour()
  }, [step, finishTour])

  if (!mounted || step === null || !isActive()) return null
  const current = TOUR_STEPS.find((s) => s.id === step)
  if (!current) return null
  const currentRoute = routeOf(pathname)
  if (current.route !== currentRoute) return null

  const position = visibleSteps.findIndex((s) => s.id === step) + 1
  const total = visibleSteps.length

  // Place the card on the side with enough free space so it never covers
  // the highlighted target. Card height is measured (not estimated) so
  // mid-viewport targets resolve correctly. Falls back to the larger side
  // when the card fits neither above nor below.
  const viewportH = typeof window !== "undefined" ? window.innerHeight : 800;
  const spaceAbove = targetRect ? targetRect.top - 6 : viewportH;
  const spaceBelow = targetRect ? viewportH - targetRect.bottom - 6 : 0;
  const placeBottom = targetRect
    ? spaceBelow >= cardH + 16
      ? true
      : spaceAbove >= cardH + 16
        ? false
        : spaceBelow >= spaceAbove
    : false;
  const modal = (
    <div className={`fixed inset-0 z-[100] flex justify-center p-4 overflow-y-auto overscroll-contain ${placeBottom ? "items-end pb-8" : "items-start pt-20 md:pt-24"}`}>
      {targetRect ? (
        <>
          <div className="absolute bg-black/40 z-0" style={{ top: 0, left: 0, right: 0, height: targetRect.top - 6 }} onClick={handleClose} />
          <div className="absolute bg-black/40 z-0" style={{ top: targetRect.bottom + 6, left: 0, right: 0, bottom: 0 }} onClick={handleClose} />
          <div className="absolute bg-black/40 z-0" style={{ top: targetRect.top - 6, left: 0, width: targetRect.left - 6, height: targetRect.height + 12 }} onClick={handleClose} />
          <div className="absolute bg-black/40 z-0" style={{ top: targetRect.top - 6, left: targetRect.right + 6, right: 0, height: targetRect.height + 12 }} onClick={handleClose} />
          <div
            className="absolute z-10 border-[3px] border-violet-600 rounded-2xl shadow-[0_0_0_4px_rgba(124,58,237,0.15),0_12px_40px_rgba(124,58,237,0.25)] pointer-events-none transition-all duration-300 bg-transparent"
            style={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/40 z-0" onClick={handleClose} />
      )}
      <div ref={cardRef} className="relative z-20 bg-white rounded-[24px] shadow-2xl max-w-[280px] md:max-w-[520px] w-full overflow-hidden border border-violet-100 animate-[fadeIn_0.4s_ease] max-h-[85vh] overflow-y-auto">
        <div className="h-1 w-full bg-[#592259]" />
        <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors" aria-label="Tutup">
          <span className="material-symbols-outlined text-[20px] text-on-surface-variant">close</span>
        </button>
        <div className="p-4 md:p-8">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <span className="text-[10px] md:text-[11px] font-bold tracking-[0.2em] uppercase text-violet-600">Langkah {String(position).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
            <span className="flex-1 h-px bg-violet-100" />
          </div>
          <h2 className="font-['Playfair_Display'] text-[18px] md:text-[28px] leading-tight font-bold text-[#1A1817] mb-2 md:mb-3">{current.title}</h2>
          <p className="font-['Inter'] text-[12px] md:text-[14px] leading-relaxed text-[#6B5B73] font-light mb-6 md:mb-8">{current.description}</p>
          <div className="flex justify-end">
            <button onClick={handleNext} className="bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold px-6 py-2.5 md:px-8 md:py-3 rounded-full transition-colors text-[12px] md:text-[13px] tracking-widest uppercase shadow-lg shadow-violet-600/20">
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .tour-highlight{position:relative;z-index:5;box-shadow:0 0 0 3px #7c3aed, 0 8px 24px rgba(124,58,237,0.2);border-radius:16px;transition:box-shadow 0.3s ease;}`}</style>
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
