"use client"

import { use, useEffect, useState } from "react"
import QRCode from "qrcode"

export default function QrDisplay({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [guestName, setGuestName] = useState("")
  const [coupleName, setCoupleName] = useState("")
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) return

    fetch(`/api/check-in?qr_token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (!r.ok) throw new Error("QR tidak valid")
        return r.json()
      })
      .then((data) => {
        setGuestName(data.guest.name)
        setCoupleName(`${data.profile.bride_name} & ${data.profile.groom_name}`)
        return QRCode.toDataURL(token, {
          width: 400,
          margin: 2,
          color: { dark: "#1a1a1a", light: "#ffffff" },
        })
      })
      .then((url) => setQrDataUrl(url))
      .catch((e) => setError(e.message))
  }, [token])

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">qr_code_scanner</span>
          <h1 className="font-headline-md text-headline-md text-primary mb-2">QR Tidak Valid</h1>
          <p className="font-body-md text-on-surface-variant">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="mb-8">
          <p className="font-label-md text-label-md uppercase text-on-surface-variant tracking-widest mb-1">Check-In Tamu</p>
          <h1 className="font-headline-md text-headline-md text-primary">{coupleName || "Loading..."}</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrDataUrl} alt="QR Code" className="w-full max-w-[300px] mx-auto" />
          ) : (
            <div className="w-[300px] h-[300px] mx-auto flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {guestName && (
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Selamat datang, <span className="text-primary font-semibold">{guestName}</span>
          </p>
        )}

        <p className="font-body-md text-on-surface-variant mt-2">
          Tunjukkan QR ini di venue untuk check-in
        </p>
      </div>
    </div>
  )
}
