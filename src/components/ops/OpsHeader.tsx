"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { TAB_ROLES } from "@/lib/opsRoles"

type OpsEmployee = { name: string; role: string }

const NAV_ITEMS: { key: "antrian" | "music" | "template"; label: string; href: string }[] = [
  { key: "antrian", label: "Antrian", href: "/ops" },
  { key: "music", label: "Music", href: "/ops/music" },
  { key: "template", label: "Template", href: "/ops/templates" },
]

export default function OpsHeader({
  employee,
  activeKey,
}: {
  employee: OpsEmployee
  activeKey: (typeof NAV_ITEMS)[number]["key"]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])
  const handleLogout = () => {
    sessionStorage.removeItem("ops_employee")
    router.replace("/ops/login")
  }
  const displayName = `${employee.name}.${employee.role}`
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20 bg-background border-b border-outline-variant">
      <div className="flex items-center gap-4">
        <h1 className="font-display-lg text-headline-md tracking-widest text-primary uppercase">Aksaraa</h1>
        <span className="text-xs font-label-md tracking-widest bg-primary text-white px-2 py-1 ml-2">CORE OPS</span>
      </div>
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex gap-10">
          {NAV_ITEMS.map((item) => {
            const allowed = TAB_ROLES[item.key]
            if (allowed && !allowed.includes(employee.role as any)) return null
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`font-label-md text-label-md uppercase tracking-widest transition-colors ${
                  activeKey === item.key
                    ? "text-primary font-semibold border-b-2 border-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center gap-3 relative" ref={menuRef}>
          <div className="text-right hidden sm:block min-w-0">
            <p className="font-label-md text-[10px] uppercase opacity-60">Petugas Aktif</p>
            <p className="font-body-md font-semibold text-sm max-w-[220px] truncate" title={displayName}>{displayName}</p>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="w-10 h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors"
            aria-label="Menu profil"
          >
            <span className="material-symbols-outlined">person</span>
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-44 bg-white border border-outline-variant shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-outline-variant/50 sm:hidden">
                <p className="font-body-md font-semibold text-sm truncate" title={displayName}>{displayName}</p>
                <p className="font-label-md text-[10px] uppercase opacity-60">Petugas Aktif</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 font-label-md text-xs uppercase tracking-widest hover:bg-surface-container-low flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                Keluar
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}