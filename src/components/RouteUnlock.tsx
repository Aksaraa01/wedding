"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

export default function RouteUnlock() {
  const pathname = usePathname()

  useEffect(() => {
    document.body.classList.remove("mobile-menu-open")
    document.body.style.overflow = ""
    document.documentElement.style.overflow = ""
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
