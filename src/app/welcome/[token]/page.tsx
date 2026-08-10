"use client"

import { use, useEffect, useState } from "react"
import QRCode from "qrcode"
import ProfileMenu from "@/components/ProfileMenu"

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
  const [photoUploaded, setPhotoUploaded] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState("")
  const [gates, setGates] = useState<{ wish_wall: boolean; galeri_foto_tamu: boolean }>({ wish_wall: true, galeri_foto_tamu: true })

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
          if (photoData.exists) {
            setPhotoUploaded(true)
          }
          if (photoData.photo?.image_url) {
            setPhotoUrl(photoData.photo.image_url)
          }
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
      }
    })()
  }, [ref])

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !guestId || !weddingProfileId) return

    if (!file.type.startsWith("image/")) { alert("File harus berupa gambar"); return }
    if (file.size > 5 * 1024 * 1024) { alert("Ukuran file maksimal 5MB"); return }

    setPhotoUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("guest_id", guestId)
      formData.append("wedding_profile_id", weddingProfileId)
      const res = await fetch("/api/guest-photos/upload", { method: "POST", body: formData })
      if (res.ok) {
        const result = await res.json()
        setPhotoUrl(result.photo?.image_url || "")
        setPhotoUploaded(true)
      } else {
        const err = await res.json()
        alert(err.error || "Gagal mengunggah foto")
      }
    } catch {
      alert("Gagal mengunggah foto")
    } finally {
      setPhotoUploading(false)
    }
  }

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
    <div className="min-h-screen bg-surface text-on-surface font-body-md antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/85 backdrop-blur-md border-b border-outline-variant/40 transition-all">
        <div className="max-w-md mx-auto h-16 px-6 flex justify-between items-center">
          <button className="w-10 h-10 flex items-center justify-start text-primary active:scale-95 transition-transform" aria-label="Menu">
            <span className="material-symbols-outlined text-2xl" data-icon="menu">menu</span>
          </button>
          <div className="font-headline-md text-xl tracking-wide font-semibold text-primary">Aksaraa</div>
          <ProfileMenu />
        </div>
      </header>

      <main className="w-full max-w-md mx-auto min-h-screen pt-24 pb-28 px-6 flex flex-col items-center">
        <div className="fade-in-up flex flex-col items-center mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center border border-outline-variant/30 relative shadow-inner">
            <div className="absolute inset-0 opacity-15 animate-[spin_20s_linear_infinite]">
              <svg fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="0.75" strokeDasharray="4 4" />
              </svg>
            </div>
            <span className="material-symbols-outlined text-secondary text-4xl" style={{ fontVariationSettings: "'wght' 300" }}>check</span>
          </div>
          <p className="font-label-md text-[11px] text-secondary mt-3 uppercase tracking-[0.25em]">Check-in Berhasil</p>
        </div>

        <section className="fade-in-up stagger-1 text-center mb-8 w-full">
          <h1 className="text-on-surface-variant font-body-md font-medium tracking-wide mb-1">Selamat Datang,</h1>
          <p className="font-headline-lg text-3xl font-semibold text-primary px-2">{guestName || "..."}</p>
        </section>

        <div className="fade-in-up stagger-2 w-full flex flex-col shadow-md rounded-xl overflow-hidden border border-outline-variant/40 bg-surface-container-lowest">
          <div className="bg-primary text-on-primary p-6 flex flex-col items-center text-center relative">
            <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-surface border-r border-outline-variant/40" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-surface border-l border-outline-variant/40" />
            <p className="font-label-md text-[10px] uppercase opacity-60 tracking-[0.2em] mb-1">Penempatan Meja</p>
            <h2 className="font-headline-xl text-4xl font-bold tracking-tight my-1">{tableNumber || "—"}</h2>
            {category && (
              <span className="inline-block px-3 py-1 bg-on-primary/10 rounded-full text-xs font-medium tracking-wide italic opacity-95 mt-1 border border-on-primary/10">
                {category}
              </span>
            )}
          </div>
          <div className="w-full text-outline-variant/40 ticket-dash h-px bg-transparent" />
          <section className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-block font-label-md text-[9px] bg-secondary/10 text-secondary px-2 py-0.5 rounded uppercase tracking-wider">E-Pass Access</span>
                <h3 className="font-headline-md text-xl font-medium text-primary mt-2">{coupleName || "..."}</h3>
                <p className="text-xs text-on-surface-variant/80 mt-0.5">{eventDate}</p>
              </div>
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface border border-outline-variant/30 text-on-surface-variant/70">
                <span className="material-symbols-outlined text-xl" data-icon="qr_code_2">qr_code_2</span>
              </div>
            </div>
            <div className="flex items-center gap-5 p-4 bg-surface rounded-lg border border-outline-variant/30">
              <div className="w-20 h-20 bg-white p-1.5 rounded border border-outline-variant/20 flex-shrink-0 shadow-sm">
                {qrDataUrl ? (
                  <img className="w-full h-full object-contain mix-blend-multiply" alt="QR Code Tamu" src={qrDataUrl} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider mb-0.5">Status Gerbang</p>
                <div className="flex items-center gap-1 text-emerald-700 font-semibold text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Verified Access
                </div>
                <p className="text-[10px] font-mono tracking-wider text-on-surface-variant/70 mt-1.5 bg-surface-container-high px-1.5 py-0.5 rounded inline-block">
                  ID: AKSR-{guestQrToken.slice(-6)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {gates.wish_wall && (
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
              <textarea
                value={wishMessage}
                onChange={(e) => setWishMessage(e.target.value)}
                placeholder="Tuliskan pesan hangat dan doa Anda di sini..."
                className="w-full min-h-[110px] p-4 bg-surface-container-lowest border border-outline-variant/50 rounded-lg font-body-md text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-secondary focus:border-secondary transition-all resize-none text-sm shadow-inner"
              />
              <button
                onClick={handleSendWish}
                disabled={wishLoading || !wishMessage.trim()}
                className="w-full bg-secondary text-on-primary py-4 px-6 rounded-lg font-label-md text-xs uppercase tracking-[0.2em] transition-all hover:bg-secondary/90 active:scale-[0.99] shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                {wishLoading ? "Mengirim..." : "Kirim Doa Restu"}
              </button>
            </div>
          )}
        </section>
        )}

        {gates.galeri_foto_tamu && (
        <section className="fade-in-up stagger-4 w-full mt-8 bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="font-headline-md text-xl font-medium text-primary">Galeri Kenangan Tamu</h3>
            <p className="text-xs text-on-surface-variant mt-1">Bagikan momen berharga hari ini dari sudut pandang Anda.</p>
          </div>

          {photoUploaded ? (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-600/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-emerald-700 text-3xl" style={{ fontVariationSettings: "'wght' 400" }}>check_circle</span>
              </div>
              <h4 className="font-headline-md text-xl text-primary mb-2">Momen Anda Berhasil Terkirim</h4>
              <p className="text-sm text-on-surface-variant mb-8">Terima kasih telah berbagi kebahagiaan hari ini.</p>
              {photoUrl && (
                <div className="flex justify-center mb-8 w-full">
                  <div className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden shadow-lg border border-white/20 rotate-2">
                    <img src={photoUrl} alt="Uploaded moment" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-outline-variant/30 rounded-xl bg-surface-container-lowest/50">
              <label className="flex flex-col items-center gap-3 px-8 py-6 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 group cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} disabled={photoUploading} />
                <span className="material-symbols-outlined text-4xl text-secondary transition-transform group-hover:scale-110">{photoUploading ? "hourglass_top" : "add_a_photo"}</span>
                <span className="font-label-md text-xs uppercase tracking-widest">{photoUploading ? "Mengunggah..." : "Unggah Foto Momen"}</span>
              </label>
            </div>
          )}
        </section>
        )}
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
