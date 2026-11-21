"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"
import { resolveCoupleName } from "@/lib/coupleName"
import { resolveEventPhoto } from "@/lib/event-photo"
import { toTransformedUrl } from "@/lib/storageUrl"
import { coupleUrl } from "@/lib/coupleUrl"

import { filterSessionsByScope } from "@/lib/invitedSessions"

type PrintGuest = {
  id: string
  name: string
  qr_token: string | null
  table_number: string | null
  rsvp_status: string | null
  rsvp_pax_count: number | null
  is_vip: boolean
  invited_session_indexes?: number[] | null
}

type PrintProfile = {
  slug: string
  bride_name: string
  groom_name: string
  bride_full_name: string | null
  groom_full_name: string | null
  display_name: string | null
  estimated_wedding_date: string | null
  cover_photos: unknown
  couple_illustration_url: string | null
  gallery_photo_url: string | null
  sessions: Array<{ name?: string | null; date?: string | null; time?: string | null; venue?: string | null; address?: string | null }> | null
  payment_status: "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"
  is_published: boolean
}

//PrintPhoto serves the pre-generated WebP derivative and falls back to the raw
// URL if the thumb is missing — never a blank slot on printed cards.
function PrintPhoto({ src, alt }: { src: string; alt: string }) {
  const [url, setUrl] = useState(() => toTransformedUrl(src, { width: 800, quality: 75 }))
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-qr-print
      src={url}
      alt={alt}
      className="qrp-photo"
      draggable={false}
      onError={() => { if (url !== src) setUrl(src) }}
    />
  )
}

const PER_PAGE = 4

