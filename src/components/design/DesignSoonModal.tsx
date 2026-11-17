"use client"

import { useEffect } from "react"

/**
 * "Segera Hadir" for an event type the catalogue shows but cannot open yet
 * (aqiqah, ulang tahun). Same wording as the Ceriavite registration form so the
 * promise is consistent; khitanan is the only kids family that is live.
 */
export default function DesignSoonModal({ event, onClose }: { event: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="design-soon-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl" onClick={(e) => e.stopPropagation()}>
        <span className="material-symbols-outlined text-[28px] text-[#8D4D39]">schedule</span>
        <h2 id="design-soon-title" className="mt-3 font-headline-md text-lg text-[#1A1817]">
          Segera Hadir
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6E6A63]">
          Undangan {event} sedang kami siapkan. Untuk saat ini pendaftaran baru tersedia untuk acara khitanan.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#8D4D39] py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white active:scale-[0.99]"
        >
          Mengerti
        </button>
      </div>
    </div>
  )
}
