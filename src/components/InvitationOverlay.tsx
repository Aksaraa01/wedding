"use client"

import { useState, type FormEvent } from "react"

interface InvitationOverlayProps {
  guestId: string
  guestName: string
  weddingProfileId: string
  guestQrUrl?: string
  guestTableNumber?: string
  guestRsvpStatus?: string
  guestRsvpMessage?: string
  rsvpMaxPax?: number
  qrEnabled: boolean
}

export default function InvitationOverlay({
  guestId,
  guestName,
  weddingProfileId,
  guestQrUrl,
  guestTableNumber,
  guestRsvpStatus,
  guestRsvpMessage,
  rsvpMaxPax,
  qrEnabled,
}: InvitationOverlayProps) {
  const [qrOpen, setQrOpen] = useState(false)
  const [rsvpOpen, setRsvpOpen] = useState(false)

  const alreadyResponded = guestRsvpStatus === "HADIR" || guestRsvpStatus === "TIDAK_HADIR"

  const [rsvpName, setRsvpName] = useState(guestName)
  const [rsvpAttend, setRsvpAttend] = useState<string>(
    guestRsvpStatus === "HADIR" || guestRsvpStatus === "TIDAK_HADIR" ? guestRsvpStatus : "HADIR"
  )
  const [rsvpPax, setRsvpPax] = useState("1")
  const [rsvpMessage, setRsvpMessage] = useState(guestRsvpMessage || "")
  const [rsvpStatus, setRsvpStatus] = useState<"idle" | "saving" | "done" | "error">(
    alreadyResponded ? "done" : "idle"
  )
  const [rsvpError, setRsvpError] = useState("")

  const maxPax = Math.max(1, Math.min(10, rsvpMaxPax ?? 2))

  const handleRsvpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!rsvpName.trim()) return
    setRsvpStatus("saving")
    setRsvpError("")
    try {
      const res = await fetch(`/api/guests/${guestId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rsvp_status: rsvpAttend,
          rsvp_pax_count: rsvpAttend === "HADIR" ? Number(rsvpPax) : undefined,
          rsvp_message: rsvpMessage.trim() || undefined,
        }),
      })
      if (!res.ok) {
        setRsvpError("Gagal menyimpan kehadiran. Silakan coba lagi.")
        setRsvpStatus("error")
        return
      }
      // Also save the comment to the wish wall (source: invitation), same as the
      // React templates. 409 = already sent earlier, treat as success.
      if (rsvpMessage.trim()) {
        const wish = await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wedding_profile_id: weddingProfileId,
            guest_id: guestId,
            name: rsvpName.trim(),
            message: rsvpMessage.trim(),
            source: "invitation",
          }),
        })
        if (wish.status !== 409 && !wish.ok) {
          setRsvpError("Kehadiran tersimpan, namun ucapan gagal dikirim.")
          setRsvpStatus("error")
          return
        }
      }
      setRsvpStatus("done")
    } catch {
      setRsvpError("Gagal menyimpan kehadiran. Periksa koneksi Anda.")
      setRsvpStatus("error")
    }
  }

  return (
    <>
      {/* Floating dock — right-center column (WP music toggle sits above) */}
      <div
        className="fixed right-4 z-[90] flex flex-col items-end gap-3"
        style={{ top: "50%", transform: "translateY(-50%)" }}
      >
        {qrEnabled && guestQrUrl && (
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            aria-label="Kartu QR Masuk"
            title="Kartu QR Masuk"
            className="flex items-center gap-2 h-12 pl-4 pr-3 rounded-full bg-[#B88A2D] text-white shadow-xl hover:bg-[#C9A227] transition-colors"
          >
            <span className="font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap">QR Masuk</span>
            <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setRsvpOpen(true)}
          aria-label="Konfirmasi Kehadiran"
          title="Konfirmasi Kehadiran"
          className="flex items-center gap-2 h-12 pl-4 pr-3 rounded-full bg-[#B88A2D] text-white shadow-xl hover:bg-[#C9A227] transition-colors"
        >
          <span className="font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap">RSVP</span>
          <span className="material-symbols-outlined text-[20px]">event_available</span>
        </button>
      </div>

      {/* QR modal — digital pass */}
      {qrOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fdf9f0] w-full max-w-md h-[85dvh] max-h-[820px] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/40 shrink-0">
              <span className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary">
                Kartu QR Masuk
              </span>
              <button type="button" onClick={() => setQrOpen(false)} className="text-on-surface-variant hover:text-primary p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
            <div className="text-center px-5 pt-4 pb-2">
              <p className="font-headline-md text-lg text-on-surface">{guestName}</p>
              {guestTableNumber && guestTableNumber !== "TBA" && (
                <p className="font-body-md text-[13px] text-on-surface-variant">
                  Nomor Meja: <span className="font-semibold">{guestTableNumber}</span>
                </p>
              )}
            </div>
            <iframe src={guestQrUrl} title="Kartu QR Masuk" className="w-full border-0 flex-1" />
            <div className="px-5 py-3 flex justify-center shrink-0">
              <a
                href={guestQrUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 font-label-md text-[10px] uppercase tracking-widest text-secondary hover:text-primary"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Buka di tab baru
              </a>
            </div>
          </div>
        </div>
      )}

      {/* RSVP modal */}
      {rsvpOpen && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fdf9f0] w-full max-w-md flex flex-col max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/40 sticky top-0 bg-[#fdf9f0] shrink-0">
              <span className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary">
                Konfirmasi Kehadiran
              </span>
              <button type="button" onClick={() => setRsvpOpen(false)} className="text-on-surface-variant hover:text-primary p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>

            {rsvpStatus === "done" ? (
              <div className="text-center p-8">
                <span className="material-symbols-outlined text-4xl mb-3 inline-block text-emerald-600">task_alt</span>
                <p className="font-headline-md text-xl text-on-surface mb-2">Terima kasih, {rsvpName}!</p>
                <p className="font-body-md text-sm text-on-surface-variant">
                  Kehadiran Anda telah kami catat sebagai {rsvpAttend === "TIDAK_HADIR" ? "Tidak Hadir" : "Hadir"}.
                </p>
                {rsvpMessage.trim() && (
                  <p className="font-body-md text-sm text-on-surface-variant mt-2 italic">“{rsvpMessage.trim()}”</p>
                )}
                <p className="font-label-md text-[10px] uppercase tracking-widest text-secondary mt-4">
                  Konfirmasi kehadiran Anda sudah diterima
                </p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-5 p-5 text-left">
                <div>
                  <label className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary block mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b-2 border-outline-variant px-0 py-2 font-body-md text-base outline-none focus:border-secondary"
                    placeholder="Nama Anda"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary block mb-2">
                      Kehadiran
                    </label>
                    <select
                      value={rsvpAttend}
                      onChange={(e) => setRsvpAttend(e.target.value)}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant px-0 py-2 font-body-md outline-none focus:border-secondary"
                    >
                      <option value="HADIR">Hadir</option>
                      <option value="TIDAK_HADIR">Tidak Hadir</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary block mb-2">
                      Jumlah Tamu
                    </label>
                    <select
                      value={rsvpPax}
                      onChange={(e) => setRsvpPax(e.target.value)}
                      disabled={rsvpAttend === "TIDAK_HADIR"}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant px-0 py-2 font-body-md outline-none focus:border-secondary disabled:opacity-50"
                    >
                      {Array.from({ length: maxPax }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={String(n)}>
                          {n} orang
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary block mb-2">
                    Doa &amp; Ucapan
                  </label>
                  <textarea
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent border-0 border-b-2 border-outline-variant px-0 py-2 font-body-md outline-none focus:border-secondary resize-none"
                    placeholder="Tuliskan doa dan ucapan Anda"
                  />
                </div>
                {rsvpError && <p className="font-body-md text-sm text-red-500">{rsvpError}</p>}
                <button
                  type="submit"
                  disabled={rsvpStatus === "saving" || !rsvpName.trim()}
                  className="w-full py-4 bg-secondary text-white font-label-md text-[11px] uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {rsvpStatus === "saving" ? "Menyimpan..." : "Kirim Konfirmasi"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
