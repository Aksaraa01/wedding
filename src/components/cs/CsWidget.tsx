"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { csWidgetEnabledOn } from "@/lib/cs/widgetRoutes"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  text: string
}

const GREETING =
  "Halo Kak, aku bisa bantu soal paket, harga, template, dan cara daftar. Mau tanya apa?"

const QUICK_REPLIES = ["Harga paket", "Lihat template", "Cara daftar"]

function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function renderMessageText(text: string) {
  const parts = text.split(/(https?:\/\/[^\s<]+)/g)
  return parts.map((part, index) => {
    if (!/^https?:\/\//.test(part)) return <span key={index}>{part}</span>
    const href = part.replace(/[),.;!?]+$/, "")
    const tail = part.slice(href.length)
    return (
      <span key={index}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="underline break-all hover:opacity-80"
        >
          {href}
        </a>
        {tail}
      </span>
    )
  })
}

function CsAvatar({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={`cs-bob ${className}`} aria-hidden="true">
      <circle cx="24" cy="24" r="23" fill="#FFF4E6" />
      <path
        d="M9 25a15 15 0 0 1 30 0"
        fill="none"
        stroke="#8D4D39"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="5.5" y="22" width="5" height="10" rx="2.5" fill="#8D4D39" />
      <rect x="37.5" y="22" width="5" height="10" rx="2.5" fill="#8D4D39" />
      <circle cx="24" cy="26" r="10" fill="#F3CBA5" />
      <path
        d="M13 24c0-8 5-12 11-12s11 4 11 12c0-4-4-6-11-6s-11 2-11 6z"
        fill="#4A372F"
      />
      <circle cx="20.5" cy="25.5" r="1.3" fill="#4A372F" />
      <circle cx="27.5" cy="25.5" r="1.3" fill="#4A372F" />
      <path
        d="M20.5 29.5q3.5 2.6 7 0"
        fill="none"
        stroke="#4A372F"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="17.2" cy="28.6" r="1.5" fill="#EFA48E" opacity="0.55" />
      <circle cx="30.8" cy="28.6" r="1.5" fill="#EFA48E" opacity="0.55" />
      <path
        d="M40 32c0 4.5-3.5 6.5-7.5 6.5"
        fill="none"
        stroke="#8D4D39"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="31.5" cy="38.5" r="2" fill="#8D4D39" />
    </svg>
  )
}

const CS_WIDGET_ENABLED = process.env.NEXT_PUBLIC_CS_WIDGET === "1"

export default function CsWidget() {
  const pathname = usePathname()
  if (!CS_WIDGET_ENABLED) return null
  // Marketing only: Navigation dipakai lintas rute, jadi rute yang tidak ada di
  // allowlist (dashboard, auth, undangan tamu) tidak boleh ikut menampilkan widget.
  if (!csWidgetEnabledOn(pathname || "/")) return null
  return <CsWidgetInner />
}

