"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ProfileMenu from "@/components/ProfileMenu"

type GuestPhoto = {
  id: string
  image_url: string
  created_at: string
  guest_id: string
  source?: string | null
  guests: { name: string; category: string; is_checked_in?: boolean | null } | null
}

function formatDeletionDate(date: string): string {
  const [y, m, d] = date.split("-")
  return `${d}-${m}-${y}`
}

export default function GaleriKenangan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [photos, setPhotos] = useState<GuestPhoto[]>([])
  const [loading, setLoading] = useState(true)
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [search, setSearch] = useState("")
    const [retention, setRetention] = useState<{ hasEventDate: boolean; latestEventDate: string | null; deletionDate: string | null }>({ hasEventDate: false, latestEventDate: null, deletionDate: null })
  const [sortBy, setSortBy] = useState<"terbaru" | "disukai">("terbaru")
  const filteredPhotos = [...photos].filter((p) => !search.trim() || (p.guests?.name || "").toLowerCase().includes(search.trim().toLowerCase())).sort((a, b) => {
    if (sortBy === "terbaru") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    return 0
  })

  const downloadSingle = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
      URL.revokeObjectURL(link.href)
    } catch {
      window.open(url, "_blank")
    }
  }

  const downloadAll = async () => {
    if (downloadingAll) return
    setDownloadingAll(true)
    try {
      const res = await fetch(`/api/guest-photos/download-all?wedding_profile_id=${id}`)
      if (!res.ok) {
        const text = await res.text()
        alert(text || "Gagal mengunduh")
        return
      }
      const { photos: manifest } = await res.json()
      if (!manifest || manifest.length === 0) {
        alert("Belum ada foto untuk diunduh")
        return
      }

      const { zip } = await import("fflate")
      const output = new Map<string, Uint8Array>()
      const files: Record<string, Uint8Array> = {}

      for (const item of manifest) {
        try {
          const imgRes = await fetch(item.url)
          if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`)
          files[item.name] = new Uint8Array(await imgRes.arrayBuffer())
        } catch {
          // lewati file yang gagal
        }
      }

      if (Object.keys(files).length === 0) {
        alert("Tidak ada foto yang berhasil diunduh")
        return
      }

      await new Promise<void>((resolve, reject) => {
        zip(files, { level: 6 }, (err, data) => {
          if (err) return reject(err)
          output.set("zip", data)
          resolve()
        })
      })

      const blob = new Blob([output.get("zip")!], { type: "application/zip" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "galeri-kenangan.zip"
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setDownloadingAll(false)
    }
  }

  useEffect(() => {
    fetch(`/api/guest-photos?wedding_profile_id=${id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.photos) setPhotos(data.photos)
        if (data?.hasEventDate !== undefined) {
          setRetention({ hasEventDate: data.hasEventDate, latestEventDate: data.latestEventDate, deletionDate: data.deletionDate })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    const onScroll = () => {
      const header = document.querySelector("header")
      if (!header) return
      if (window.scrollY > 20) {
        header.classList.add("shadow-sm", "h-16")
        header.classList.remove("h-20")
      } else {
        header.classList.remove("shadow-sm", "h-16")
        header.classList.add("h-20")
      }
    }
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  function formatRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Baru saja"
    if (mins < 60) return `${mins} menit lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours} jam lalu`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days} hari lalu`
    return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-on-surface font-body-md antialiased">
        <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 bg-surface border-b border-outline-variant h-20 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between px-edge-margin-mobile md:px-edge-margin-desktop h-full w-full">
            <span className="font-label-md text-label-md text-primary uppercase tracking-widest">Galeri Kenangan</span>
            <ProfileMenu />
          </div>
        </header>

      <main className="pt-32 pb-28 md:pb-32 max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop">
        {!loading && retention.hasEventDate && retention.deletionDate && (
          <div className="mb-10 flex items-start gap-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl px-5 py-4 shadow-sm">
            <span className="material-symbols-outlined text-[#92400E] shrink-0 mt-0.5">info</span>
            <p className="font-body-md text-[13px] text-[#92400E]">
              Foto tersedia sampai {formatDeletionDate(retention.deletionDate)}, jangan lupa di download
            </p>
          </div>
        )}

        {!loading && !retention.hasEventDate && (
          <div className="mb-10 flex flex-col md:flex-row md:items-center gap-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-start gap-3 flex-1">
              <span className="material-symbols-outlined text-[#92400E] shrink-0 mt-0.5">warning</span>
              <p className="font-body-md text-[13px] text-[#92400E] leading-relaxed">
                Tanggal acara belum diatur. Atur tanggal agar foto dikelola otomatis dan unduhan tepat waktu.
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/${id}/web-invitation/editor`)}
              className="shrink-0 bg-[#B34E3F] text-white rounded-full font-label-md text-[11px] uppercase tracking-widest px-6 py-3 inline-flex items-center justify-center gap-2 hover:bg-[#9E3B2D] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
              Buka Editor
            </button>
          </div>
        )}

        <section className="mb-8 fade-in" style={{ animation: "fadeIn 0.8s ease-out forwards" }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#E2D9CF] pb-8">
            <div className="max-w-2xl">
              <h2 className="font-headline-xl text-[28px] md:text-headline-xl text-[#2C2A29] mb-3">Galeri Kenangan Tamu</h2>
              <p className="font-body-lg text-body-md md:text-body-lg text-on-surface-variant">Melihat hari bahagia Anda melalui lensa para tamu terkasih.</p>
              <div className="mt-4 inline-flex items-center gap-2 bg-white border border-[#E2D9CF] rounded-full px-4 py-2 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]"></span>
                <span className="font-label-md text-[11px] uppercase tracking-widest text-[#2C2A29] font-bold">{loading ? "..." : `${photos.length} Momen`}</span>
                <span className="text-on-surface-variant/40">•</span>
                <span className="font-body-md text-[11px] text-on-surface-variant">Terunggah</span>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              {!loading && photos.length > 0 && (
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  className="inline-flex items-center gap-2 bg-[#B34E3F] text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-[#9E3B2D] active:scale-95 transition-all disabled:opacity-50 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">{downloadingAll ? "hourglass_empty" : "download"}</span>
                  {downloadingAll ? "Menyiapkan ZIP..." : `Unduh Semua (${photos.length})`}
                </button>
              )}
            </div>
          </div>
        </section>

        {!loading && photos.length > 0 && (
          <div className="mb-6 bg-white border border-[#E2D9CF] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center shadow-sm">
            <div className="flex-1 flex items-center gap-3 bg-[#FAF7F2] border border-[#E2D9CF]/50 rounded-full px-4 py-2">
              <span className="material-symbols-outlined text-on-surface-variant/70 text-xl">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama tamu..."
                className="flex-1 bg-transparent border-none focus:ring-0 py-1 text-sm text-on-surface placeholder:text-outline-variant/80 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={() => setSortBy("terbaru")} className={`px-4 py-2 rounded-full font-label-md text-[11px] uppercase tracking-widest border transition-colors ${sortBy === "terbaru" ? "bg-[#B34E3F] text-white border-[#B34E3F]" : "bg-white text-[#2C2A29] border-[#E2D9CF] hover:border-[#B34E3F]"}`}>Terbaru</button>
              <button onClick={() => setSortBy("disukai")} className={`px-4 py-2 rounded-full font-label-md text-[11px] uppercase tracking-widest border transition-colors ${sortBy === "disukai" ? "bg-[#B34E3F] text-white border-[#B34E3F]" : "bg-white text-[#2C2A29] border-[#E2D9CF] hover:border-[#B34E3F]"}`}>Paling Disukai</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">photo_library</span>
            <p className="font-body-md text-on-surface-variant">Belum ada foto dari tamu</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-16 bg-white border border-outline-variant/50 rounded-xl">
            <p className="font-body-md text-sm text-on-surface-variant">Tidak ada foto untuk “{search}”</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPhotos.map((photo, i) => {
              return (
                <div key={photo.id} className="group bg-white border border-[#E2D9CF] rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ animation: `fadeIn 0.8s ease-out forwards`, animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}>
                  <div className="relative overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
                    <img
                      src={photo.image_url}
                      alt={`Foto oleh ${photo.guests?.name || "Tamu"}`}
                      className="w-full h-auto max-h-[520px] object-contain cursor-pointer"
                      style={{ transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                      onClick={() => window.open(photo.image_url, "_blank")}
                    />
                    <button onClick={() => window.open(photo.image_url, "_blank")} className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#2C2A29] hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity" title="Lihat penuh">
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                    {photo.source === "selfie" && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-[9px] font-bold text-white bg-[#B34E3F] rounded-full px-2 py-1 uppercase tracking-wider">
                        <span className="material-symbols-outlined text-[10px]">photo_camera</span>
                        Foto Check-in
                      </span>
                    )}
                  </div>
                  <div className="bg-white px-4 py-3 flex items-center justify-between gap-3 border-t border-[#E2D9CF]">
                    <div className="min-w-0">
                      <p className="font-body-md font-semibold text-[14px] text-[#2C2A29] truncate">{photo.guests?.name || "Tamu"}</p>
                      <p className="font-label-md text-[11px] text-on-surface-variant flex items-center gap-1.5">
                        {photo.guests?.category ? <span className="truncate max-w-[80px]">{photo.guests.category}</span> : <span>Umum</span>}
                        <span className="text-on-surface-variant/30">•</span>
                        <span className="text-[11px]">{formatRelativeTime(photo.created_at)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E2D9CF] flex items-center justify-center text-on-surface-variant hover:text-[#B34E3F] hover:border-[#B34E3F] transition-colors"
                        title="Sukai"
                        onClick={(e) => {
                          const el = e.currentTarget.querySelector("span") as HTMLElement
                          if (!el) return
                          const filled = el.style.fontVariationSettings.includes("'FILL' 1")
                          el.style.fontVariationSettings = filled ? "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" : "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24"
                          el.style.color = filled ? "" : "#B34E3F"
                        }}
                      ><span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>favorite</span></button>
                      <button
                        className="w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E2D9CF] flex items-center justify-center text-on-surface-variant hover:text-[#B34E3F] hover:border-[#B34E3F] transition-colors"
                        title="Unduh foto ini"
                        onClick={() => downloadSingle(photo.image_url, `${photo.guests?.name || "tamu"}-${photo.id}.jpg`)}
                      ><span className="material-symbols-outlined text-[16px]">download</span></button>
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #fdf9f0; }
        ::-webkit-scrollbar-thumb { background: #e5e1d8; }
      `}</style>
    </div>
  )
}
