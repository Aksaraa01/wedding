"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import ProfileMenu from "@/components/ProfileMenu"

type GuestPhoto = {
  id: string
  image_url: string
  created_at: string
  guest_id: string
  guests: { name: string; category: string } | null
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
  const [retention, setRetention] = useState<{ hasEventDate: boolean; latestEventDate: string | null; deletionDate: string | null }>({ hasEventDate: false, latestEventDate: null, deletionDate: null })

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

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased">
        <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 bg-surface border-b border-outline-variant h-20 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between px-edge-margin-mobile md:px-edge-margin-desktop h-full w-full">
            <span className="font-label-md text-label-md text-primary uppercase tracking-widest">Galeri Kenangan</span>
            <ProfileMenu />
          </div>
        </header>

      <main className="pt-32 pb-32 max-w-container-max mx-auto px-edge-margin-mobile md:px-edge-margin-desktop">
        {!loading && retention.hasEventDate && retention.deletionDate && (
          <div className="mb-10 flex items-start gap-3 bg-secondary-container/40 border border-secondary/30 px-5 py-4">
            <span className="material-symbols-outlined text-secondary shrink-0 mt-0.5">info</span>
            <p className="font-body-md text-[13px] text-on-surface">
              Foto kenangan tamu akan dihapus otomatis 7 hari setelah acara,{" "}
              <span className="font-semibold">{formatDeletionDate(retention.deletionDate)}</span> (tanggal penghapusan).
              Segera download foto sebelum tanggal tersebut.
            </p>
          </div>
        )}

        {!loading && !retention.hasEventDate && (
          <div className="mb-10 flex flex-col md:flex-row md:items-center items-start gap-4 bg-surface-container-highest border border-outline-variant px-5 py-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="material-symbols-outlined text-on-surface-variant shrink-0 mt-0.5">schedule</span>
              <p className="font-body-md text-[13px] text-on-surface">
                Tanggal acara belum diatur pada editor undangan. Atur tanggal acara agar foto kenangan tamu dikelola otomatis.
              </p>
            </div>
            <button
              onClick={() => router.push(`/dashboard/${id}/web-invitation/editor`)}
              className="shrink-0 border border-primary text-primary font-label-md text-[11px] uppercase tracking-widest px-5 py-3 hover:bg-primary hover:text-white transition-colors duration-300"
            >
              Buka Editor
            </button>
          </div>
        )}

        <section className="mb-16 fade-in" style={{ animation: "fadeIn 0.8s ease-out forwards" }}>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-outline-variant pb-8">
            <div className="max-w-2xl">
              <h2 className="font-headline-xl text-[28px] md:text-headline-xl text-primary mb-4">Galeri Kenangan Tamu</h2>
              <p className="font-body-lg text-body-md md:text-body-lg text-on-surface-variant">Melihat hari bahagia Anda melalui lensa para tamu terkasih.</p>
            </div>
            <div className="flex flex-col items-start md:items-end gap-4">
              <div className="flex flex-col items-start md:items-end">
                <span className="font-label-md text-label-md uppercase text-secondary tracking-widest mb-1">Total Dokumentasi</span>
                <span className="font-headline-lg text-[24px] md:text-headline-lg text-primary">{loading ? "..." : `${photos.length} Momen Terunggah`}</span>
              </div>
              {!loading && photos.length > 0 && (
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  className="flex items-center gap-2 border border-primary text-primary font-label-md text-label-md uppercase tracking-widest px-5 py-3 hover:bg-primary hover:text-white transition-colors duration-300 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">{downloadingAll ? "hourglass_empty" : "archive"}</span>
                  {downloadingAll ? "Menyiapkan ZIP..." : `Unduh Semua (${photos.length})`}
                </button>
              )}
            </div>
          </div>
        </section>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-32">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">photo_library</span>
            <p className="font-body-md text-on-surface-variant">Belum ada foto dari tamu</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-gutter">
            {photos.map((photo, i) => {
              let colSpan = "md:col-span-6"
              let aspect = "aspect-[4/3]"
              if (i === 0) { colSpan = "md:col-span-8"; aspect = "aspect-[16/10]" }
              else if (i === 1) { colSpan = "md:col-span-4"; aspect = "aspect-[3/4]" }
              else if (i === 2) { colSpan = "md:col-span-4"; aspect = "aspect-square" }
              else if (i === 3) { colSpan = "md:col-span-8"; aspect = "aspect-[16/9]" }
              else { colSpan = "md:col-span-6"; aspect = "aspect-[4/3]" }

              return (
                <div key={photo.id} className={`${colSpan} group`} style={{ animation: `fadeIn 0.8s ease-out forwards`, animationDelay: `${0.2 + i * 0.1}s`, opacity: 0 }}>
                  <div className={`${aspect} overflow-hidden bg-surface-container mb-4`}>
                    <img
                      src={photo.image_url}
                      alt={`Foto oleh ${photo.guests?.name || "Tamu"}`}
                      className="w-full h-full object-cover editorial-img cursor-pointer"
                      style={{ transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)" }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
                    />
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant transition-colors duration-300"
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#8d4d39" }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "#444748" }}>
                      Oleh: {photo.guests?.name || "Tamu"}
                      {photo.guests?.category ? <span className="text-on-surface-variant/50 ml-1">({photo.guests.category})</span> : null}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary transition-colors select-none"
                        title="Unduh foto ini"
                        onClick={() => downloadSingle(photo.image_url, `${photo.guests?.name || "tamu"}-${photo.id}.jpg`)}
                      >download</span>
                      <span
                        className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-secondary transition-colors select-none"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
                        onClick={(e) => {
                          const el = e.currentTarget
                          const filled = el.style.fontVariationSettings.includes("'FILL' 1")
                          el.style.fontVariationSettings = filled ? "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" : "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24"
                          el.style.color = filled ? "" : "#8d4d39"
                        }}
                      >favorite</span>
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
