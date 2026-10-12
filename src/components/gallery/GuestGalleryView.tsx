"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ASSETS } from "@/lib/assets"
import { downloadUrl, sharePhoto, displayCategory } from "@/lib/gallery-client"

export type GalleryViewPhoto = {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  source?: string | null
  uploader_name?: string | null
  category?: string | null
}

export type GalleryViewProps = {
  backHref: string
  cameraHref: string
  identityName: string
  identityCategory: string
  coupleName: string
  dateParts: { d: string; m: string; y: string } | null
  dateLabel: string
  photos: GalleryViewPhoto[]
  remaining: number
}

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }
const CAPTION_FONT: React.CSSProperties = { fontFamily: "'EB Garamond', Georgia, serif" }

function formatCardStamp(iso: string): string {
  try {
    const d = new Date(iso)
    const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":")
    return `${date} • ${time} WIB`
  } catch {
    return ""
  }
}

// Shared guest gallery (GT-styled), used by both the Galeri Tamu flow (/g)
// and Buku Tamu Digital (/welcome). Shows only the viewer's own photos.
export default function GuestGalleryView(props: GalleryViewProps) {
  const { backHref, cameraHref, identityName, identityCategory, coupleName, dateParts, dateLabel, photos, remaining } = props
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [sheetFor, setSheetFor] = useState<string | null>(null)

  // Card attribution is the STORED per-photo name (history survives a
  // rename — new uploads take the new name). identityName is only the
  // fallback for rows predating the field.
  const ownerOf = (p: GalleryViewPhoto) => (p.uploader_name || "").trim() || identityName
  const categoryOf = (p: GalleryViewPhoto) => (p.category || "").trim() || identityCategory

  const shareTextFor = (p: GalleryViewPhoto) => {
    const base = p.caption?.trim() ? p.caption.trim() : `Kenangan dari ${ownerOf(p) || "tamu"}`
    return `${base} — untuk ${coupleName || "mempelai"} ${p.image_url}`
  }

  const handleDownload = async (p: GalleryViewPhoto) => {
    setBusyId(p.id)
    setNotice("")
    try {
      await downloadUrl(p.image_url, `kenangan-${p.id}.jpg`)
    } catch {
      window.open(p.image_url, "_blank")
    } finally {
      setBusyId(null)
    }
  }

  const handleNativeShare = async (p: GalleryViewPhoto) => {
    setBusyId(p.id)
    setNotice("")
    try {
      const res = await fetch(p.image_url)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const file = new File([blob], `kenangan-${p.id}.jpg`, { type: blob.type || "image/jpeg" })
      const outcome = await sharePhoto({ file, title: `Kenangan untuk ${coupleName || "mempelai"}`, text: shareTextFor(p) })
      if (outcome === "unsupported") {
        setNotice("Perangkat tidak mendukung berbagi langsung — gunakan tombol di bawah.")
      }
    } catch {
      setNotice("Gagal berbagi. Coba unduh manual.")
    } finally {
      setBusyId(null)
    }
  }

  const copyText = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setNotice(done)
    } catch {
      setNotice("Gagal menyalin.")
    }
  }

  const dateStamp = dateParts ? `${dateParts.d} • ${dateParts.m} • ${dateParts.y}` : dateLabel

  return (
    <main className="flex-1 flex flex-col w-full pb-10" style={{ ...SANS, backgroundColor: "#fbf9f4", color: "#1b1c19" }}>
      <div className="flex flex-col w-full pb-10">
        <div className="relative overflow-hidden px-6 pt-4 pb-6 rounded-b-[1.5rem] shadow-sm" style={{ backgroundColor: "#f5f3ee" }}>
          <img src={ASSETS.galeriEnvelope.galleryBannerTopRight} alt="" aria-hidden className="absolute -top-6 -right-6 w-28 h-28 object-contain pointer-events-none" style={{ opacity: 0.25, transform: "rotate(12deg)" }} />
          <img src={ASSETS.galeriEnvelope.galleryBannerBottomLeft} alt="" aria-hidden className="absolute -bottom-8 -left-8 w-24 h-24 object-contain pointer-events-none" style={{ opacity: 0.2, transform: "rotate(-12deg)" }} />

          <div className="flex items-center justify-between mb-4 relative z-10">
            <button
              onClick={() => router.push(backHref)}
              className="flex items-center gap-1.5 transition-colors py-1 px-2.5 rounded-full bg-white shadow-sm hover:opacity-80"
              style={{ color: "#6b2b2d" }}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span className="text-[11px] font-semibold tracking-wider uppercase">Kembali</span>
            </button>
            <div className="flex items-center gap-2">
              {remaining > 0 ? (
                <button
                  onClick={() => router.push(cameraHref)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold shadow-sm hover:opacity-95 transition-all active:scale-95"
                  style={{ backgroundColor: "#4f1519" }}
                >
                  <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                  Foto Baru
                </button>
              ) : (
                <span className="text-[11px] uppercase tracking-widest text-[#867272]">Slot habis</span>
              )}
              <img src={ASSETS.galeriEnvelope.aksaraaMonogram} alt="Aksaraa" className="w-8 h-8 rounded-full object-cover shadow-sm" />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            <span className="text-[11px] uppercase tracking-widest font-semibold mb-1" style={{ color: "#6b2b2d" }}>Wedding Memories</span>
            <p className="text-[20px] leading-7 font-normal mt-0.5" style={SERIF}>{coupleName}</p>
            {dateStamp && (
              <div className="flex items-center gap-2 my-2 text-[#444841] text-[11px]">
                <span className="w-6 h-px" style={{ backgroundColor: "rgba(79,21,25,0.2)" }} />
                <span className="tracking-widest">{dateStamp}</span>
                <span className="w-6 h-px" style={{ backgroundColor: "rgba(79,21,25,0.2)" }} />
              </div>
            )}
            <p className="text-[15px] leading-[22px] text-[#444841] max-w-xs mt-0.5">
              Kumpulan tawa, kehangatan, dan rekaman kasih dari setiap sahabat yang hadir membersamai langkah kami.
            </p>
          </div>
        </div>

        {notice && (
          <p className="mx-6 mt-4 text-center text-[13px] text-white bg-[#30312e] rounded-full px-4 py-2">{notice}</p>
        )}

        <div className="px-6 flex flex-col gap-6 mt-6">
          {photos.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-6xl text-[#444841]/30">photo_library</span>
              <p className="text-[15px] text-[#444841] mt-2">Belum ada foto. Abadikan momen pertamamu!</p>
              {remaining > 0 && (
                <button
                  onClick={() => router.push(cameraHref)}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white text-[12px] font-semibold uppercase tracking-widest shadow-md"
                  style={{ backgroundColor: "#6b2b2d" }}
                >
                  <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                  Ambil Foto Pertama
                </button>
              )}
            </div>
          ) : (
            photos.map((p, i) => {
              const stripNo = String(photos.length - i).padStart(3, "0")
              const sheetOpen = sheetFor === p.id
              const shareText = shareTextFor(p)
              const owner = ownerOf(p)
              const catLabel = displayCategory(categoryOf(p))
              return (
                <article key={p.id} className="bg-white rounded-[1rem] p-4 shadow-md flex flex-col">
                  <div className="flex items-center justify-between pb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-semibold shrink-0" style={{ ...SERIF, backgroundColor: "#ffdad9", color: "#4f1519" }}>
                        {(owner.trim()[0] || "T").toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-[17px] leading-tight truncate" style={SERIF}>Momen dari {owner}</h3>
                        <span className="text-[11px] text-[#444841]">{formatCardStamp(p.created_at)}</span>
                      </div>
                    </div>
                    {catLabel && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: "#fea3a2", color: "#793638" }}>
                        {catLabel}
                      </span>
                    )}
                    {p.source === "selfie" && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: "#4f1519", color: "#ffdad9" }}>
                        Check-in
                      </span>
                    )}
                  </div>

                  <div className="relative my-3 rounded-lg overflow-hidden border border-[#d9c1c0]/30 shadow-sm flex flex-col items-center p-2" style={{ backgroundColor: "rgba(234,232,227,0.5)" }}>
                    <div className="w-full max-h-[380px] overflow-hidden rounded-md flex justify-center items-center bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image_url} alt={`Photostrip ${coupleName}`} loading="lazy" decoding="async" className="w-full h-auto object-contain max-h-[360px] rounded-md" />
                    </div>
                    <div className="flex items-center justify-between w-full px-2 pt-2 text-[#444841] text-[11px]">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]" style={{ color: "#4f1519" }}>photo_camera</span>
                        Photobooth Strip #{stripNo}
                      </span>
                    </div>
                  </div>

                  {p.caption && (
                    <p className="text-[17px] leading-[26px] mt-3 px-1" style={{ ...CAPTION_FONT, color: "#1b1c19" }}>
                      {p.caption}
                    </p>
                  )}

                  <div className="flex flex-col gap-2.5 pt-2 mt-2 bg-[#f5f3ee]/40 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4" />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDownload(p)}
                          disabled={busyId === p.id}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold shadow-sm hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                          style={{ backgroundColor: "#536251" }}
                        >
                          <span className="material-symbols-outlined text-[16px]">download</span>
                          Unduh
                        </button>
                        <button
                          onClick={() => setSheetFor(sheetOpen ? null : p.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-[11px] font-semibold shadow-sm hover:opacity-95 transition-all active:scale-95"
                          style={{ backgroundColor: "#6b2b2d" }}
                        >
                          <span className="material-symbols-outlined text-[16px]">share</span>
                          Bagikan
                        </button>
                      </div>
                    </div>
                    {sheetOpen && (
                      <div className="pt-2.5 border-t border-[#6b2b2d]/10 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 min-w-[100px] text-center px-3 py-2 rounded-full bg-white border border-[#E2D9CF] text-[11px] font-semibold text-[#2C2A29]"
                          >
                            WhatsApp
                          </a>
                          <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(p.image_url)}&text=${encodeURIComponent(p.caption?.trim() ? `${p.caption.trim()} — untuk ${coupleName}` : `Kenangan untuk ${coupleName}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 min-w-[100px] text-center px-3 py-2 rounded-full bg-white border border-[#E2D9CF] text-[11px] font-semibold text-[#2C2A29]"
                          >
                            Telegram
                          </a>
                          <button
                            onClick={() => copyText(shareText, "Caption + tautan foto disalin.")}
                            className="flex-1 min-w-[100px] px-3 py-2 rounded-full bg-white border border-[#E2D9CF] text-[11px] font-semibold text-[#2C2A29]"
                          >
                            Salin Caption
                          </button>
                        </div>
                        <button
                          onClick={() => handleNativeShare(p)}
                          disabled={busyId === p.id}
                          className="w-full px-3 py-2 rounded-full text-white text-[11px] font-semibold disabled:opacity-50"
                          style={{ backgroundColor: "#4f1519" }}
                        >
                          {busyId === p.id ? "Menyiapkan..." : "Aplikasi Lainnya..."}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })
          )}
        </div>
      </div>
    </main>
  )
}