export default function QrPrintClient({ id, autoprint }: { id: string; autoprint: boolean }) {
  const [profile, setProfile] = useState<PrintProfile | null>(null)
  const [guests, setGuests] = useState<PrintGuest[]>([])
  const [qrById, setQrById] = useState<Record<string, string>>({})
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const printedRef = useRef(false)

  const printable = useMemo(() => guests.filter((g) => !!g.qr_token), [guests])
  const missingCount = guests.length - printable.length
  const pages = useMemo(() => {
    const chunks: PrintGuest[][] = []
    for (let i = 0; i < printable.length; i += PER_PAGE) {
      chunks.push(printable.slice(i, i + PER_PAGE))
    }
    return chunks
  }, [printable])

  const passPhoto = useMemo(
    () => (profile ? resolveEventPhoto(profile) || "/defaults/couple.png" : ""),
    [profile]
  )
  const coupleName = useMemo(() => (profile ? resolveCoupleName(profile) : ""), [profile])
  const hashtag = useMemo(() => (profile?.display_name || "").trim(), [profile])
  const fmtDate = (d: string) =>
    d ? new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" }) : ""

  function sessionsForGuest(guest: PrintGuest) {
    if (!profile) return [] as { name: string; date: string; time: string; venue: string; address: string }[]
    const all = Array.isArray(profile.sessions) ? profile.sessions : []
    const scoped = filterSessionsByScope(all, guest.invited_session_indexes ?? null)
    const list = (scoped.length > 0 ? scoped : all)
      .filter((s) => s && (s.date || s.time || s.venue || s.address || s.name))
      .map((s) => {
        const time = (s.time || "").trim()
        return {
          name: (s.name || "").trim(),
          date: fmtDate(s.date || profile.estimated_wedding_date || ""),
          time: time && !/\bwib\b/i.test(time) ? `${time} WIB` : time,
          venue: (s.venue || "").trim(),
          address: (s.address || "").trim(),
        }
      })
    if (list.length === 0 && profile.estimated_wedding_date) {
      return [{ name: "", date: fmtDate(profile.estimated_wedding_date), time: "", venue: "", address: "" }]
    }
    return list
  }

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      try {
        const [profileRes, guestsRes] = await Promise.all([
          fetch(`/api/dashboard/${id}`),
          fetch(`/api/dashboard/${id}/qr-guestbook`),
        ])
        if (!profileRes.ok || !guestsRes.ok) {
          throw new Error(profileRes.status === 401 || guestsRes.status === 401
            ? "Sesi tidak valid. Buka halaman ini dari dasbor."
            : "Gagal memuat data tamu.")
        }

        const profileData = await profileRes.json()
        const guestsData = await guestsRes.json()
        const data = profileData.profile as PrintProfile
        const featureSet: string[] = Array.isArray(profileData.feature_set) ? profileData.feature_set : []

        if (!featureSet.includes("qr_code_book")) {
          throw new Error("Fitur QR Buku Tamu tidak termasuk dalam paket ini.")
        }
        if (data.payment_status === "UNPAID") {
          throw new Error("Selesaikan pembayaran untuk mencetak QR tamu.")
        }
        if (data.is_published !== true) {
          throw new Error("Lengkapi dan aktifkan undangan sebelum mencetak QR tamu.")
        }

        if (cancelled) return
        setProfile(data)
        setGuests(Array.isArray(guestsData.guests) ? guestsData.guests : [])
        setLoaded(true)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal memuat data.")
      }
    })()

    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!profile || !loaded) return
    if (printable.length === 0) {
      setReady(true)
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const next: Record<string, string> = {}
        for (let i = 0; i < printable.length; i++) {
          if (cancelled) return
          const guest = printable[i]
          const token = guest.qr_token as string
          const content = profile.slug
            ? coupleUrl(profile.slug, `/welcome/${encodeURIComponent(token)}`)
            : `${window.location.origin}/welcome/${encodeURIComponent(token)}`
          next[guest.id] = await QRCode.toDataURL(content, {
            errorCorrectionLevel: "Q",
            margin: 2,
            scale: 16,
            color: { dark: "#1A1817", light: "#FFFFFF" },
          })
          if (i % 2 === 0) {
            setQrById({ ...next })
            setProgress(i + 1)
            await new Promise((resolve) => setTimeout(resolve, 0))
          }
        }
        if (cancelled) return
        setQrById(next)
        setProgress(printable.length)
        setReady(true)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Gagal membuat QR.")
      }
    })()

    return () => { cancelled = true }
  }, [profile, loaded, printable])

  useEffect(() => {
    if (!profile) return
    const couple = [profile.groom_name, profile.bride_name].filter(Boolean).join(" & ")
    const date = profile.estimated_wedding_date
      ? ` - ${new Date(profile.estimated_wedding_date).toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}`
      : ""
    document.title = `QR Tamu${couple ? ` - ${couple}` : ""}${date}`
  }, [profile])

  useEffect(() => {
    if (!autoprint || !ready || printedRef.current || printable.length === 0) return
    printedRef.current = true
    const timer = window.setTimeout(async () => {
      try {
        await document.fonts?.ready
      } catch {}
      await Promise.all(
        Array.from(document.querySelectorAll<HTMLImageElement>("img[data-qr-print]")).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              })
        )
      )
      window.print()
    }, 350)
    return () => window.clearTimeout(timer)
  }, [autoprint, ready, printable.length])

  return (
    <div className="qrp-root">
      <div className="qrp-toolbar no-print">
        <a href={`/dashboard/${id}/qr-guestbook`} className="qrp-back">Kembali</a>
        <div className="qrp-toolbar-info">
          <strong>Cetak QR Tamu</strong>
          <span>
            {ready
              ? `${printable.length} kartu · ${pages.length} halaman A4`
              : `Menyiapkan QR ${progress}/${printable.length}`}
            {missingCount > 0 ? ` · ${missingCount} tamu tanpa QR dilewati` : ""}
          </span>
        </div>
        <button type="button" onClick={() => window.print()} disabled={!ready} className="qrp-print-btn">
          Cetak / Simpan PDF
        </button>
      </div>

      <p className="qrp-hint no-print">
        Di dialog cetak pilih A4, skala 100%, dan matikan headers/footers serta aktifkan background graphics. Setiap halaman berisi 4 kartu (potong di garis putus-putus).
      </p>

      {error ? (
        <div className="qrp-state no-print">
          <strong>Tidak dapat mencetak QR</strong>
          <p>{error}</p>
          <a href={`/dashboard/${id}/qr-guestbook`}>Kembali ke Buku Tamu</a>
        </div>
      ) : !ready ? (
        <div className="qrp-state no-print">
          <span className="qrp-spinner" />
          <strong>Menyiapkan QR</strong>
          <p>{progress} dari {printable.length} QR selesai.</p>
        </div>
      ) : printable.length === 0 ? (
        <div className="qrp-state no-print">
          <strong>Belum ada QR tamu</strong>
          <p>Generate QR terlebih dahulu dari halaman Buku Tamu.</p>
          <a href={`/dashboard/${id}/qr-guestbook`}>Kembali ke Buku Tamu</a>
        </div>
      ) : (
        <div className="qrp-pages">
          {pages.map((page, pageIndex) => (
            <section className="qrp-page" key={pageIndex}>
              <div className="qrp-grid">
                {page.map((guest) => {
                  const pax = guest.rsvp_status === "HADIR" && guest.rsvp_pax_count
                    ? guest.rsvp_pax_count
                    : 2
                  return (
                    <div className="qrp-cell" key={guest.id}>
                      <div className={`qrp-card ${guest.is_vip ? "qrp-vip" : ""}`}>
                        <div className="qrp-photo-wrap">
                          <PrintPhoto src={passPhoto} alt={`Foto resepsi ${coupleName}`} />
                          <div className="qrp-photo-shade" />
                          {guest.is_vip && <span className="qrp-vip-pill">VIP</span>}
                          <div className="qrp-names">
                            <span className="qrp-eyebrow">The Wedding Of</span>
                            <strong className="qrp-couple">{coupleName || ", "}</strong>
                            {hashtag && <span className="qrp-tag">{hashtag}</span>}
                          </div>
                        </div>
                        <div className="qrp-card-body">
                          <div className="qrp-cols">
                            <div className="qrp-left">
                              {qrById[guest.id] ? (
                                <img
                                  data-qr-print
                                  src={qrById[guest.id]}
                                  alt={`QR ${guest.name}`}
                                  className="qrp-card-qr"
                                />
                              ) : (
                                <div className="qrp-card-qr qrp-qr-placeholder" />
                              )}
                              <span className="qrp-code">{(guest.qr_token || "").slice(0, 11)}</span>
                              <span className="qrp-caption">Bawa kartu ini dan perlihatkan kepada penerima tamu saat melakukan check-in di lokasi acara</span>
                            </div>
                            <div className="qrp-right">
                              <span className="qrp-invited">You are invited to our wedding day!</span>
                              <em className="qrp-dear">Dear</em>
                              <strong className="qrp-guest">{guest.name}</strong>
                              <span className="qrp-stats">Meja {guest.table_number || ", "} · {pax} Pax</span>
                              {sessionsForGuest(guest).map((ev, i) => (
                                <span key={i} className={`qrp-sess ${i > 0 ? "qrp-sess-follow" : ""}`}>
                                  {ev.name && <span className="qrp-label">{ev.name}</span>}
                                  <span className="qrp-detail">{ev.date || ", "}{ev.time ? ` · ${ev.time}` : ""}</span>
                                  <span className="qrp-detail">
                                    {ev.venue || ", "}
                                    {ev.address ? <><br />{ev.address}</> : null}
                                  </span>
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="qrp-card-foot">Aksaraa Digital Guestbook Platform</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 10mm;
        }
        @media screen {
          body {
            background: #ececec !important;
          }
          .qrp-root {
            min-height: 100vh;
            padding: 16px;
          }
          .qrp-toolbar {
            max-width: 190mm;
            margin: 0 auto 8px;
            display: flex;
            align-items: center;
            gap: 12px;
            background: #fff;
            border: 1px solid #e2d9cf;
            border-radius: 12px;
            padding: 10px 12px;
            font-family: Arial, Helvetica, sans-serif;
          }
          .qrp-toolbar-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
            flex: 1;
            min-width: 0;
            font-size: 12px;
            color: #6b7280;
          }
          .qrp-toolbar-info strong {
            color: #2c2a29;
            font-size: 13px;
          }
          .qrp-back {
            color: #b34e3f;
            font-size: 12px;
            font-weight: 700;
            text-decoration: none;
            white-space: nowrap;
          }
          .qrp-print-btn {
            border: 0;
            border-radius: 999px;
            background: #b34e3f;
            color: #fff;
            padding: 10px 16px;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            cursor: pointer;
            white-space: nowrap;
          }
          .qrp-print-btn:disabled {
            opacity: 0.45;
            cursor: wait;
          }
          .qrp-hint {
            max-width: 190mm;
            margin: 0 auto 12px;
            color: #6b7280;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 11px;
            text-align: center;
          }
          .qrp-state {
            max-width: 420px;
            margin: 48px auto;
            background: #fff;
            border: 1px solid #e2d9cf;
            border-radius: 16px;
            padding: 28px;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
            color: #2c2a29;
          }
          .qrp-state p {
            margin: 8px 0 16px;
            color: #6b7280;
            font-size: 13px;
          }
          .qrp-state a {
            color: #b34e3f;
            font-size: 12px;
            font-weight: 700;
          }
          .qrp-spinner {
            display: inline-block;
            width: 24px;
            height: 24px;
            margin-bottom: 12px;
            border: 2px solid #b34e3f;
            border-top-color: transparent;
            border-radius: 999px;
            animation: qrp-spin 0.8s linear infinite;
          }
          @keyframes qrp-spin {
            to { transform: rotate(360deg); }
          }
          .qrp-pages {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          .qrp-page {
            width: 210mm;
            height: 297mm;
            padding: 10mm;
            box-sizing: border-box;
            background: #fff;
            box-shadow: 0 2px 14px rgba(0, 0, 0, 0.16);
            overflow: hidden;
          }
        }
        .qrp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 6mm;
          width: 190mm;
          height: 277mm;
        }
        .qrp-cell {
          min-width: 0;
          display: flex;
          break-inside: avoid;
          page-break-inside: avoid;
          border: 0.25mm dashed #b9b1a6;
        }
        .qrp-card {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          background: #fff;
          color: #1a1817;
          font-family: Arial, Helvetica, sans-serif;
          overflow: hidden;
          position: relative;
        }
        .qrp-card.qrp-vip {
          background: linear-gradient(#1b1712, #15120f);
          color: #faf5ed;
          border: 0.6mm solid #c59a4e;
        }
        .qrp-photo-wrap {
          position: relative;
          height: 44%;
          min-height: 36mm;
        }
        .qrp-photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .qrp-photo-shade {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(26, 23, 20, 0.08) 0%, rgba(26, 23, 20, 0.06) 40%, rgba(26, 23, 20, 0.58) 72%, rgba(26, 23, 20, 0.9) 100%);
        }
        .qrp-vip-pill {
          position: absolute;
          top: 3mm;
          left: 3mm;
          padding: 0.8mm 3.5mm;
          border-radius: 999px;
          background: linear-gradient(135deg, #f9f1cb 0%, #ead894 55%, #f4eabb 100%);
          color: #3a2c12;
          font-weight: 800;
          font-size: 8.5pt;
          letter-spacing: 0.12em;
        }
        .qrp-names {
          position: absolute;
          left: 4mm;
          right: 4mm;
          bottom: 2.5mm;
          z-index: 2;
          color: #fff;
          line-height: 1.15;
        }
        .qrp-eyebrow {
          display: block;
          font-size: 7pt;
          opacity: 0.85;
        }
        .qrp-couple {
          display: block;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14.5pt;
          font-weight: 700;
          line-height: 1.05;
          overflow-wrap: anywhere;
        }
        .qrp-tag {
          display: block;
          font-size: 6.5pt;
          opacity: 0.75;
          margin-top: 0.4mm;
          overflow-wrap: anywhere;
        }
        .qrp-card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 3mm;
          min-height: 0;
        }
        .qrp-cols {
          flex: 1;
          display: grid;
          grid-template-columns: 38% 1fr;
          gap: 3.5mm;
          align-items: start;
          min-height: 0;
        }
        .qrp-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 0;
        }
        .qrp-card-qr {
          display: block;
          width: 31mm;
          height: 31mm;
          border-radius: 2mm;
        }
        .qrp-qr-placeholder {
          border: 0.2mm dashed #d1d5db;
        }
        .qrp-code {
          margin-top: 1.6mm;
          font-size: 6pt;
          letter-spacing: 0.08em;
          font-family: 'Courier New', monospace;
          opacity: 0.75;
        }
        .qrp-caption {
          margin-top: 1.4mm;
          max-width: 34mm;
          font-size: 5.4pt;
          line-height: 1.3;
          text-align: center;
          opacity: 0.65;
        }
        .qrp-right {
          display: flex;
          flex-direction: column;
          min-width: 0;
          font-size: 6.6pt;
        }
        .qrp-invited {
          font-weight: 700;
          color: #8d4d39;
        }
        .qrp-card.qrp-vip .qrp-invited {
          color: #e6c364;
        }
        .qrp-dear {
          font-style: normal;
          opacity: 0.7;
          margin-top: 1.2mm;
        }
        .qrp-guest {
          font-size: 9.5pt;
          font-weight: 700;
          line-height: 1.1;
          margin-top: 0.3mm;
          overflow-wrap: anywhere;
        }
        .qrp-stats {
          margin-top: 1.2mm;
          padding: 0.6mm 2mm;
          align-self: flex-start;
          border-radius: 999px;
          background: #fbf8f3;
          border: 0.15mm solid rgba(26, 24, 23, 0.18);
          font-weight: 700;
        }
        .qrp-card.qrp-vip .qrp-stats {
          background: #25201a;
          border-color: #7d5d2b;
          color: #f3e2b3;
        }
        .qrp-sess {
          display: block;
          margin-top: 2.2mm;
        }
        .qrp-label {
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 700;
          font-size: 6pt;
          color: #8d4d39;
          margin-bottom: 0.4mm;
        }
        .qrp-card.qrp-vip .qrp-label {
          color: #e6c364;
        }
        .qrp-sess-follow {
          padding-top: 1.6mm;
          border-top: 0.15mm dashed rgba(26, 24, 23, 0.18);
        }
        .qrp-card.qrp-vip .qrp-sess-follow {
          border-top-color: rgba(212, 175, 55, 0.35);
        }
        .qrp-detail {
          display: block;
          margin-top: 0.8mm;
          font-weight: 600;
          line-height: 1.25;
          overflow-wrap: anywhere;
        }
        .qrp-card-foot {
          margin-top: 1.6mm;
          padding-top: 1.2mm;
          border-top: 0.15mm dashed rgba(26, 24, 23, 0.18);
          text-align: center;
          font-size: 5.2pt;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          opacity: 0.6;
        }
        .qrp-card.qrp-vip .qrp-card-foot {
          border-top-color: rgba(212, 175, 55, 0.35);
        }
        @media print {
          body {
            margin: 0 !important;
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          .qrp-root {
            padding: 0 !important;
          }
          .qrp-pages {
            display: block !important;
          }
          .qrp-page {
            width: 190mm !important;
            height: 277mm !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: hidden !important;
            break-after: page;
            page-break-after: always;
          }
          .qrp-page:last-child {
            break-after: auto;
            page-break-after: auto;
          }
          .qrp-grid {
            width: 190mm !important;
            height: 277mm !important;
            gap: 6mm !important;
          }
          .qrp-cell,
          .qrp-card,
          .qrp-photo-shade,
          .qrp-vip-pill,
          .qrp-card.qrp-vip,
          .qrp-stats {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
