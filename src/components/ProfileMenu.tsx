"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

export default function ProfileMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-full border border-outline flex items-center justify-center overflow-hidden active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined text-on-surface-variant">account_circle</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-outline-variant shadow-lg z-50">
          <button
            onClick={() => {
              setOpen(false)
              router.push("/hero")
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-left font-label-md text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}
