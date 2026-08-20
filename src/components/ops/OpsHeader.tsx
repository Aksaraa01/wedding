"use client"

import Link from "next/link"

type OpsEmployee = { name: string; role: string }

const NAV_ITEMS: { key: "antrian" | "music" | "template"; label: string; href: string; adminOnly?: boolean }[] = [
  { key: "antrian", label: "Antrian", href: "/ops" },
  { key: "music", label: "Music", href: "/ops/music" },
  { key: "template", label: "Template", href: "/ops/templates", adminOnly: true },
]

export default function OpsHeader({
  employee,
  activeKey,
}: {
  employee: OpsEmployee
  activeKey: (typeof NAV_ITEMS)[number]["key"]
}) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 md:px-12 h-20 bg-background border-b border-outline-variant">
      <div className="flex items-center gap-4">
        <h1 className="font-display-lg text-headline-md tracking-widest text-primary uppercase">Aksaraa</h1>
        <span className="text-xs font-label-md tracking-widest bg-primary text-white px-2 py-1 ml-2">CORE OPS</span>
      </div>
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex gap-10">
          {NAV_ITEMS.map((item) => {
            if (item.adminOnly && employee.role !== "admin") return null
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
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-label-md text-[10px] uppercase opacity-60">Petugas Aktif</p>
            <p className="font-body-md font-semibold text-sm">{employee.name}</p>
          </div>
          <div className="w-10 h-10 bg-surface-container-highest border border-outline-variant flex items-center justify-center">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </div>
    </header>
  )
}