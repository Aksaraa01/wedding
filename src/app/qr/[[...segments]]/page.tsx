"use client"

import { use, useEffect, useState, useRef } from "react"
import QRCode from "qrcode"

function getSegment(segments: string[] | undefined): string | null {
  if (!segments || segments.length === 0) return null
  return segments[0]
}

function isToken(value: string): boolean {
  return value.startsWith("AKS-")
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/&/g, "dan").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function DigitalPassPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = use(params)
  const segment = getSegment(segments)

  const [guestName, setGuestName] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [tableNumber, setTableNumber] = useState("")
  const [category, setCategory] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [qrToken, setQrToken] = useState("")
  const [slug, setSlug] = useState("")
  const [estimatedDate, setEstimatedDate] = useState("")
  const [sessions, setSessions] = useState<any[]>([])
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [error, setError] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [copyOk, setCopyOk] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("preview") === "1") {
      setIsPreview(true)
      ;(async () => {
        const slug = params.get("slug") || "preview"
        const couple = params.get("couple") || "Tamu & Keluarga"
        const time = params.get("time") || ""
        const venue = params.get("venue") || ""
        const address = params.get("address") || ""
        const sessions = time || venue || address ? [{ time, venue, address }] : []
        setGuestName("Tamu Undangan")
        setCoupleName(couple)
        setTableNumber("Meja 5")
        setCategory("")
        setGuestCount(2)
        setQrToken(`AKS-PREVIEW-${slug}`)
        setSlug(slug)
        setEstimatedDate(params.get("date") || "")
        setSessions(sessions)
        const qrContent = `https://${slug}.wedding.aksaraa.com/welcome/preview`
        const url = await QRCode.toDataURL(qrContent, {
          width: 400,
          margin: 2,
          color: { dark: "#1A1817", light: "#ffffff" },
        })
        setQrDataUrl(url)
      })()
      return
    }

    if (!segment) { setError("Token tidak ditemukan"); return }

    ;(async () => {
      try {
        const isTok = isToken(segment)
        const query = isTok
          ? `qr_token=${encodeURIComponent(segment)}`
          : `slug=${encodeURIComponent(segment)}`
        const res = await fetch(`/api/check-in?${query}`)
        if (!res.ok) throw new Error("QR tidak valid")
        const data = await res.json()
        if (!data.guest || !data.profile) throw new Error("Data tidak ditemukan")

        if (data.guest.is_checked_in) {
          const guestSlug = data.guest.slug || data.guest.qr_token || segment
          window.location.replace(`/welcome/${guestSlug}`)
          return
        }

        setGuestName(data.guest.name)
        setCoupleName(`${data.profile.bride_name} & ${data.profile.groom_name}`)
        setTableNumber(data.guest.table_number || "")
        setCategory(data.guest.category || "")
        const pax = data.guest.rsvp_status === "HADIR" && data.guest.rsvp_pax_count
          ? data.guest.rsvp_pax_count
          : 2
        setGuestCount(pax)
        setQrToken(data.guest.qr_token || segment)
        setSlug(data.profile.slug || "")
        setEstimatedDate(data.profile.estimated_wedding_date || "")
        setSessions(data.profile.sessions || [])
        const qrContent = data.profile.slug
          ? `https://${data.profile.slug}.wedding.aksaraa.com/welcome/${data.guest.qr_token || segment}`
          : data.guest.qr_token || segment
        const url = await QRCode.toDataURL(qrContent, {
          width: 400,
          margin: 2,
          color: { dark: "#1A1817", light: "#ffffff" },
        })
        setQrDataUrl(url)
      } catch (e: any) {
        setError(e.message)
      }
    })()
  }, [segment])

  const fallbackCode = qrToken.slice(0, 11)

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(fallbackCode).then(() => {
      setCopyOk(true)
      setTimeout(() => setCopyOk(false), 2000)
    })
  }

  const [qrModalOpen, setQrModalOpen] = useState(false)

  const downloadPass = () => {
    if (!cardRef.current) return
    setDownloading(true)
    import("html2canvas").then((html2canvas) => {
      html2canvas.default(cardRef.current!, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#FFFFFF",
      }).then((canvas) => {
        const link = document.createElement("a")
        link.download = `Wedding-Pass-${slugify(guestName)}.png`
        link.href = canvas.toDataURL("image/png")
        link.click()
        setDownloading(false)
      }).catch(() => setDownloading(false))
    }).catch(() => setDownloading(false))
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-brand-slate/50 mb-4">qr_code_scanner</span>
          <h1 className="font-serif text-3xl text-brand-charcoal font-medium mb-2">QR Tidak Valid</h1>
          <p className="text-sm text-brand-slate">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={isPreview ? "min-h-full flex flex-col items-center py-6 px-4 sm:px-6" : "min-h-screen flex flex-col justify-between items-center py-6 px-4 sm:px-6"} style={{ backgroundColor: "#FBF8F3", color: "#1A1817", fontFamily: "'Plus Jakarta Sans', sans-serif", WebkitFontSmoothing: "antialiased" }}>
      {!isPreview && (
        <header className="w-full max-w-md flex items-center justify-between mb-6 md:justify-center md:gap-8">
          <button onClick={() => history.back()} className="w-10 h-10 rounded-full bg-white border border-[rgba(26,24,23,0.08)] flex items-center justify-center text-[#1A1817] hover:bg-[#FBF8F3] transition-all active:scale-95 md:fixed md:top-6 md:left-6 md:z-30 md:shadow-md">
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/60 px-3 py-1 rounded-full text-[11px] font-medium text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Tersimpan Offline
          </div>
          <button onClick={() => window.location.reload()} className="w-10 h-10 rounded-full bg-white border border-[rgba(26,24,23,0.08)] flex items-center justify-center text-[#1A1817] hover:bg-[#FBF8F3] transition-all active:scale-95">
            <span className="material-symbols-outlined text-xl">refresh</span>
          </button>
        </header>
      )}

      <main className="w-full max-w-md flex flex-col items-center">
        {!isPreview && (
          <div className="text-center mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#8D4D39] font-semibold mb-1">Aksaraa Guestbook Pass</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1817] font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Kartu Masuk Digital</h1>
            <p className="text-xs text-[#5C5854] mt-1 max-w-[260px] mx-auto">Tunjukkan kode QR ini kepada meja penerima tamu di lokasi resepsi.</p>
          </div>
        )}

        <div ref={cardRef} id="wedding-pass-card" className="w-full rounded-2xl overflow-hidden border border-[rgba(26,24,23,0.08)] relative" style={{ background: "#FFFFFF", boxShadow: "0 16px 40px -12px rgba(26, 24, 23, 0.08), 0 4px 12px -2px rgba(26, 24, 23, 0.03)" }}>
          <div className="absolute w-6 h-6 bg-[#FBF8F3] rounded-full top-[58%] -translate-y-1/2 z-20 left-[-12px]" style={{ boxShadow: "inset -3px 0 4px rgba(26, 24, 23, 0.05)" }} />
          <div className="absolute w-6 h-6 bg-[#FBF8F3] rounded-full top-[58%] -translate-y-1/2 z-20 right-[-12px]" style={{ boxShadow: "inset 3px 0 4px rgba(26, 24, 23, 0.05)" }} />
          <div className="absolute border-t-2 border-dashed border-[rgba(26,24,23,0.12)] top-[58%] left-4 right-4 z-10" />

          <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-5" style={{ backgroundColor: "#FBF8F3", border: "1px solid rgba(212, 197, 185, 0.4)" }}>
              <span className="material-symbols-outlined text-[#8D4D39] text-sm">auto_awesome</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1A1817]">Official Invitation</span>
            </div>

            <p className="text-xs uppercase tracking-[0.2em] text-[#5C5854] mb-1">The Wedding of</p>
            <h2 className="text-3xl sm:text-4xl text-[#1A1817] font-medium mb-6" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{coupleName || "..."}</h2>

            <div className="w-full rounded-xl p-4 mb-6 text-center" style={{ backgroundColor: "rgba(251, 248, 243, 0.8)", border: "1px solid rgba(26, 24, 23, 0.08)" }}>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#8D4D39] font-bold block mb-1">Tamu Undangan</span>
              <h3 className="text-2xl text-[#1A1817] font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{guestName || "..."}</h3>

              <div className="flex items-center justify-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(26, 24, 23, 0.06)" }}>
                <div>
                  <span className="block text-[10px] text-[#5C5854]/60 uppercase tracking-wider">Alokasi Duduk</span>
                  <span className="font-semibold text-[#1A1817]">{tableNumber || "—"}</span>
                </div>
                <div className="w-px h-6" style={{ backgroundColor: "rgba(26, 24, 23, 0.08)" }} />
                <div>
                  <span className="block text-[10px] text-[#5C5854]/60 uppercase tracking-wider">Kuota Tamu</span>
                  <span className="font-semibold text-[#1A1817]">{guestCount} Orang (Pax)</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center group cursor-pointer" onClick={() => setQrModalOpen(true)}>
              <div className="p-4 rounded-xl relative" style={{ background: "#FFFFFF", border: "1px solid rgba(26, 24, 23, 0.1)", boxShadow: "0 8px 24px rgba(26, 24, 23, 0.04)" }}>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Digital Pass QR Code" className="w-48 h-48 object-contain" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-[#1A1817] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[#1A1817]/5 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                  <span className="bg-white/95 text-[#1A1817] text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">zoom_in</span> Perbesar QR
                  </span>
                </div>
              </div>

              {fallbackCode && (
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono text-[#5C5854]" style={{ backgroundColor: "#FBF8F3", border: "1px solid rgba(26, 24, 23, 0.08)" }}>
                  <span>{fallbackCode}</span>
                  <button onClick={handleCopyCode} className="hover:text-[#8D4D39] transition-colors ml-1" title="Salin Kode">
                    <span className="material-symbols-outlined text-sm" style={{ color: copyOk ? "#059669" : undefined }}>{copyOk ? "check" : "content_copy"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-10 pb-6 px-6 sm:px-8 text-center" style={{ backgroundColor: "#FFFFFF" }}>
            <div className="grid grid-cols-2 gap-4 text-left py-4 mb-6" style={{ borderTop: "1px solid rgba(26, 24, 23, 0.08)", borderBottom: "1px solid rgba(26, 24, 23, 0.08)" }}>
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#8D4D39] text-lg mt-0.5">calendar_today</span>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#5C5854]/70">Waktu &amp; Tanggal</span>
                  <p className="text-xs font-medium text-[#1A1817] mt-0.5">
                    {estimatedDate ? `${formatDate(estimatedDate)}` : "—"}
                    <br /><span className="text-[#5C5854] font-normal">{sessions[0]?.time || ""}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#8D4D39] text-lg mt-0.5">location_on</span>
                <div>
                  <span className="block text-[10px] uppercase tracking-wider text-[#5C5854]/70">Lokasi Acara</span>
                  <p className="text-xs font-medium text-[#1A1817] mt-0.5">
                    {sessions[0]?.venue || "—"}
                    {sessions[0]?.address && <br />}
                    {sessions[0]?.address && <span className="text-[#5C5854] font-normal">{sessions[0].address}</span>}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C5854]/60 font-medium">Aksaraa Digital Guestbook Platform</p>
          </div>
        </div>

        {!isPreview && (
          <div className="w-full mt-6 space-y-3">
          <button onClick={downloadPass} disabled={downloading} className="w-full h-12 bg-[#1A1817] text-white rounded-xl text-xs uppercase tracking-[0.15em] font-semibold hover:bg-[#8D4D39] transition-all duration-300 active:scale-[0.98] shadow-md flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            <span>{downloading ? "MEMPROSES GAMBAR..." : "Simpan ke Galeri (PNG)"}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <a href="https://maps.google.com" target="_blank" rel="noopener" className="h-11 bg-white border border-[rgba(26,24,23,0.08)] rounded-xl text-xs font-medium text-[#1A1817] hover:bg-[#FBF8F3] transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[#8D4D39] text-base">map</span>
              Petunjuk Lokasi
            </a>
            <button onClick={() => setQrModalOpen(true)} className="h-11 bg-white border border-[rgba(26,24,23,0.08)] rounded-xl text-xs font-medium text-[#1A1817] hover:bg-[#FBF8F3] transition-colors flex items-center justify-center gap-1.5">
              <span className="material-symbols-outlined text-[#8D4D39] text-base">fit_screen</span>
              Kecerahan Maks
            </button>
          </div>

          <p className="text-center text-[11px] text-[#5C5854]/60 flex items-center justify-center gap-1.5 pt-2">
            <span className="material-symbols-outlined text-sm">verified_user</span>
            Terenkripsi &amp; Terverifikasi oleh Aksaraa System
          </p>
          </div>
        )}
      </main>

      {!isPreview && (
        <footer className="mt-8 text-center text-[11px] text-[#5C5854]/50">
          <p>&copy; 2026 Aksaraa Wedding Experience. All rights reserved.</p>
        </footer>
      )}

      {qrModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex-col items-center justify-center p-6 flex" style={{ animation: "zoomIn 0.2s ease" }}>
          <div className="bg-white p-6 sm:p-8 rounded-3xl max-w-xs w-full text-center flex flex-col items-center shadow-2xl relative">
            <button onClick={() => setQrModalOpen(false)} className="absolute top-4 right-4 text-[#5C5854] hover:text-[#1A1817] p-1">
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#8D4D39] mb-1">Pindai di Meja Resepsi</span>
            <h4 className="text-2xl text-[#1A1817] font-semibold mb-4" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{guestName}</h4>
            <div className="bg-white p-3 border border-[rgba(26,24,23,0.08)] rounded-2xl shadow-inner mb-4">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Enlarged QR Code" className="w-60 h-60 object-contain" />
              ) : (
                <div className="w-60 h-60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[#1A1817] border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <p className="text-xs text-[#5C5854] mb-4">Tunjukkan layar ini langsung ke kamera pemindai penerima tamu.</p>
            <button onClick={() => setQrModalOpen(false)} className="w-full py-3 rounded-xl text-[#1A1817] font-medium text-xs hover:bg-[rgba(26,24,23,0.08)] transition-colors" style={{ backgroundColor: "#FBF8F3", border: "1px solid rgba(26, 24, 23, 0.08)" }}>
              Tutup Tampilan
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        body { margin: 0; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      </div>
  )
}
