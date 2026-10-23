"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import QRCode from "qrcode"

type PrintGuest = {
  id: string
  name: string
  qr_token: string | null
}

type PrintProfile = {
  slug: string
  bride_name: string
  groom_name: string
  estimated_wedding_date: string | null
  payment_status: "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"
  is_published: boolean
}

const PER_PAGE = 12

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
            ? `https://${profile.slug}.wedding.aksaraa.com/welcome/${encodeURIComponent(token)}`
            : `https://wedding.aksaraa.com/welcome/${encodeURIComponent(token)}`
          next[guest.id] = await QRCode.toDataURL(content, {
            errorCorrectionLevel: "Q",
            margin: 4,
            scale: 16,
            color: { dark: "#000000", light: "#FFFFFF" },
          })
          if (i % 6 === 0) {
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
    const couple = [profile.bride_name, profile.groom_name].filter(Boolean).join(" & ")
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
              ? `${printable.length} QR · ${pages.length} halaman A4`
              : `Menyiapkan QR ${progress}/${printable.length}`}
            {missingCount > 0 ? ` · ${missingCount} tamu tanpa QR dilewati` : ""}
          </span>
        </div>
        <button type="button" onClick={() => window.print()} disabled={!ready} className="qrp-print-btn">
          Cetak / Simpan PDF
        </button>
      </div>

      <p className="qrp-hint no-print">
        Di dialog cetak pilih A4, skala 100%, dan matikan headers/footers. Setiap halaman berisi 12 QR.
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
                {page.map((guest) => (
                  <div className="qrp-cell" key={guest.id}>
                    <div className="qrp-name">{guest.name}</div>
                    {qrById[guest.id] ? (
                      <img
                        data-qr-print
                        src={qrById[guest.id]}
                        alt={`QR ${guest.name}`}
                        className="qrp-qr"
                      />
                    ) : (
                      <div className="qrp-qr qrp-qr-placeholder" />
                    )}
                  </div>
                ))}
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
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(4, 1fr);
          gap: 8mm;
          width: 190mm;
          height: 277mm;
        }
        .qrp-cell {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2mm;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .qrp-name {
          max-width: 55mm;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 9pt;
          line-height: 1.2;
          font-weight: 600;
          color: #000;
          text-align: center;
          overflow-wrap: anywhere;
        }
        .qrp-qr {
          display: block;
          width: 40mm;
          height: 40mm;
        }
        .qrp-qr-placeholder {
          border: 0.2mm dashed #d1d5db;
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
            gap: 8mm !important;
          }
          .qrp-name,
          .qrp-qr {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
