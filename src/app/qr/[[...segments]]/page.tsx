"use client"

import { use, useEffect, useState, useRef } from "react"
import QRCode from "qrcode"
import { useVisiblePoll } from "@/lib/useVisiblePoll"
import { resolveCoupleName } from "@/lib/coupleName"
import { resolveEventPhoto } from "@/lib/event-photo"
import StorageImage from "@/components/StorageImage"
import { coupleUrl } from "@/lib/coupleUrl"

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

type DisplaySession = { name: string; date: string; time: string; venue: string; address: string }

// Pass shows every session (e.g. Akad + Resepsi) labeled with the acara name;
// date/time roll down to the session's own date, else the profile-level date.
function displaySessions(rawSessions: any[], estimatedDate: string): DisplaySession[] {
  const list = (Array.isArray(rawSessions) ? rawSessions : [])
    .filter((s) => s && (s.date || s.time || s.venue || s.address))
    .map((s) => {
      const time = (s.time || "").trim()
      return {
        name: (s.name || "").trim(),
        date: formatDate(s.date || estimatedDate),
        time: time && !/\bwib\b/i.test(time) ? `${time} WIB` : time,
        venue: (s.venue || "").trim(),
        address: (s.address || "").trim(),
      }
    })
  if (list.length === 0) {
    return [{ name: "", date: formatDate(estimatedDate), time: "", venue: "", address: "" }]
  }
  return list
}

