"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"

export default function DashboardShell({ id, children }: { id: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const hideSidebar =
    pathname.includes("/web-invitation/editor") ||
    pathname.includes("/web-invitation/templates") ||
    pathname.includes("/web-invitation/feedback") ||
    pathname.includes("/guests")
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(`dash_sidebar_collapsed_${id}`) === "1") setCollapsed(true)
    } catch {}
  }, [id])

  const width = hideSidebar ? 0 : collapsed ? 76 : 280

  useEffect(() => {
    document.documentElement.style.setProperty("--dash-sidebar-w", `${width}px`)
  }, [width])

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c
      try {
        localStorage.setItem(`dash_sidebar_collapsed_${id}`, next ? "1" : "0")
      } catch {}
      return next
    })
  }

  // Sidebar is desktop-only, so the content offset must be lg+ only (inline
  // padding would push mobile content right).
  const paddingClass = hideSidebar ? "lg:pl-0" : collapsed ? "lg:pl-[76px]" : "lg:pl-[280px]"

  return (
    <>
      {!hideSidebar && <DashboardSidebar id={id} collapsed={collapsed} onToggle={toggle} />}
      <div className={`transition-[padding-left] duration-300 ${paddingClass} min-h-screen overflow-visible`}>{children}</div>
    </>
  )
}
