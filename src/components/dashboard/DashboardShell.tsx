"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"

export default function DashboardShell({ id, children }: { id: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const isEditor = pathname.includes("/web-invitation/editor")
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(`dash_sidebar_collapsed_${id}`) === "1") setCollapsed(true)
    } catch {}
  }, [id])

  const width = isEditor ? 0 : collapsed ? 76 : 280

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

  return (
    <>
      {!isEditor && <DashboardSidebar id={id} collapsed={collapsed} onToggle={toggle} />}
      <div className="transition-[padding-left] duration-300" style={{ paddingLeft: `${width}px` }}>
        {children}
      </div>
    </>
  )
}