export default function DigitalPassPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = use(params)
  const segment = getSegment(segments)

  const [guestName, setGuestName] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [hashtag, setHashtag] = useState("")
  const [passPhoto, setPassPhoto] = useState("/defaults/couple.png")
  const [tableNumber, setTableNumber] = useState("")
  const [guestCount, setGuestCount] = useState(1)
  const [qrToken, setQrToken] = useState("")
  const [slug, setSlug] = useState("")
  const [isVip, setIsVip] = useState(false)
  const [guestLoaded, setGuestLoaded] = useState(false)
  const [estimatedDate, setEstimatedDate] = useState("")
  const [sessions, setSessions] = useState<any[]>([])
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [error, setError] = useState("")
  const [downloading, setDownloading] = useState(false)
  const [copyOk, setCopyOk] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [pollToken, setPollToken] = useState("")
  const [pollRedirect, setPollRedirect] = useState("")
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
        setHashtag(params.get("hashtag") || "")
        setPassPhoto(params.get("photo") || "/defaults/couple.png")
        setTableNumber("Meja 5")
        setIsVip(false)
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
        setGuestLoaded(true)
      })()
      return
    }

    if (!segment) { setError("Token tidak ditemukan"); setGuestLoaded(true); return }

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
        setCoupleName(resolveCoupleName(data.profile))
        setHashtag((data.profile.display_name || "").trim())
        setPassPhoto(resolveEventPhoto(data.profile) || "/defaults/couple.png")
        setTableNumber(data.guest.table_number || "")
        setIsVip(data.guest.is_vip === true)
        const pax = data.guest.rsvp_status === "HADIR" && data.guest.rsvp_pax_count
          ? data.guest.rsvp_pax_count
          : 2
        setGuestCount(pax)
        setQrToken(data.guest.qr_token || segment)
        setSlug(data.profile.slug || "")
        setEstimatedDate(data.profile.estimated_wedding_date || "")
        setSessions(data.profile.sessions || [])
        const qrContent = data.profile.slug
          ? coupleUrl(data.profile.slug, `/welcome/${data.guest.qr_token || segment}`)
          : data.guest.qr_token || segment
        const url = await QRCode.toDataURL(qrContent, {
          width: 400,
          margin: 2,
          color: { dark: "#1A1817", light: "#ffffff" },
        })
        setQrDataUrl(url)

        setPollToken(data.guest.qr_token || segment)
        setPollRedirect(data.guest.slug || data.guest.qr_token || segment)
        setGuestLoaded(true)
      } catch (e: any) {
        setError(e.message)
        setGuestLoaded(true)
      }
    })()
  }, [segment])

  // Poll check-in state, paused while hidden (a background tab needs no
  // redirect; one fresh check fires on return).
  useVisiblePoll(async () => {
    try {
      const res = await fetch(`/api/check-in?qr_token=${encodeURIComponent(pollToken)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.guest?.is_checked_in) {
        ;(window.top || window).location.replace(`/welcome/${pollRedirect}`)
      }
    } catch {}
  }, 5000, pollToken !== "")

  const fallbackCode = qrToken.slice(0, 11)
  const passSessions = displaySessions(sessions, estimatedDate)

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
    <div className={isPreview ? "min-h-full flex flex-col" : "min-h-screen flex flex-col justify-between items-center py-6 px-4 sm:px-6"} style={{ backgroundColor: "#ded1c1", backgroundImage: "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.6) 0%, rgba(240,228,215,0.4) 30%, transparent 65%), linear-gradient(115deg, #dfd2c2 0%, #ecdcc9 22%, #baa794 45%, #f2e4d3 62%, #caa890 82%, #dfd3c4 100%)", backgroundAttachment: "fixed", color: "#1A1817", fontFamily: "'Plus Jakarta Sans', sans-serif", WebkitFontSmoothing: "antialiased" }}>
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

      <main className={isPreview ? "w-full flex flex-col" : "w-full max-w-md flex flex-col items-center"}>
        {!guestLoaded ? (
          <div className="w-full max-w-[430px] flex flex-col items-center animate-pulse" aria-label="Memuat kartu">
            <div className="h-3 w-36 rounded-full bg-white/50 mb-3" />
            <div className="h-8 w-60 rounded-lg bg-white/50 mb-6" />
            <div className="w-full rounded-[32px] bg-white/30 overflow-hidden">
              <div className="h-60 bg-white/40" />
              <div className="p-6 flex justify-center">
                <div className="w-40 h-40 rounded-2xl bg-white/60" />
              </div>
            </div>
          </div>
        ) : (
          <>
        {isVip && !isPreview && (
          <>
            <div className="w-full max-w-[430px] flex flex-col items-center">
              <div className="text-center mb-6 px-3">
                <p className="text-[11px] uppercase tracking-[0.24em] font-semibold text-[#8B643C] mb-1.5 flex items-center justify-center gap-1.5">
                  Aksaraa Guestbook Pass
                </p>
                <h1 className="text-[34px] leading-tight font-normal text-[#2C221A] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  Kartu Masuk Digital <span className="italic font-medium text-[#A67B2A]">VIP</span>
                </h1>
                <p className="text-[12.5px] leading-relaxed text-[#5C4D40] max-w-[320px] mx-auto mt-2 font-normal">
                  Tunjukkan kode QR VIP ini kepada meja penerima tamu khusus tamu kehormatan &amp; VIP.
                </p>
              </div>

              <article ref={cardRef} className="w-full rounded-[32px] relative overflow-hidden flex flex-col" style={{ background: "linear-gradient(rgb(26, 23, 20) 0%, rgb(21, 18, 16) 100%)", border: "1.5px solid rgb(197, 154, 78)", boxShadow: "rgba(0, 0, 0, 0.65) 0px 24px 50px -10px, rgba(197, 154, 78, 0.15) 0px 0px 30px, rgba(255, 235, 185, 0.25) 0px 1px 1px inset" }}>
                <div className="relative h-60 shrink-0">
                  <StorageImage src={passPhoto} width={800} quality={75} alt="Foto resepsi" draggable={false} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26, 23, 20, 0.10) 0%, rgba(26, 23, 20, 0.06) 40%, rgba(26, 23, 20, 0.58) 72%, rgba(26, 23, 20, 0.92) 100%)" }} />
                  <span className="absolute top-4 left-4 z-10 px-4 py-1.5 rounded-full text-[14px] font-extrabold tracking-[0.14em] text-[#3A2C12]" style={{ background: "linear-gradient(135deg, #F9F1CB 0%, #EAD894 55%, #F4EABB 100%)", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.45)" }}>VIP</span>
                  <div className="absolute bottom-3.5 inset-x-5 z-10 text-left">
                    <p className="text-[12px] font-medium text-white/85 mb-0.5">The Wedding Of</p>
                    <h2 className="text-[30px] leading-[1.08] font-bold text-white break-words" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
                      {coupleName || "..."}
                    </h2>
                    {hashtag ? <p className="text-[11.5px] font-medium text-white/75 mt-1 break-words">{hashtag}</p> : null}
                  </div>
                </div>

                <div className="flex-1 px-5 py-5">
                  <div className="grid grid-cols-[176px,minmax(0,1fr)] gap-4 items-start">
                    <div className="flex flex-col items-center">
                      <div className="p-3 rounded-3xl relative bg-white" style={{ border: "3px solid #D4AF37", boxShadow: "0 12px 28px rgba(0, 0, 0, 0.45)" }}>
                        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 rounded-tr" style={{ borderColor: "#AA7C11" }} />
                        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 rounded-bl" style={{ borderColor: "#AA7C11" }} />
                        <div className="w-36 h-36 bg-white rounded-2xl p-1 flex items-center justify-center relative overflow-hidden">
                          {qrDataUrl ? (
                            <button type="button" onClick={() => setQrModalOpen(true)} className="absolute inset-1.5" title="Perbesar QR">
                              <img src={qrDataUrl} alt="VIP QR Code" className="w-full h-full object-contain" />
                              <span className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                <span className="bg-white/95 text-[#1A1817] text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
                                  <span className="material-symbols-outlined text-sm">zoom_in</span> Perbesar QR
                                </span>
                              </span>
                            </button>
                          ) : (
                            <div className="w-8 h-8 border-2 border-[#1A1817] border-t-transparent rounded-full animate-spin" />
                          )}
                        </div>
                      </div>

                      {fallbackCode && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-xl font-mono text-[11.5px] tracking-wider" style={{ background: "#25201A", border: "1px solid #7D5D2B" }}>
                          <span className="font-bold text-[#EED8A1]">{fallbackCode}</span>
                          <button className="text-[#B89B77] hover:text-[#FAF5ED] active:scale-95 transition-transform" onClick={handleCopyCode} title="Salin Kode VIP" type="button">
                            <span className="material-symbols-outlined text-sm" style={{ color: copyOk ? "#059669" : undefined }}>{copyOk ? "check" : "content_copy"}</span>
                          </button>
                        </div>
                      )}

                      <p className="mt-2.5 text-[9px] leading-snug text-center text-white/60">
                        Bawa kartu ini dan perlihatkan kepada penerima tamu saat melakukan check-in di lokasi acara
                      </p>
                    </div>

                    <div className="flex flex-col min-w-0 text-left">
                      <p className="text-[12.5px] font-semibold text-[#E6C364]">You are invited to our wedding day!</p>
                      <p className="text-[11.5px] text-[#C2B29F] mt-3">Dear</p>
                      <h3 className="text-[23px] font-semibold text-[#FAF5ED] leading-tight break-words" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                        {guestName || "..."}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-[#F3E2B3]" style={{ background: "#25201A", border: "1px solid #7D5D2B" }}>
                          Meja {tableNumber || "-"}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold text-[#F3E2B3]" style={{ background: "#25201A", border: "1px solid #7D5D2B" }}>
                          {guestCount} Pax
                        </span>
                      </div>

                      {passSessions.map((ev, i) => (
                        <div key={i} className={i > 0 ? "mt-2.5 pt-2.5" : "mt-4"} style={i > 0 ? { borderTop: "1px dashed rgba(212, 175, 55, 0.35)" } : undefined}>
                          {ev.name && (
                            <p className="text-[10.5px] uppercase tracking-[0.16em] font-semibold text-[#E6C364]">{ev.name}</p>
                          )}
                          <div className="flex items-start gap-2 mt-1.5">
                            <span className="material-symbols-outlined text-[15px] text-[#E6C364] shrink-0 mt-0.5">calendar_today</span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#FAF5ED] leading-tight">{ev.date || "-"}</p>
                              {ev.time && <p className="text-[11.5px] text-[#C2B29F] mt-0.5">{ev.time}</p>}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 mt-1.5">
                            <span className="material-symbols-outlined text-[15px] text-[#E6C364] shrink-0 mt-0.5">location_on</span>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-[#FAF5ED] leading-tight">{ev.venue || "-"}</p>
                              {ev.address && <p className="text-[11.5px] text-[#C2B29F] leading-snug mt-0.5">{ev.address}</p>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="relative w-full flex items-center">
                  <div className="w-6 h-6 absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full" style={{ background: "#ded1c1", boxShadow: "inset -3px 0 4px rgba(26, 24, 23, 0.05)" }} />
                  <div className="w-6 h-6 absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full" style={{ background: "#ded1c1", boxShadow: "inset 3px 0 4px rgba(26, 24, 23, 0.05)" }} />
                  <div className="w-full mx-7 border-b-2 border-dashed" style={{ borderColor: "rgba(212, 175, 55, 0.35)" }} />
                </div>

                <div className="px-6 pt-4 pb-5 text-center">
                  <p className="text-[9.5px] tracking-[0.22em] text-[#9E8B77] uppercase font-medium">
                    Aksaraa Digital Guestbook Platform
                  </p>
                </div>
              </article>

              <div className="w-full mt-6 space-y-3">
                <button onClick={downloadPass} disabled={downloading} className="w-full h-12 text-white rounded-xl text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-300 active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: "#1A1714", border: "1px solid #7D5D2B" }}>
                  <span className="material-symbols-outlined text-base">download</span>
                  <span>{downloading ? "MEMPROSES GAMBAR..." : "Simpan ke Galeri (PNG)"}</span>
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <a href={sessions[0]?.maps_url || "https://maps.google.com"} target="_blank" rel="noopener" className="h-11 bg-white border border-[rgba(26,24,23,0.08)] rounded-xl text-xs font-medium text-[#1A1817] hover:bg-[#FBF8F3] transition-colors flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[#8D4D39] text-base">map</span>
                    Petunjuk Lokasi
                  </a>
                  <button onClick={() => setQrModalOpen(true)} className="h-11 bg-white border border-[rgba(26,24,23,0.08)] rounded-xl text-xs font-medium text-[#1A1817] hover:bg-[#FBF8F3] transition-colors flex items-center justify-center gap-1.5">
                    <span className="material-symbols-outlined text-[#8D4D39] text-base">fit_screen</span>
                    Kecerahan Maks
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {(!isVip || isPreview) && (
          <>
        {!isPreview && (
          <div className="text-center mb-6">
            <p className="text-[11px] uppercase tracking-[0.25em] text-[#8D4D39] font-semibold mb-1">Aksaraa Guestbook Pass</p>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1A1817] font-medium" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Kartu Masuk Digital</h1>
            <p className="text-xs text-[#5C5854] mt-1 max-w-[260px] mx-auto">Tunjukkan kode QR ini kepada meja penerima tamu di lokasi resepsi.</p>
          </div>
        )}

        <div ref={cardRef} id="wedding-pass-card" className="w-full rounded-2xl overflow-hidden border border-[rgba(26,24,23,0.08)] relative flex flex-col" style={{ background: "#FFFFFF", boxShadow: "0 16px 40px -12px rgba(26, 24, 23, 0.08), 0 4px 12px -2px rgba(26, 24, 23, 0.03)" }}>
          <div className="relative h-56 shrink-0">
            <StorageImage src={passPhoto} width={800} quality={75} alt="Foto resepsi" draggable={false} className="absolute inset-0 w-full h-full object-cover" loading="eager" />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(26, 23, 20, 0.08) 0%, rgba(26, 23, 20, 0.06) 40%, rgba(26, 23, 20, 0.56) 72%, rgba(26, 23, 20, 0.88) 100%)" }} />
            <div className="absolute bottom-3.5 inset-x-5 z-10 text-left">
              <p className="text-[11.5px] font-medium text-white/85 mb-0.5">The Wedding of</p>
              <h2 className="text-[27px] leading-[1.08] font-bold text-white break-words" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", textShadow: "0 1px 8px rgba(0,0,0,0.35)" }}>
                {coupleName || "..."}
              </h2>
              {hashtag ? <p className="text-[11px] font-medium text-white/75 mt-0.5 break-words">{hashtag}</p> : null}
            </div>
          </div>

          <div className="flex-1 px-4 pt-5 pb-4">
            <div className="grid grid-cols-[160px,minmax(0,1fr)] gap-3.5 items-start">
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-xl relative" style={{ background: "#FFFFFF", border: "1px solid rgba(26, 24, 23, 0.1)", boxShadow: "0 8px 24px rgba(26, 24, 23, 0.04)" }}>
                  {qrDataUrl ? (
                    <button type="button" onClick={() => setQrModalOpen(true)} title="Perbesar QR" className="block">
                      <img src={qrDataUrl} alt="Digital Pass QR Code" className="w-32 h-32 object-contain" />
                    </button>
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[#1A1817] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>

                {fallbackCode && (
                  <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10.5px] font-mono text-[#5C5854]" style={{ backgroundColor: "#FBF8F3", border: "1px solid rgba(26, 24, 23, 0.08)" }}>
                    <span>{fallbackCode}</span>
                    <button onClick={handleCopyCode} className="hover:text-[#8D4D39] transition-colors ml-1" title="Salin Kode">
                      <span className="material-symbols-outlined text-sm" style={{ color: copyOk ? "#059669" : undefined }}>{copyOk ? "check" : "content_copy"}</span>
                    </button>
                  </div>
                )}

                <p className="mt-2 text-[9px] leading-snug text-center text-[#5C5854]/70">
                  Bawa kartu ini dan perlihatkan kepada penerima tamu saat melakukan check-in di lokasi acara
                </p>
              </div>

              <div className="flex flex-col min-w-0 text-left">
                <p className="text-[12px] font-semibold text-[#8D4D39]">You are invited to our wedding day!</p>
                <p className="text-[11px] text-[#5C5854] mt-2.5">Dear</p>
                <h3 className="text-[21px] font-semibold text-[#1A1817] leading-tight break-words" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                  {guestName || "..."}
                </h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-semibold text-[#1A1817]" style={{ backgroundColor: "#FBF8F3", border: "1px solid rgba(26, 24, 23, 0.12)" }}>
                    Meja {tableNumber || "-"}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[9.5px] font-semibold text-[#1A1817]" style={{ backgroundColor: "#FBF8F3", border: "1px solid rgba(26, 24, 23, 0.12)" }}>
                    {guestCount} Pax
                  </span>
                </div>

                {passSessions.map((ev, i) => (
                  <div key={i} className={i > 0 ? "mt-2 pt-2" : "mt-3.5"} style={i > 0 ? { borderTop: "1px dashed rgba(26, 24, 23, 0.15)" } : undefined}>
                    {ev.name && (
                      <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-[#8D4D39]">{ev.name}</p>
                    )}
                    <div className="flex items-start gap-2 mt-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#8D4D39] shrink-0 mt-0.5">calendar_today</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#1A1817] leading-tight">{ev.date || "-"}</p>
                        {ev.time && <p className="text-[10.5px] text-[#5C5854] mt-0.5">{ev.time}</p>}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 mt-1.5">
                      <span className="material-symbols-outlined text-[14px] text-[#8D4D39] shrink-0 mt-0.5">location_on</span>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#1A1817] leading-tight">{ev.venue || "-"}</p>
                        {ev.address && <p className="text-[10.5px] text-[#5C5854] leading-snug mt-0.5">{ev.address}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative w-full flex items-center">
            <div className="w-6 h-6 absolute left-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full" style={{ background: "#ded1c1", boxShadow: "inset -3px 0 4px rgba(26, 24, 23, 0.05)" }} />
            <div className="w-6 h-6 absolute right-[-12px] top-1/2 -translate-y-1/2 z-20 rounded-full" style={{ background: "#ded1c1", boxShadow: "inset 3px 0 4px rgba(26, 24, 23, 0.05)" }} />
            <div className="w-full mx-7 border-b-2 border-dashed border-[rgba(26,24,23,0.12)]" />
          </div>

          <div className="pt-4 pb-5 px-6 text-center" style={{ backgroundColor: "#FFFFFF" }}>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#5C5854]/60 font-medium">Aksaraa Digital Guestbook Platform</p>
          </div>
        </div>

        {!isPreview && (
          <div className="w-full mt-6 space-y-3">
          <button onClick={downloadPass} disabled={downloading} className="w-full h-12 bg-[#8D4D39] text-white rounded-xl text-xs uppercase tracking-[0.15em] font-semibold hover:bg-[#8D4D39] transition-all duration-300 active:scale-[0.98] shadow-md flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            <span>{downloading ? "MEMPROSES GAMBAR..." : "Simpan ke Galeri (PNG)"}</span>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <a href={sessions[0]?.maps_url || "https://maps.google.com"} target="_blank" rel="noopener" className="h-11 bg-white border border-[rgba(26,24,23,0.08)] rounded-xl text-xs font-medium text-[#1A1817] hover:bg-[#FBF8F3] transition-colors flex items-center justify-center gap-1.5">
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
          </>
        )}
          </>
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
        body { margin: 0; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes shimmer { 0% { opacity: 0.85; } 50% { opacity: 1; transform: scale(1.02); } 100% { opacity: 0.85; } }
      `}</style>
      </div>
  )
}
