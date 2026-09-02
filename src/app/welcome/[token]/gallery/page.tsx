"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

type Photo = { id: string; image_url: string; created_at: string; source?: string | null }

function formatStamp(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yy = String(d.getFullYear()).slice(-2)
  return `${dd} ${mm} '${yy}`
}

function formatFilterLabel(dateStr: string): string {
  if (dateStr === "all") return "Semua Tanggal"
  const d = new Date(dateStr)
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })
}

export default function GalleryPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const router = useRouter()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [quota, setQuota] = useState(0)
  const [filter, setFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const isTok = token.startsWith("AKS-")
        const query = isTok ? `qr_token=${encodeURIComponent(token)}` : `slug=${encodeURIComponent(token)}`
        const res = await fetch(`/api/check-in?${query}`)
        const data = await res.json()
        if (data.guest) {
          const guestId = data.guest.id
          if (typeof data.photoQuota === "number") setQuota(data.photoQuota)
          const photoRes = await fetch(`/api/guest-photos?guest_id=${guestId}`)
          const photoData = await photoRes.json()
          const list = Array.isArray(photoData.photos) ? photoData.photos : []
          setPhotos(list.map((p: any) => ({ id: p.id, image_url: p.image_url, created_at: p.created_at, source: p.source })))
        }
      } catch {}
      setLoading(false)
    })()
  }, [token])

  const dates = Array.from(new Set(photos.map(p => p.created_at ? new Date(p.created_at).toISOString().slice(0, 10) : ""))).filter(Boolean).sort().reverse()
  const filtered = filter === "all" ? photos : photos.filter(p => p.created_at && new Date(p.created_at).toISOString().slice(0, 10) === filter)
  const remaining = Math.max(0, quota - photos.length)

  return (
    <div className="antialiased min-h-screen flex flex-col pb-24" style={{ backgroundColor: "#0d0c11", color: "#ffffff" }}>
      <header className="bg-transparent border-b border-[#2a2a2a] w-full flex justify-between items-center px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
        <button onClick={() => router.back()} className="text-white hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="font-headline-sm text-headline-sm text-center text-white" style={{ fontFamily: "Playfair Display" }}>Galeri Momen Anda</h1>
        <div className="w-6"></div>
      </header>
      <main className="flex-grow container mx-auto px-4 max-w-lg mt-6">
        <section className="mb-8">
          <div className="flex justify-between items-end border-b border-[#2a2a2a] pb-4">
            <div>
              <p className="font-headline-md text-2xl text-white">{filtered.length} Foto Terambil</p>
              {filter !== "all" && <p className="text-xs text-white/60 mt-1">{formatFilterLabel(filter)}</p>}
            </div>
            <div className="text-right">
              <p className="font-label-md text-label-md uppercase tracking-wider" style={{ color: "#DFA88D" }}>{remaining} Sisa Slot</p>
            </div>
          </div>
          {dates.length > 0 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
              <button onClick={() => setFilter("all")} className={`px-4 py-2 rounded-full text-xs font-label-md uppercase tracking-wider border whitespace-nowrap ${filter === "all" ? "bg-white text-black border-white" : "bg-transparent text-white border-[#2a2a2a] hover:border-white/40"}`}>Semua</button>
              {dates.map(d => (
                <button key={d} onClick={() => setFilter(d)} className={`px-4 py-2 rounded-full text-xs font-label-md uppercase tracking-wider border whitespace-nowrap ${filter === d ? "bg-white text-black border-white" : "bg-transparent text-white border-[#2a2a2a] hover:border-white/40"}`}>{formatFilterLabel(d)}</button>
              ))}
            </div>
          )}
        </section>
        {loading ? (
          <section className="grid grid-cols-2 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[9/16] rounded-[24px] overflow-hidden border border-[#2a2a2a] bg-white/5 animate-pulse" />
            ))}
          </section>
        ) : (
          <section className="grid grid-cols-2 gap-4">
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelected(p)} className="aspect-[9/16] rounded-[24px] overflow-hidden relative group border border-[#2a2a2a] cursor-pointer active:scale-[0.98] transition-transform">
                <img className="w-full h-full object-cover" src={p.image_url} alt="Momen" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-100"></div>
                {p.source === "selfie" && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[9px] font-bold bg-black/40 backdrop-blur-sm px-2 py-1 rounded-full uppercase tracking-wider border border-white/20" style={{ color: "#DFA88D" }}>
                    <span className="material-symbols-outlined text-[10px]">photo_camera</span>
                    Foto Check-in
                  </span>
                )}
                <div className="absolute bottom-4 right-4 date-stamp text-sm" style={{ fontFamily: "'Courier New', monospace", fontWeight: "bold", color: "#d1b89a", letterSpacing: "0.1em", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}>{formatStamp(p.created_at)}</div>
                <span className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity border border-white/20 hidden md:flex">
                  <span className="material-symbols-outlined text-white text-sm">download</span>
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 text-center py-20 text-white/60 text-sm">Belum ada foto {filter !== "all" ? "pada tanggal ini" : ""}</div>
            )}
          </section>
        )}
      </main>
      <div className="fixed bottom-0 left-0 w-full z-50 flex justify-center items-center pb-8 pt-4 bg-gradient-to-t from-[#0d0c11] via-[#0d0c11]/80 to-transparent">
        <button onClick={() => router.push(`/welcome/${token}/camera`)} className="px-8 py-4 rounded-full font-label-md text-label-md uppercase tracking-widest flex items-center space-x-2 hover:opacity-90 transition-opacity" style={{ backgroundColor: "#DFA88D", color: "#0d0c11" }}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
          <span>Buka Kamera</span>
        </button>
      </div>
      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-black rounded-[24px] overflow-hidden border border-white/10" onClick={e => e.stopPropagation()}>
            <img src={selected.image_url} alt="Momen" className="w-full h-auto max-h-[70vh] object-contain" />
            <div className="p-4 flex justify-between items-center bg-[#0d0c11]">
              <span className="text-sm" style={{ fontFamily: "'Courier New', monospace", color: "#d1b89a" }}>{formatStamp(selected.created_at)}</span>
              <a href={selected.image_url} download={`momen-${selected.id}.jpg`} target="_blank" rel="noreferrer" className="px-6 py-2 bg-white text-black rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-white/90">
                <span className="material-symbols-outlined text-sm">download</span> Download
              </a>
            </div>
            <button onClick={() => setSelected(null)} className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70">
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
