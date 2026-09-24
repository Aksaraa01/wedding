"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"

type ModuleDef = {
  key: string
  label: string
  icon: string
  route: (id: string) => string
  match: (pathname: string, id: string) => boolean
}

const MODULES: ModuleDef[] = [
  {
    key: "premium_web",
    label: "Premium Web Invitation",
    icon: "language",
    route: (id) => `/dashboard/${id}/web-invitation/editor`,
    match: (p) => p.includes("/web-invitation"),
  },
  {
    key: "unique_link_generator",
    label: "Undangan dan QR Tamu",
    icon: "link",
    route: (id) => `/dashboard/${id}/qr-guestbook`,
    match: (p, id) => p === `/dashboard/${id}/qr-guestbook`,
  },
  {
    key: "reservation_automation",
    label: "Data Reservasi",
    icon: "how_to_reg",
    route: (id) => `/dashboard/${id}/reservation-automation`,
    match: (p, id) => p === `/dashboard/${id}/reservation-automation`,
  },
  {
    key: "wa_blast",
    label: "Reminder Tamu VIP",
    icon: "chat_bubble",
    route: (id) => `/dashboard/${id}/reminder-tamu-vip`,
    match: (p, id) => p === `/dashboard/${id}/reminder-tamu-vip`,
  },
  {
    key: "qr_code_book",
    label: "Buku Tamu Digital",
    icon: "qr_code_2",
    route: (id) => `/dashboard/${id}/qr-guestbook/live`,
    match: (p, id) => p === `/dashboard/${id}/qr-guestbook/live`,
  },
  {
    key: "wish_wall",
    label: "Doa & Harapan Tamu",
    icon: "favorite",
    route: (id) => `/dashboard/${id}/wish-wall`,
    match: (p, id) => p === `/dashboard/${id}/wish-wall`,
  },
  {
    key: "galeri_foto_tamu",
    label: "Galeri Kenangan Tamu",
    icon: "photo_library",
    route: (id) => `/dashboard/${id}/galeri-kenangan`,
    match: (p, id) => p === `/dashboard/${id}/galeri-kenangan`,
  },
  {
    key: "kolom_direct_transfer",
    label: "Digital Angpao & E-Gift",
    icon: "redeem",
    route: (id) => `/dashboard/${id}/amplop-digital`,
    match: (p, id) => p === `/dashboard/${id}/amplop-digital`,
  },
]

export default function DashboardSidebar({
  id,
  collapsed,
  onToggle,
}: {
  id: string
  collapsed: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [selections, setSelections] = useState<Record<string, boolean> | null>(null)
  const [coupleName, setCoupleName] = useState("")
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/dashboard/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        setSelections((data && data.selections) || {})
        const p = data && data.profile
        if (p) setCoupleName([p.bride_name, p.groom_name].filter(Boolean).join(" & "))
      })
      .catch(() => {
        if (!cancelled) setSelections({})
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const loaded = selections !== null
  const moduleItems = loaded
    ? MODULES.filter((m) => selections[m.key] === true).map((m) => ({
        key: m.key,
        label: m.label,
        icon: m.icon,
        route: m.route(id),
        active: m.match(pathname, id),
      }))
    : []

  const dasborItem = {
    key: "dasbor",
    label: "Dasbor",
    icon: "space_dashboard",
    route: `/dashboard/${id}`,
    active: pathname === `/dashboard/${id}`,
  }

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col bg-[#1A1817] text-[#f5f0e7] transition-[width] duration-300 overflow-hidden ${
        collapsed ? "w-[76px]" : "w-[280px]"
      }`}
    >
      {/* Brand + collapse/extend toggle (always visible so the rail can be reopened) */}
      {!collapsed ? (
        <div className="flex items-center justify-between px-4 h-16 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <span className="text-[#f5f0e7] font-['Playfair_Display'] text-sm font-bold">A</span>
            </div>
            <span className="font-['Playfair_Display'] text-[17px] tracking-widest font-bold truncate">AKSARAA</span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#f5f0e7]/70"
            title="Ciutkan"
            aria-label="Ciutkan"
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-4 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
            <span className="text-[#f5f0e7] font-['Playfair_Display'] text-sm font-bold">A</span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-[#f5f0e7]/70"
            title="Perluas"
            aria-label="Perluas"
          >
            <span className="material-symbols-outlined text-[20px]">menu_open</span>
          </button>
        </div>
      )}

      {/* Couple name */}
      {!collapsed && coupleName && (
        <div className="px-5 py-3 border-b border-white/10 shrink-0">
          <p className="text-[10px] font-label uppercase tracking-widest text-[#f5f0e7]/40 mb-0.5">Perencanaan</p>
          <p className="text-[13px] font-['Playfair_Display'] italic text-secondary truncate">{coupleName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <button
          onClick={() => router.push(dasborItem.route)}
          onMouseEnter={() => collapsed && setHoveredKey(dasborItem.key)}
          onMouseLeave={() => setHoveredKey(null)}
          title={collapsed ? dasborItem.label : undefined}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
            dasborItem.active
              ? "bg-secondary text-white shadow-lg shadow-secondary/20"
              : "text-[#f5f0e7]/65 hover:bg-white/10 hover:text-white"
          } ${collapsed ? "justify-center" : ""}`}
        >
          <span className="material-symbols-outlined text-[20px] shrink-0">{dasborItem.icon}</span>
          {!collapsed && <span className="text-[13px] font-medium truncate">{dasborItem.label}</span>}
        </button>

        {!loaded ? (
          <div className="space-y-1 mt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex items-center gap-3 px-3 py-3 ${collapsed ? "justify-center" : ""}`}>
                <div className="w-5 h-5 rounded-md bg-white/10 animate-pulse shrink-0" />
                {!collapsed && (
                  <div className="h-3 rounded bg-white/10 animate-pulse" style={{ width: `${50 + (i % 3) * 18}%` }} />
                )}
              </div>
            ))}
          </div>
        ) : (
          moduleItems.map((item) => (
            <button
              key={item.key}
              onClick={() => router.push(item.route)}
              onMouseEnter={() => collapsed && setHoveredKey(item.key)}
              onMouseLeave={() => setHoveredKey(null)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group ${
                item.active
                  ? "bg-secondary text-white shadow-lg shadow-secondary/20"
                  : "text-[#f5f0e7]/65 hover:bg-white/10 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
              {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
            </button>
          ))
        )}
      </nav>

      {/* Hover flyout for collapsed mode */}
      {collapsed && hoveredKey && (
        <div
          className="fixed left-[76px] z-50"
          style={{ top: `calc(var(--dash-sidebar-w, 76px) + 16px)` }}
        >
          <div className="bg-[#1A1817] border border-white/10 rounded-r-lg rounded-l-none px-4 py-3 shadow-xl animate-in fade-in slide-in-from-left-2 duration-150">
            <span className="text-[13px] font-medium text-[#f5f0e7] whitespace-nowrap">
              {hoveredKey === "dasbor"
                ? "Dasbor"
                : moduleItems.find((m) => m.key === hoveredKey)?.label ||
                  (dasborItem.key === hoveredKey ? dasborItem.label : "")}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="shrink-0 px-5 py-4 border-t border-white/10">
        {!collapsed ? (
          <p className="text-[9px] font-label uppercase tracking-widest text-[#f5f0e7]/30 leading-relaxed">
            Modul perencanaan pernikahan Anda
          </p>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full bg-secondary mx-auto" />
        )}
      </div>
    </aside>
  )
}