function CsWidgetInner() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greeting", role: "assistant", text: GREETING },
  ])
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy])

  const send = useCallback(
    async (raw?: string) => {
      const value = (raw ?? text).trim()
      if (!value || busy) return

      const userMessage: ChatMessage = { id: newId(), role: "user", text: value }
      setMessages((current) => [...current, userMessage])
      setText("")
      setError("")
      setBusy(true)

      try {
        const res = await fetch("/api/cs/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: value, client_message_id: userMessage.id }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || "Gagal mengirim pesan. Coba lagi ya.")
          return
        }
        const reply = String(data.reply || "").trim()
        if (reply) {
          setMessages((current) => [...current, { id: newId(), role: "assistant", text: reply }])
        } else {
          setError("Belum ada balasan. Coba kirim ulang ya.")
        }
      } catch {
        setError("Koneksi bermasalah. Coba lagi ya.")
      } finally {
        setBusy(false)
      }
    },
    [text, busy]
  )

  const showQuickReplies = messages.length === 1 && !busy

  return (
    <>
      <style jsx>{`
        @keyframes cs-pop {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .cs-pop {
          animation: cs-pop 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes cs-halo {
          0% {
            box-shadow: 0 0 0 0 rgba(179, 78, 63, 0.35);
          }
          70% {
            box-shadow: 0 0 0 14px rgba(179, 78, 63, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(179, 78, 63, 0);
          }
        }
        .cs-halo {
          animation: cs-halo 2.6s ease-out infinite;
        }
        @keyframes cs-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1.5px); }
        }
        .cs-bob {
          animation: cs-bob 3s ease-in-out infinite;
        }
      `}</style>

      {!open && (
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Tutup chat CS" : "Buka chat CS"}
        aria-expanded={open}
        className={`fixed bottom-24 right-5 z-[60] h-14 rounded-full text-white flex items-center gap-2 shadow-[0_14px_34px_-12px_rgba(141,77,57,0.7)] transition-transform hover:scale-[1.03] active:scale-95 ${
          open ? "w-14 justify-center" : "pl-4 pr-5 cs-halo"
        }`}
        style={{ background: "linear-gradient(135deg, #C25A46 0%, #8D4D39 100%)" }}
      >
        {open ? (
          <span className="material-symbols-outlined text-[22px]">close</span>
        ) : (
          <CsAvatar className="h-8 w-8" />
        )}
        {!open && <span className="text-sm font-semibold whitespace-nowrap">Tanya CS</span>}
      </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat customer service Aksaraa"
          className="cs-pop fixed bottom-5 right-5 z-[60] w-[calc(100vw-2.5rem)] max-w-[390px] h-[72vh] max-h-[580px] flex flex-col overflow-hidden rounded-[26px] border border-[#F0E2D2] shadow-[0_24px_60px_-20px_rgba(141,77,57,0.45)]"
          style={{ background: "#FFFBF6" }}
        >
          <div
            className="px-4 py-3.5 flex items-center gap-3"
            style={{ background: "linear-gradient(135deg, #C25A46 0%, #8D4D39 100%)" }}
          >
            <span className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0 overflow-hidden">
              <CsAvatar className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm leading-tight text-white">CS Aksaraa</p>
              <p className="text-[10px] text-white/80 leading-tight flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F6D9A8]" />
                Online · balas dalam beberapa detik
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup chat"
              className="h-8 w-8 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div
            ref={listRef}
            aria-live="polite"
            className="flex-1 overflow-y-auto px-3.5 py-4 space-y-2.5"
            style={{ background: "linear-gradient(180deg, #FFFBF6 0%, #FBF3E8 100%)" }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                    message.role === "user"
                      ? "text-white rounded-2xl rounded-br-md"
                      : "bg-white text-[#4A372F] rounded-2xl rounded-tl-md border border-[#F0E2D2] shadow-[0_2px_10px_-6px_rgba(141,77,57,0.35)]"
                  }`}
                  style={
                    message.role === "user"
                      ? { background: "linear-gradient(135deg, #C25A46 0%, #A34A38 100%)" }
                      : undefined
                  }
                >
                  {renderMessageText(message.text)}
                </div>
              </div>
            ))}

            {busy && (
              <div className="flex justify-start">
                <div className="bg-white border border-[#F0E2D2] rounded-2xl rounded-tl-md px-3.5 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C25A46] animate-pulse" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C25A46] animate-pulse [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C25A46] animate-pulse [animation-delay:300ms]" />
                </div>
              </div>
            )}

            {showQuickReplies && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => void send(chip)}
                    className="rounded-full border border-[#E7C9A8] bg-[#FFF4E6] px-3 py-1.5 text-[11px] font-semibold text-[#8D4D39] hover:bg-[#FBE9D5] transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {error && <p className="text-[11px] text-[#B3402E] px-1 pt-1">{error}</p>}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void send()
            }}
            className="p-2.5 bg-white border-t border-[#F0E2D2]"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={text}
                onChange={(event) => setText(event.target.value)}
                maxLength={1000}
                placeholder="Tulis pertanyaan…"
                aria-label="Pesan untuk CS"
                className="flex-1 min-w-0 rounded-full border border-[#EAD9C7] bg-[#FFFBF6] px-4 py-2.5 text-sm text-[#4A372F] placeholder:text-[#A7917F] focus:outline-none focus:border-[#C25A46]"
              />
              <button
                type="submit"
                disabled={busy || !text.trim()}
                aria-label="Kirim pesan"
                className="h-10 w-10 shrink-0 rounded-full text-white flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
                style={{ background: "linear-gradient(135deg, #C25A46 0%, #8D4D39 100%)" }}
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
            <p className="text-[9px] text-[#A7917F] mt-1.5 px-2">
              Balasan otomatis. Untuk hal sensitif, tim kami akan menghubungi Kakak.
            </p>
          </form>
        </div>
      )}
    </>
  )
}
