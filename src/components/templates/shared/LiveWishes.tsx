"use client"

import { useEffect, useState } from "react"
import { normalizeLanguage, t } from "@/lib/i18n"
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

function initials(name: string | null | undefined, lang: "id" | "en"): string {
  const parts = (name || t("honoredGuest", lang)).split(/\s+/).filter(Boolean)
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
  language?: string
  // Override the sticky button offset (quest footer needs more clearance).
  stickyClassName?: string
  // Hide the sticky trigger (caller provides its own entry point, e.g. header).
  hideTrigger?: boolean
}

// Shared live wishes experience for in-house templates: a sticky button that
// opens the LIVE WISHES & DOA modal (approved feed + input). Same design & UX
// for Skyline Penthouse, Pixel Paradise and Pixel Quest.
export default function LiveWishes({ open, onOpenChange, weddingProfileId, guestId, guestName, language, stickyClassName = "bottom-3 left-3", hideTrigger = false }: Props) {
  const lang = normalizeLanguage(language)
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
      setFeedback(t("previewWishNotSaved", lang))
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
          name: guestName || t("honoredGuest", lang),
          message: text,
          source: "invitation",
        }),
      })
      if (res.status === 409 || res.ok) {
        setStatus("done")
        setFeedback(res.ok ? t("thanksForWish", lang) : t("wishAlreadySent", lang))
      } else {
        setStatus("error")
        setFeedback(t("wishFailed", lang))
      }
    } catch {
      setStatus("error")
      setFeedback(t("wishFailed", lang))
    }
    setMessage("")
    setTimeout(() => {
      setStatus("idle")
      setFeedback("")
    }, 4000)
  }

  return (
    <>
      {!hideTrigger && (
        <div className={`fixed ${stickyClassName} z-40`}>
          <button
            type="button"
            onClick={() => onOpenChange(true)}
            className="bg-slate-900/90 border-2 border-cyan-400 px-3 py-2 rounded-lg shadow-[0_0_12px_rgba(56,239,255,0.6)] flex items-center gap-2 active:scale-95 hover:bg-slate-800 transition select-none"
          >
            <span className="material-symbols-outlined text-cyan-300 text-[16px] animate-pulse">chat_bubble</span>
            <span className="text-[10px] text-cyan-300 tracking-widest" style={{ ...FONT_PIXEL, textShadow: "0 0 5px rgba(56,239,255,0.8)" }}>
              LIVE WISHES
            </span>
          </button>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4">
          <div className="bg-slate-900/95 border-2 border-cyan-400/60 shadow-[0_0_30px_rgba(56,239,255,0.15)] w-full max-w-[420px] rounded-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 to-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(56,239,255,1)]" />
                <h3 className="text-[11px] text-cyan-300 tracking-widest" style={{ ...FONT_PIXEL, textShadow: "0 0 5px rgba(56,239,255,0.8)" }}>
                  LIVE WISHES &amp; DOA
                </h3>
              </div>
              <button
                type="button"
                aria-label={t("close", lang)}
                onClick={() => onOpenChange(false)}
                className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition"
              >
                <span className="material-symbols-outlined text-[16px] font-bold">close</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="h-[38vh] overflow-y-auto p-3 space-y-2 select-text">
                {!loaded && weddingProfileId ? (
                  <p className="text-center text-[10px] text-slate-500 py-6" style={FONT_BODY}>
                    {t("loadingWishes", lang)}
                  </p>
                ) : wishes.length === 0 ? (
                  <p className="text-center text-[10px] text-slate-500 py-6" style={FONT_BODY}>
                    {weddingProfileId ? t("noWishesYet", lang) : t("previewWishNotSaved", lang)}
                  </p>
                ) : (
                  wishes.map((w, i) => (
                    <div key={w.id} className={`p-2 rounded-xl bg-slate-900/70 border ${BORDERS[i % BORDERS.length]} backdrop-blur-sm flex items-start gap-2.5`}>
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr border flex items-center justify-center text-[10px] font-bold shrink-0 ${AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]}`}>
                        {initials(w.name, lang)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-[11px] font-semibold text-white truncate">{w.name || t("honoredGuest", lang)}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">{timeAgo(w.created_at, lang)}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-200" style={FONT_BODY}>{w.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-3 pt-1.5 bg-slate-900/95 border-t border-slate-800 shrink-0">
              {status === "done" ? (
                <p className="text-[10px] text-emerald-300 px-3 py-1.5" style={FONT_BODY}>{feedback}</p>
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/90 border-2 border-cyan-500/40 rounded-xl focus-within:border-cyan-400">
                  <input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && send()}
                    placeholder={t("writeWish", lang)}
                    className="w-full bg-transparent text-[11px] text-slate-100 placeholder-slate-400 focus:outline-none border-none p-0"
                    style={FONT_BODY}
                  />
                  <button
                    type="button"
                    aria-label={t("sendWishes", lang)}
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
