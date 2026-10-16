"use client"

import { useEffect, useState } from "react"

// Thin reading-progress bar for article pages.
export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      const el = document.documentElement
      const total = el.scrollHeight - el.clientHeight
      setProgress(total > 0 ? Math.min(1, el.scrollTop / total) : 0)
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", onScroll)
    }
  }, [])

  return (
    <div className="fixed top-0 inset-x-0 h-1 z-[70] bg-transparent pointer-events-none" aria-hidden>
      <div className="h-full bg-[#B34E3F] transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
    </div>
  )
}
