"use client"

import { useEffect, useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { normalizeGuestSlug } from "@/lib/guest-slug"

interface InvitationOverlayProps {
  guestId?: string
  // Fleksibel mode: no guest row yet — RSVP provisions one keyed by this slug.
  guestSlug?: string
  allowFlexibleRsvp?: boolean
  guestName: string
  coupleName: string
  weddingProfileId: string
  guestQrUrl?: string
  guestTableNumber?: string
  guestRsvpStatus?: string
  guestRsvpMessage?: string
  rsvpMaxPax?: number
  qrEnabled: boolean
  // 'center' = right-center column (legacy/WP). 'bottom' = bottom-right corner,
  // below the hotspot area of in-house immersive rooms. `bottom` tunes its
  // distance from the viewport edge when anchored bottom (e.g. above a dock).
  anchor?: "center" | "bottom"
  bottom?: number
}

export default function InvitationOverlay({
  guestId,
  guestSlug,
  allowFlexibleRsvp,
  guestName,
  coupleName,
  weddingProfileId,
  guestQrUrl,
  guestTableNumber,
  guestRsvpStatus,
  guestRsvpMessage,
  rsvpMaxPax,
  qrEnabled,
  anchor = "center",
  bottom = 24,
}: InvitationOverlayProps) {
  const [qrOpen, setQrOpen] = useState(false)
  // Rendered into <body> so template-scoped element rules (p/span/button
  // typography) cannot restyle the dock or the RSVP/QR modals.
  const [mounted, setMounted] = useState(false)
  const [rsvpOpen, setRsvpOpen] = useState(false)
  // In-house templates dispatch aksaraa:floating when their modal opens so the
  // floating QR/RSVP dock hides instead of overlapping the modal.
  const [externalHidden, setExternalHidden] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const handler = (e: Event) => {
      setExternalHidden((e as CustomEvent<boolean>).detail === true)
    }
    window.addEventListener("aksaraa:floating", handler)
    return () => window.removeEventListener("aksaraa:floating", handler)
  }, [])

  // In-house template covers dispatch aksaraa:open-rsvp so the cover RSVP
  // button (reference layout hyperlink) opens this modal — the RSVP form
  // itself lives here, not as a template section.
  useEffect(() => {
    const open = () => { setRsvpOpen(true) }
    window.addEventListener("aksaraa:open-rsvp", open)
    return () => window.removeEventListener("aksaraa:open-rsvp", open)
  }, [])

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
  const [resolvedId, setResolvedId] = useState<string | undefined>(guestId)

  const maxPax = Math.max(1, Math.min(10, rsvpMaxPax ?? 2))

  const handleRsvpSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!rsvpName.trim()) return
    setRsvpStatus("saving")
    setRsvpError("")
    try {
      let activeId = resolvedId
      if (!activeId) {
        const flexSlug = normalizeGuestSlug(guestSlug)
        if (!allowFlexibleRsvp || !flexSlug) {
          setRsvpError("Gagal menyimpan kehadiran. Silakan coba lagi.")
          setRsvpStatus("error")
          return
        }
        const flex = await fetch("/api/guests/flexible-rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wedding_profile_id: weddingProfileId,
            // Slug for the row, raw ?to= so a legacy slug still matches and
            // the created row keeps the guest's own wording ("Budi / Ani").
            slug: flexSlug,
            raw_slug: guestSlug,
            display_name: guestSlug,
            rsvp_status: rsvpAttend,
            rsvp_pax_count: rsvpAttend === "HADIR" ? Number(rsvpPax) : undefined,
            rsvp_message: rsvpMessage.trim() || undefined,
          }),
        })
        const flexData = await flex.json().catch(() => ({}))
        if (!flex.ok || !flexData.guest?.id) {
          setRsvpError(
            flex.status === 400
              ? "Nama tamu tidak dikenali. Silakan minta tautan undangan pribadi Anda ke mempelai."
              : flexData.error || "Gagal menyimpan kehadiran. Silakan coba lagi."
          )
          setRsvpStatus("error")
          return
        }
        activeId = flexData.guest.id
        setResolvedId(activeId)
      } else {
        const res = await fetch(`/api/guests/${activeId}/rsvp`, {
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
      }
      // Also save the comment to the wish wall (source: invitation), same as the
      // React templates. 409 = already sent earlier, treat as success.
      if (rsvpMessage.trim()) {
        const wish = await fetch("/api/wishes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wedding_profile_id: weddingProfileId,
            guest_id: activeId,
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

  const ui = (
    <>
      {/* Floating dock — right-center column by default, or bottom-right for
          in-house rooms so it never overlaps the hotspot area. */}
      {!externalHidden && (
      <div
        className="fixed right-4 z-[90] flex flex-col items-end gap-3"
        style={anchor === "bottom" ? { bottom, right: 16 } : { top: "50%", transform: "translateY(-50%)" }}
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
      )}

      {/* QR modal — digital pass */}
      {qrOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl w-full max-w-md h-[85dvh] max-h-[820px] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/40 shrink-0">
              <span className="font-label-md text-[10px] uppercase tracking-[0.2em] font-semibold text-secondary">
                Kartu QR Masuk
              </span>
              <button type="button" onClick={() => setQrOpen(false)} className="text-on-surface-variant hover:text-primary p-1" aria-label="Tutup">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
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
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6">
          <div className="relative w-full max-w-[480px] bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#E2D9CF]/60 flex flex-col max-h-[92dvh]">
            {/* Top decorative gradient line */}
            <div className="h-1 sm:h-1.5 w-full bg-gradient-to-r from-[#C29B38]/60 via-[#B34E3F] to-[#C29B38]/60 shrink-0" />

            {/* Modal header */}
            <div
              className="relative px-4 sm:px-8 pt-4 pb-3 sm:pt-7 sm:pb-6 text-center border-b border-[#E2D9CF]/40 shrink-0"
              style={{ backgroundColor: "#ded1c1", backgroundImage: "radial-gradient(ellipse at 70% 30%, rgba(255,255,255,0.6) 0%, rgba(240,228,215,0.4) 30%, transparent 65%), linear-gradient(115deg, #dfd2c2 0%, #ecdcc9 22%, #baa794 45%, #f2e4d3 62%, #caa890 82%, #dfd3c4 100%)" }}
            >
              <button
                type="button"
                onClick={() => setRsvpOpen(false)}
                aria-label="Tutup"
                className="absolute top-2.5 right-2.5 sm:top-5 sm:right-5 w-8 h-8 rounded-full flex items-center justify-center text-[#78716C] hover:text-[#23201E] hover:bg-black/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>

              <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-[#FBF1EE] text-[#B34E3F] text-[10px] font-medium tracking-wider uppercase mb-1.5 sm:mb-2.5 max-w-[85%] flex-wrap justify-center text-center leading-tight">
                <span className="material-symbols-outlined text-[14px] shrink-0">favorite</span>
                <span className="break-words line-clamp-2">{coupleName}</span>
              </div>

              <h2
                className="text-[19px] sm:text-[27px] leading-tight font-semibold tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif", color: "#23201E" }}
              >
                Konfirmasi Kehadiran
              </h2>

              <div className="mt-1.5 sm:mt-2.5 flex items-center justify-center gap-2 text-[#C29B38]">
                <div className="h-[0.5px] w-10 sm:w-12 bg-gradient-to-r from-transparent to-[#C29B38]/60" />
                <svg width="22" height="16" viewBox="0 0 28 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-85 sm:w-6 sm:h-[18px]">
                  <path d="M14 2C14 2 13 7 8 8C13 9 14 14 14 14C14 14 15 9 20 8C15 7 14 2 14 2Z" stroke="#C29B38" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 14C6 11 10 11 14 14C18 11 22 11 24 14" stroke="#B34E3F" strokeWidth="0.9" strokeOpacity="0.5" strokeLinecap="round" />
                  <circle cx="14" cy="8" r="1.5" fill="#C29B38" />
                </svg>
                <div className="h-[0.5px] w-10 sm:w-12 bg-gradient-to-l from-transparent to-[#C29B38]/60" />
              </div>

              <p className="text-[11px] sm:text-xs text-[#57534E] mt-1.5 sm:mt-2 max-w-xs mx-auto leading-relaxed">
                Merupakan suatu kehormatan dan kebahagiaan bagi kami atas kehadiran dan doa restu Anda.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto relative">
              {rsvpStatus === "done" ? (
                <div className="text-center px-4 py-5 sm:px-8 sm:py-8">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#FBF1EE] text-[#B34E3F] flex items-center justify-center mb-3 sm:mb-5 mx-auto shadow-sm">
                    <span className="material-symbols-outlined text-[30px] sm:text-[36px]">check_circle</span>
                  </div>
                  <h3 className="text-[20px] sm:text-[26px] font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif", color: "#23201E" }}>
                    Terima kasih, {rsvpName}!
                  </h3>
                  <p className="mt-2 sm:mt-3 text-sm text-[#57534E] flex items-center justify-center gap-2 flex-wrap">
                    <span>Status konfirmasi Anda:</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${
                        rsvpAttend === "TIDAK_HADIR" ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {rsvpAttend === "TIDAK_HADIR" ? "Tidak Hadir" : "Hadir"}
                    </span>
                  </p>
                  {rsvpMessage.trim() && (
                    <div className="mt-3 sm:mt-4 mx-auto max-w-sm rounded-2xl bg-[#FAF7F2] border border-[#E2D9CF] px-4 py-3">
                      <p className="text-sm italic leading-relaxed text-[#57534E]">“{rsvpMessage.trim()}”</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setRsvpOpen(false)}
                    className="mt-4 sm:mt-6 h-11 px-8 rounded-full bg-[#B34E3F] hover:bg-[#9A3F32] text-white text-xs font-semibold tracking-wider uppercase transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRsvpSubmit} className="px-4 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 text-left">
                  <div className="space-y-1">
                    <label className="block text-[11px] sm:text-xs font-semibold text-[#23201E] tracking-wide uppercase">
                      Nama Tamu Undangan
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={rsvpName}
                        readOnly
                        aria-readonly="true"
                        className="w-full h-11 sm:h-12 px-4 pr-11 rounded-xl bg-[#FAF7F2] border border-[#E2D9CF] text-sm outline-none cursor-default"
                        style={{ color: "#23201E" }}
                        placeholder="Nama Anda"
                      />
                      <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-[#78716C]/70 text-[20px] pointer-events-none">
                        badge
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="block text-[11px] sm:text-xs font-semibold text-[#23201E] tracking-wide uppercase">
                      Konfirmasi Kehadiran <span className="text-[#B34E3F]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setRsvpAttend("HADIR")}
                        className={`relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl transition-all duration-200 text-center cursor-pointer ${
                          rsvpAttend === "HADIR"
                            ? "border-2 border-[#B34E3F] bg-[#FAF7F2] text-[#B34E3F] shadow-md"
                            : "border border-[#E2D9CF] bg-white text-[#78716C] hover:bg-[#FAF7F2]/40"
                        }`}
                      >
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 sm:mb-1.5 ${rsvpAttend === "HADIR" ? "bg-[#FBF1EE]" : "bg-gray-100"}`}>
                          <span className="text-sm sm:text-base leading-none">🌸</span>
                        </div>
                        <span className={`font-semibold text-sm ${rsvpAttend === "HADIR" ? "text-[#B34E3F]" : "text-[#23201E]"}`}>Hadir</span>
                        <span className={`text-[10px] sm:text-[11px] mt-0.5 ${rsvpAttend === "HADIR" ? "text-[#B34E3F]/80" : "text-[#78716C]"}`}>Merayakan Bersama</span>
                        {rsvpAttend === "HADIR" && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-[#B34E3F] rounded-full flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          </div>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRsvpAttend("TIDAK_HADIR")}
                        className={`relative flex flex-col items-center justify-center p-3 sm:p-3.5 rounded-2xl transition-all duration-200 text-center cursor-pointer ${
                          rsvpAttend === "TIDAK_HADIR"
                            ? "border-2 border-[#B34E3F] bg-[#FAF7F2] text-[#B34E3F] shadow-md"
                            : "border border-[#E2D9CF] bg-white text-[#78716C] hover:bg-[#FAF7F2]/40"
                        }`}
                      >
                        <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 sm:mb-1.5 ${rsvpAttend === "TIDAK_HADIR" ? "bg-[#FBF1EE]" : "bg-gray-100"}`}>
                          <span className={`material-symbols-outlined text-[17px] sm:text-[18px] ${rsvpAttend === "TIDAK_HADIR" ? "text-[#B34E3F]" : "text-[#78716C]"}`}>event_busy</span>
                        </div>
                        <span className={`font-semibold text-sm ${rsvpAttend === "TIDAK_HADIR" ? "text-[#B34E3F]" : "text-[#23201E]"}`}>Tidak Hadir</span>
                        <span className={`text-[10px] sm:text-[11px] mt-0.5 ${rsvpAttend === "TIDAK_HADIR" ? "text-[#B34E3F]/80" : "text-[#78716C]"}`}>Turut mendoakan</span>
                        {rsvpAttend === "TIDAK_HADIR" && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-[#B34E3F] rounded-full flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                  {rsvpAttend === "HADIR" && (
                    <div className="space-y-1.5 bg-[#FAF7F2]/60 p-3 sm:p-3.5 rounded-2xl border border-[#E2D9CF]/60">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] sm:text-xs font-semibold text-[#23201E] tracking-wide uppercase flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-[#B34E3F]">groups</span>
                          Jumlah Tamu (Pax)
                        </label>
                        <span className="text-[11px] text-[#78716C]">Maks. {maxPax} Orang</span>
                      </div>
                      <div className={`grid gap-2 sm:gap-2.5 ${maxPax <= 2 ? "grid-cols-2" : "grid-cols-3"}`}>
                        {Array.from({ length: maxPax }, (_, i) => i + 1).map((n) => {
                          const selected = rsvpPax === String(n)
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setRsvpPax(String(n))}
                              className={`h-10 sm:h-11 rounded-xl text-sm transition-colors flex items-center justify-center gap-1.5 sm:gap-2 ${
                                selected
                                  ? "border-2 border-[#B34E3F] bg-[#FBF1EE] text-[#B34E3F] font-semibold"
                                  : "border border-[#E2D9CF] bg-white text-[#23201E] font-medium hover:bg-[#FAF7F2]"
                              }`}
                            >
                              <span>{n} Orang</span>
                              {selected && <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[11px] sm:text-xs font-semibold text-[#23201E] tracking-wide uppercase flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#C29B38]">history_edu</span>
                      Doa &amp; Ucapan Hangat
                    </label>
                    <div className="p-3 sm:p-3.5 rounded-2xl border border-[#E2D9CF] relative focus-within:border-[#B34E3F] focus-within:ring-2 focus-within:ring-[#B34E3F]/20 transition-all bg-white">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2 pb-1.5 sm:pb-2 border-b border-[#E2D9CF]/40 text-[11px] text-[#78716C]">
                        <span className="material-symbols-outlined text-[14px] text-[#C29B38]">edit_note</span>
                        <span>Tuliskan doa restu untuk {coupleName}</span>
                      </div>
                      <textarea
                        value={rsvpMessage}
                        onChange={(e) => setRsvpMessage(e.target.value)}
                        rows={3}
                        className="w-full bg-transparent border-0 p-0 text-sm text-[#78716C] placeholder-[#A8A29E] focus:ring-0 resize-none outline-none leading-relaxed"
                        placeholder="Tuliskan doa restu Anda di sini…"
                      />
                    </div>
                  </div>
                  {rsvpError && <p className="text-sm text-red-500">{rsvpError}</p>}
                  <div className="pt-1 sm:pt-2">
                    <button
                      type="submit"
                      disabled={rsvpStatus === "saving" || !rsvpName.trim()}
                      className="w-full h-12 sm:h-14 rounded-full bg-[#B34E3F] hover:bg-[#9A3F32] active:scale-[0.98] text-white font-semibold text-sm sm:text-base tracking-wide shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 disabled:opacity-50"
                    >
                      <span>{rsvpStatus === "saving" ? "Menyimpan..." : rsvpAttend === "TIDAK_HADIR" ? "Kirim Doa Restu" : "Kirim Konfirmasi Kehadiran"}</span>
                      <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                    </button>
                    <p className="text-[11px] text-center text-[#78716C] mt-2 sm:mt-2.5">
                      Data Anda terenkripsi dengan aman dalam sistem Aksaraa Wedding.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )

  return mounted ? createPortal(ui, document.body) : ui
}
