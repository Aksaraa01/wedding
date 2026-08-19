"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { BANKS, bankLogoUrl } from "@/lib/bankList"

// Searchable bank/e-wallet picker with logo preview. Selecting a bank sets its
// slug+name; "Lainnya (Kustom)" lets a free-text provider be entered.

export default function BankSelect({
  value,
  name,
  onChange,
  showLogo = true,
}: {
  value: string // selected slug, or "" for custom
  name: string // display name (custom text when value === "")
  onChange: (slug: string, displayName: string) => void
  showLogo?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState("")
  const [mode, setMode] = useState<"pick" | "custom">(value ? "pick" : "custom")
  const [custom, setCustom] = useState(name)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selected = value ? BANKS.find((b) => b.slug === value) : undefined
  const query = q.trim().toLowerCase()

  const groups = useMemo(() => {
    const filtered = query
      ? BANKS.filter((b) => b.name.toLowerCase().includes(query) || b.slug.includes(query))
      : BANKS
    return [
      { label: "Bank", items: filtered.filter((b) => b.type === "bank") },
      { label: "E-Wallet", items: filtered.filter((b) => b.type === "ewallet") },
    ]
  }, [query])

  const displayName = mode === "custom" ? custom : selected?.name || name

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          setQ("")
        }}
        className="w-full flex items-center gap-3 bg-transparent border-b border-brand-border py-2.5 text-sm text-brand-charcoal hover:border-brand-terracotta focus:outline-none text-left"
      >
        {showLogo && selected ? (
          <img src={bankLogoUrl(selected.slug)} alt="" className="w-6 h-6 object-contain shrink-0" />
        ) : null}
        <span className="flex-1 truncate">{displayName || "Pilih Bank / E-Wallet"}</span>
        <span className="material-symbols-outlined text-[16px] text-brand-slate shrink-0">{open ? "expand_less" : "expand_more"}</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-brand-border rounded-xl shadow-lg max-h-72 overflow-y-auto">
          <div className="sticky top-0 bg-brand-cream p-2 border-b border-brand-border flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-brand-slate">search</span>
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari bank / e-wallet..."
              className="w-full bg-transparent outline-none text-sm py-0.5"
            />
          </div>

          {mode !== "pick" && (
            <button
              type="button"
              onClick={mode === "custom" ? () => { setOpen(false); onChange("", custom) } : undefined}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-brand-terracotta hover:bg-brand-cream ${mode === "custom" ? "font-semibold" : ""}`}
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              Lainnya (Kustom)
            </button>
          )}

          {mode === "custom" && (
            <div className="px-3 py-2 border-b border-brand-border">
              <label className="block text-[10px] uppercase tracking-wider text-brand-slate mb-1">Nama Bank / E-Wallet</label>
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { setOpen(false); onChange("", custom) } }}
                placeholder="Contoh: Bank XYZ"
                className="w-full bg-white border border-brand-border rounded-lg px-2 py-1.5 text-sm text-brand-charcoal outline-none focus:border-brand-terracotta"
                onFocus={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={() => { setOpen(false); onChange("", custom) }}
                className="mt-1.5 w-full py-1.5 bg-brand-charcoal text-white rounded-lg text-[10px] uppercase tracking-wider font-semibold hover:bg-brand-terracotta"
              >
                Gunakan Nama Kustom
              </button>
            </div>
          )}

          {groups.map((g) =>
            g.items.length === 0 ? null : (
              <div key={g.label}>
                <div className="px-3 py-1 font-label-md text-[10px] uppercase tracking-wider text-brand-slate bg-brand-cream/50">{g.label}</div>
                {g.items.map((b) => (
                  <button
                    key={b.slug}
                    type="button"
                    onClick={() => {
                      setMode("pick")
                      setCustom(b.name)
                      setOpen(false)
                      onChange(b.slug, b.name)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-cream text-left ${b.slug === value ? "bg-brand-cream font-semibold" : ""}`}
                  >
                    <img src={bankLogoUrl(b.slug)} alt="" className="w-6 h-6 object-contain shrink-0" />
                    <span className="truncate">{b.name}</span>
                    {b.slug === value && <span className="ml-auto material-symbols-outlined text-[16px] text-brand-terracotta">check</span>}
                  </button>
                ))}
              </div>
            )
          )}

          {query && groups.every((g) => g.items.length === 0) && (
            <p className="px-3 py-2 text-xs text-brand-slate">Tidak ada hasil. Gunakan &ldquo;Lainnya (Kustom)&rdquo;.</p>
          )}
        </div>
      )}
    </div>
  )
}