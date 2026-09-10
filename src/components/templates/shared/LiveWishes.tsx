"use client"

import { useEffect, useState } from "react"
import { FONT_BODY, FONT_PIXEL } from "./Skin"
import { timeAgo } from "./lib"

type Wish = {
  id: string
  name: string | null
  message: string
  created_at: string
}

const AVATAR_GRADIENTS = [
  "from-cyan-500/30 to-blue-500/30 border-cyan-400/50 text-cyan-200 shadow-[0_0_8px_rgba(56,239,255,0.3)]",
  "from-purple-500/30 to-pink-500/30 border-pink-400/50 text-pink-200 shadow-[0_0_8px_rgba(244,114,182,0.3)]",
  "from-amber-500/30 to-yellow-500/30 border-amber-400/50 text-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.3)]",
]
const BORDERS = ["border-cyan-500/30", "border-purple-500/30", "border-amber-500/30"]

function initials(name?: string | null): string {
  const parts = (name || "Tamu Undangan").split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || "T"
  const second = parts[1]?.[0] || parts[0]?.[1] || ""
  return `${first}${second}`.toUpperCase()
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  weddingProfileId?: string
  guestId?: string
  guestName?: string
  // Override the sticky button offset (quest footer needs more clearance).
  stickyClassName?: string
}

// Shared live wishes experience for in-house templates: a sticky button that
// opens the LIVE WISHES & DOA modal (approved feed + input). Same design & UX
// for Skyline Penthouse, Pixel Paradise and Pixel Quest.
export default function LiveWishes({ open, onOpenChange, weddingProfileId, guestId, guestName, stickyClassName = "bottom-3 left-3" }: Props) {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loaded, setLoaded] = useState(false)
  const [message, setMessage] = useState("")
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [feedback, setFeedback] = useState("")

  useEffect(() => {
    if (!weddingProfileId) return
    fetch(`/api/wishes?wedding_profile_id=${encodeURIComponent(weddingProfileId)}&status=approved`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setWishes(Array.isArray(data?.wishes) ? data.wishes.slice(0, 30) : [])
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [weddingProfileId])

  const send = async () => {
    const text = message.trim()
    if (!text || status === "sending") return
    if (!weddingProfileId) {
      setStatus("done")
      setFeedback("Mode pratinjau — ucapan tidak tersimpan.")
      setMessage("")
      setTimeout(() => {
        setStatus("idle")
        setFeedback("")
      }, 4000)
      return
    }
    setStatus("sending")
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_profile_id: weddingProfileId,
          guest_id: guestId || null,
          name: guestName || "Tamu Undangan",
          message: text,
          source: "invitation",
        }),
      })
      if (res.status === 409 || res.ok) {
        setStatus("done")
        setFeedback(res.ok ? "Tersimpan, menunggu moderasi ✦" : "Terima kasih! Ucapan Anda telah tersampaikan.")
      } else {
        setStatus("error")
        setFeedback("Terlalu banyak kiriman. Coba lagi nanti.")
      }
      setMessage("")
      setTimeout(() => {
        setStatus("idle")
        setFeedback("")
      }, 4000)
    } catch {
      setStatus("error")
      setFeedback("Gagal terkirim. Periksa koneksi Anda.")
    }
  }

  return (
    <>
      {/* Sticky live-wishes button (bottom-left) */}
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={`absolute ${stickyClassName} z-30 flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-full bg-slate-950/95 border-2 border-cyan-500/50 backdrop-blur-md shadow-[0_0_14px_rgba(56,239,255,0.35)] text-cyan-200 hover:border-cyan-400 active:scale-95 transition-all`}
        style={FONT_PIXEL}
        aria-label="Buka Live Wishes & Doa"
      >
        <span className="relative flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/60 text-[#7bd0ff]">
          <span className="material-symbols-outlined text-[15px]">forum</span>
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse shadow-[0_0_6px_#38efff]" />
        </span>
        <span className="text-[8px] tracking-wider">LIVE WISHES</span>
        <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/50 text-[8px] text-cyan-200">
          {wishes.length}
        </span>
      </button>

      {/* LIVE WISHES & DOA modal */}
      {open && (
        <div className="absolute inset-0 z-[60] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" onClick={() => onOpenChange(false)} />
          <div
            className="relative w-full rounded-t-2xl border-t-2 border-cyan-500/50 bg-slate-950/96 backdrop-blur-md shadow-[0_-10px_30px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden"
            style={{ maxHeight: "72%" }}
          >
            <div className="h-[2px] w-full bg-gradient-to-r from-[#38bdf8] via-[#f472b6] to-[#38bdf8] opacity-90 shrink-0" />
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-cyan-500/20 bg-slate-900/80 shrink-0">
              <span className="text-[10px] font-bold tracking-wider text-cyan-200 uppercase flex items-center gap-1.5" style={{ ...FONT_PIXEL, textShadow: "0 0 8px rgba(56,239,255,0.6)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                LIVE WISHES &amp; DOA
                <span className="text-cyan-400 font-normal">({wishes.length} Pesan)</span>
              </span>
              <button type="button" onClick={() => onOpenChange(false)} aria-label="Tutup" className="w-8 h-8 rounded-lg bg-[#161b2a] border-2 border-[#38bdf8]/50 text-[#7bd0ff] hover:border-[#f472b6] hover:text-white active:scale-95 transition-all flex items-center justify-center">
                <span className="text-sm" style={FONT_PIXEL}>✕</span>
              </button>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-hidden">
              <div className="h-[38vh] overflow-y-auto p-3 space-y-2 select-text">
                {!loaded && weddingProfileId ? (
                  <p className="text-center text-[10px] text-slate-500 py-6" style={FONT_BODY}>
                    Memuat doa &amp; ucapan…
                  </p>
                ) : wishes.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-500 py-6" style={FONT_BODY}>
                    {weddingProfileId ? "Belum ada doa &amp; ucapan. Jadilah yang pertama!" : "Mode pratinjau — daftar ucapan tidak dimuat."}
                  </p>
                ) : (
                  wishes.map((w, i) => (
                    <div key={w.id} className={`p-2 rounded-xl bg-slate-900/70 border ${BORDERS[i % BORDERS.length]} backdrop-blur-sm flex items-start gap-2.5`}>
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr border flex items-center justify-center text-[10px] font-bold shrink-0 ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}`}>
                        {initials(w.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[11px] font-semibold text-white truncate">{w.name || "Tamu Undangan"}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">{timeAgo(w.created_at)}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-200" style={FONT_BODY}>{w.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Input */}
            <div className="p-3 pt-1.5 bg-slate-900/95 border-t border-slate-800 shrink-0">
              {status === "done" ? (
                <p className="text-[10px] text-emerald-300 px-3 py-1.5" style={FONT_BODY}>{feedback}</p>
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/90 border-2 border-cyan-500/40 rounded-xl focus-within:border-cyan-400">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder="Tulis Ucapan & Do'a Restu..."
                    className="w-full bg-transparent text-[11px] text-slate-100 placeholder-slate-400 focus:outline-none border-none p-0"
                    style={FONT_BODY}
                  />
                  <button
                    type="button"
                    aria-label="Kirim doa"
                    onClick={send}
                    className="w-7 h-7 rounded-lg bg-cyan-400 text-slate-950 font-bold flex items-center justify-center active:scale-95 hover:bg-cyan-300 transition shrink-0 ml-2 shadow-[0_0_10px_rgba(56,239,255,0.8)]"
                  >
                    <span className="material-symbols-outlined text-[15px] rotate-45 -mt-px -mr-px">send</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}