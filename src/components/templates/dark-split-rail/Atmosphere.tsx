"use client"

import { useEffect } from "react"

// Signature entrance effect from the reference: fade + scale-down + de-blur,
// triggered the first time each block scrolls into view (IntersectionObserver).
export const TIBRA_CSS = `
.dsr-reveal { opacity: 0; transform: scale(1.08); filter: blur(10px);
  transition: opacity 1.1s ease, transform 1.1s ease, filter 1.1s ease; }
.dsr-reveal.is-in { opacity: 1; transform: scale(1); filter: blur(0); }
.dsr-root, .dsr-root * { -webkit-tap-highlight-color: transparent; }
.dsr-root section { text-shadow: 0 1px 14px rgba(0,0,0,0.6); }
@media (prefers-reduced-motion: reduce) {
  .dsr-reveal { opacity: 1 !important; transform: none !important; filter: none !important; }
}
@keyframes dsrKen { 0% { transform: scale(1); } 100% { transform: scale(1.12); } }
@keyframes dsrPulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
`

// Observe every .dsr-reveal under the document and add .is-in once visible.
export function useTibraBlur() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".dsr-reveal"))
    if (els.length === 0) return
    if (typeof IntersectionObserver === "undefined") {
      els.forEach((el) => el.classList.add("is-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in")
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}
