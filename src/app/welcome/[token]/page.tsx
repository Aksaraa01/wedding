"use client"

import { use, useEffect, useState } from "react"
import QRCode from "qrcode"
import ProfileMenu from "@/components/ProfileMenu"
import { useRouter, useSearchParams } from "next/navigation"

function formatDate(dateStr: string): string {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

export default function WelcomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const ref = token

  const [guestName, setGuestName] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [tableNumber, setTableNumber] = useState<string | null>(null)
  const [category, setCategory] = useState<string | null>(null)
  const [eventDate, setEventDate] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [error, setError] = useState("")
  const [wishMessage, setWishMessage] = useState("")
  const [wishSent, setWishSent] = useState(false)
  const [wishLoading, setWishLoading] = useState(false)
  const [submittedWish, setSubmittedWish] = useState("")
  const [weddingProfileId, setWeddingProfileId] = useState("")
  const [guestId, setGuestId] = useState("")
  const [guestQrToken, setGuestQrToken] = useState("")
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUrls, setPhotoUrls] = useState<string[]>([])
  const [photoQuota, setPhotoQuota] = useState(0)
  const [gates, setGates] = useState<{ wish_wall: boolean; galeri_foto_tamu: boolean }>({ wish_wall: true, galeri_foto_tamu: true })
  const [coverPhoto, setCoverPhoto] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const isModal = searchParams.get("modal") === "1"

  useEffect(() => {
    if (!ref) { setError("Token tidak ditemukan"); return }

    ;(async () => {
      try {
        const isTok = ref.startsWith("AKS-")
        const query = isTok
          ? `qr_token=${encodeURIComponent(ref)}`
          : `slug=${encodeURIComponent(ref)}`
        const res = await fetch(`/api/check-in?${query}`)
        if (!res.ok) throw new Error("QR tidak valid")
        const data = await res.json()
        if (!data.guest || !data.profile) throw new Error("Data tidak ditemukan")
        const guestToken = data.guest.qr_token || ref
        setGuestName(data.guest.name)
        setGuestId(data.guest.id)
        setGuestQrToken(guestToken)
        setCoupleName(data.profile.display_name || `${data.profile.bride_name} & ${data.profile.groom_name}`)
        setTableNumber(data.guest.table_number || null)
        setCategory(data.guest.category || null)
        setEventDate(formatDate(data.profile.estimated_wedding_date || ""))
        setWeddingProfileId(data.guest.wedding_profile_id)
        if (data.gates) setGates(data.gates)
        if (typeof data.photoQuota === "number") setPhotoQuota(data.photoQuota)
        const covers = Array.isArray(data.profile.cover_photos) ? data.profile.cover_photos : []
        const firstCover = covers.find((c: unknown) => typeof c === "string" && (c as string).trim()) as string | undefined
        setCoverPhoto((firstCover as string) || data.profile.couple_illustration_url || "/defaults/couple.png")

        if (!data.guest.is_checked_in) {
          await fetch("/api/check-in", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ qr_token: guestToken }),
          })
        }

        if (data.guest.id) {
          const wishCheck = await fetch(`/api/wishes?wedding_profile_id=${data.guest.wedding_profile_id}&guest_id=${data.guest.id}&source=welcome`)
          const wishData = await wishCheck.json()
          if (wishData.wishes && wishData.wishes.length > 0) {
            setWishSent(true)
            setSubmittedWish(wishData.wishes[0].message)
          }
          const photoCheck = await fetch(`/api/guest-photos?guest_id=${data.guest.id}`)
          const photoData = await photoCheck.json()
          const photos = Array.isArray(photoData.photos) ? photoData.photos.map((p: { image_url: string }) => p.image_url).filter(Boolean) : []
          setPhotoUrls(photos)
        }

        const url = `${window.location.origin}/welcome/${guestToken}`
        const qrUrl = await QRCode.toDataURL(url, {
          width: 240,
          margin: 1,
          color: { dark: "#1c1c16", light: "#ffffff" },
        })
        setQrDataUrl(qrUrl)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [ref])

  const handleSendWish = async () => {
    if (!wishMessage.trim() || !weddingProfileId) return
    setWishLoading(true)
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_profile_id: weddingProfileId,
          guest_id: guestId || null,
          name: guestName,
          message: wishMessage.trim(),
          source: "welcome",
        }),
      })
      if (res.ok) {
        setSubmittedWish(wishMessage.trim())
        setWishSent(true)
        setWishMessage("")
      }
    } finally {
      setWishLoading(false)
    }
  }

  useEffect(() => {
    const ticketNode = document.querySelector('.stagger-2')
    if (ticketNode) {
      const down = () => {
        (ticketNode as HTMLElement).style.transform = 'scale(0.99)'
        ;(ticketNode as HTMLElement).style.transition = 'transform 0.1s ease'
      }
      const up = () => {
        (ticketNode as HTMLElement).style.transform = 'scale(1)'
      }
      ticketNode.addEventListener('touchstart', down)
      ticketNode.addEventListener('touchend', up)
      return () => {
        ticketNode.removeEventListener('touchstart', down)
        ticketNode.removeEventListener('touchend', up)
      }
    }
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">qr_code_scanner</span>
          <h1 className="font-headline-md text-3xl text-primary font-medium mb-2">QR Tidak Valid</h1>
          <p className="text-sm text-on-surface-variant">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-on-surface font-body-md antialiased selection:bg-secondary-container selection:text-on-secondary-container" style={{ backgroundColor: "#ded1c1", backgroundImage: "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.6) 0%, rgba(240,228,215,0.4) 30%, transparent 65%), linear-gradient(115deg, #dfd2c2 0%, #ecdcc9 22%, #baa794 45%, #f2e4d3 62%, #caa890 82%, #dfd3c4 100%)", backgroundAttachment: "fixed" }}>
      {!isModal && (
        <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/40 transition-all">
          <div className="max-w-md mx-auto h-10 px-4 flex justify-between items-center">
            <div className="flex items-center justify-center h-full gap-1"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkNsI8ARUxXMRsspTqckKt3R3wPWKH4nQzAjvSSX8XOIG7Badtf4nTCEdbZJIhZmgtB1bKaCEO9_NxYhXtN5AMHZNGI7Ikd_ibUg1asX8ibbzaiFsziJQC5DEWFiocAMge6wnm9slHrN4gmweAOL3YOWxdyDfeGOh5Ceh45X8gMvsUG7agAqs4Uc_Fgm-Ehh0OzHsWlujNeeKEniXpVVDvp4tEzQNOzHeaHoH59FJMh3JJNI10BedKz2aoMiiDxfMhRg" alt="Aksara Logo" className="h-7 w-auto object-contain" /><span className="font-headline-md text-base tracking-wider text-primary">Aksaraa</span></div>
            <button aria-label="Profil Akun" className="w-8 h-8 flex items-center justify-end text-primary active:scale-95 transition-transform">
            </button>
          </div>
        </header>
      )}

      <main className={`w-full max-w-md mx-auto min-h-screen ${isModal ? "pt-6" : "pt-12"} pb-28 px-6 flex flex-col items-center`}>
        <div className="fade-in-up flex flex-col items-center mb-6 text-center">
        </div>
        <section className="relative w-full aspect-square max-w-md mx-auto mb-6 flex flex-col items-center justify-center">
          <img src="https://wedding.aksaraa.com/frames/welcome-flower.png" alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" style={{ transform: "scale(1.05)" }} />
          <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full overflow-hidden shadow-sm ring-1 ring-surface-variant z-10 mb-8 mt-12">{loading ? (<div className="w-full h-full bg-surface-container-high animate-pulse" />) : (<img alt="Couple Portrait" className="w-full h-full object-cover" src={coverPhoto || "/defaults/couple.png"} />)}</div>
          <div className="text-center space-y-2 mt-auto pb-12 px-8 py-6 rounded-xl border border-white/20 shadow-sm bg-white/10 z-10 w-full">
            <p className="text-label-md text-primary uppercase tracking-widest font-body-md">Selamat Datang,</p>
            {loading ? (<div className="h-8 bg-surface-container-high rounded animate-pulse w-48 mx-auto" />) : (<h1 className="font-headline-lg text-headline-lg text-primary lowercase tracking-tight"><span style={{ color: "rgb(28, 28, 22)", fontSize: "30px", fontWeight: 600, textTransform: "none", backgroundColor: "rgb(253, 249, 240)" }}>{guestName || "..."}</span></h1>)}
          </div>
        </section>

        <section className="fade-in-up stagger-2 w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-sm"><div className="text-center mb-4"><h3 className="font-headline-md text-xl font-medium text-primary">Ambil Momen Anda</h3><p className="text-xs text-on-surface-variant mt-1">Abadikan kebahagiaan hari ini secara langsung</p></div><div className="flex flex-col gap-4"><button onClick={() => window.open(`/welcome/${guestQrToken || ref}/camera`, '_blank')} className="w-full bg-[#B34E3F] text-white py-4 px-6 rounded-lg font-label-md text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#9E3B2D] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2"><span className="material-symbols-outlined text-sm">photo_camera</span>Buka Kamera</button>{photoUrls.length > 0 && (<button onClick={() => router.push(`/welcome/${guestQrToken || ref}/gallery`)} className="w-full bg-surface-container-high text-primary py-3 px-6 rounded-lg font-label-md text-xs uppercase tracking-[0.2em] border border-outline-variant/30 flex items-center justify-center gap-2 hover:bg-surface-container-highest transition-colors"><span className="material-symbols-outlined text-sm">photo_library</span>Lihat {photoUrls.length} Foto ({photoQuota ? `${photoQuota - photoUrls.length} sisa` : ""})</button>)}</div></section>
        <section className="fade-in-up stagger-3 w-full mt-8 bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <h3 className="font-headline-md text-xl font-medium text-primary">Tulis Doa &amp; Harapan</h3>
            <p className="text-xs text-on-surface-variant mt-1">Berikan ucapan restu terbaik Anda untuk kedua mempelai</p>
          </div>
          {wishSent ? (
            <div className="text-center py-8">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              <p className="font-headline-md text-lg text-primary font-medium">Terima Kasih!</p>
              {submittedWish && (
                <div className="mt-4 p-4 bg-surface-container-lowest rounded-lg border border-outline-variant/30 text-left">
                  <p className="text-sm text-on-surface leading-relaxed italic">&ldquo;{submittedWish}&rdquo;</p>
                </div>
              )}
              <p className="text-xs text-on-surface-variant mt-4">Doa dan harapan Anda telah tersampaikan.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <textarea value={wishMessage} onChange={(e) => setWishMessage(e.target.value)} placeholder="Tuliskan pesan hangat dan doa Anda di sini..." className="w-full min-h-[110px] p-4 bg-surface-container-lowest border border-outline-variant/50 rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all resize-none text-sm shadow-inner" />
              <button onClick={handleSendWish} disabled={wishLoading || !wishMessage.trim()} className="w-full bg-[#B34E3F] text-white py-4 px-6 rounded-lg font-label-md text-xs uppercase tracking-[0.2em] transition-all hover:bg-[#9E3B2D] active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-[#B34E3F]/50">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                {wishLoading ? "Mengirim..." : "Kirim Doa Restu"}
              </button>
            </div>
          )}
        </section>

        <div className="fade-in-up stagger-4 w-full flex flex-col shadow-md rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-lowest mt-8">
          <div className="bg-primary text-on-primary p-6 flex flex-col items-center text-center relative">
            <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-surface border-r border-outline-variant/40"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-surface border-l border-outline-variant/40"></div>
            <p className="font-label-md text-[10px] uppercase opacity-80 tracking-[0.2em] mb-1">Penempatan Meja</p>
            {loading ? (<div className="h-8 bg-white/20 rounded animate-pulse w-24 mx-auto" />) : (<h2 className="font-headline-xl text-4xl font-bold tracking-tight my-1">{tableNumber || "—"}</h2>)}
            {!loading && category && (
              <span className="inline-block px-3 py-1 bg-on-primary/10 rounded-full text-xs font-medium tracking-wide italic opacity-95 mt-1 border border-on-primary/10">
                {category}
              </span>
            )}
          </div>
          <div className="w-full text-outline-variant/40 ticket-dash h-px bg-transparent"></div>
          <section className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block font-label-md text-[9px] bg-secondary/10 text-secondary px-2 py-0.5 rounded uppercase tracking-wider">E-Pass Access</span>
                {loading ? (<div className="mt-2 space-y-2"><div className="h-5 bg-surface-container-high rounded animate-pulse w-32" /><div className="h-3 bg-surface-container-high rounded animate-pulse w-24" /></div>) : (<><h3 className="font-headline-md text-xl font-medium text-primary mt-2">{coupleName || "..."}</h3><p className="text-xs text-on-surface-variant/80 mt-0.5">{eventDate}</p></>)}
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/30 text-on-surface-variant/70">
                <span className="material-symbols-outlined text-xl" data-icon="qr_code_2">qr_code_2</span>
              </div>
            </div>
            <div className="flex items-center gap-5 p-4 bg-surface rounded-lg border border-outline-variant/30">
              <div className="w-20 h-20 bg-white p-1.5 rounded border border-outline-variant/20 flex-shrink-0 shadow-sm">
                {qrDataUrl ? (
                  <img alt="QR Code Tamu" className="w-full h-full object-contain mix-blend-multiply" src={qrDataUrl} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Status Gerbang</p>
                <div className="flex items-center gap-1 text-emerald-700 font-semibold text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Verified Access
                </div>
                <p className="text-[10px] font-mono tracking-wider text-on-surface-variant/70 mt-1.5 bg-surface-container-high px-1.5 py-0.5 rounded inline-block">ID: AKSR-{guestQrToken.slice(-6)}</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .fade-in-up {
          animation: fadeInUp 1s cubic-bezier(0.215, 0.610, 0.355, 1) forwards;
          opacity: 0;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .ticket-dash {
          background-image: linear-gradient(to right, currentColor 50%, rgba(255,255,255,0) 0%);
          background-position: bottom;
          background-size: 8px 1px;
          background-repeat: repeat-x;
        }
      `}</style>
    </div>
  )
}