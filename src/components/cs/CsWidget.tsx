"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { csWidgetEnabledOn } from "@/lib/cs/widgetRoutes"
import { csWhatsAppUrl } from "@/lib/cs/contact"

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
  const [conversationId, setConversationId] = useState("")
  const [uploading, setUploading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const polledAt = useRef(new Date().toISOString())

  // Balasan manusia dari /ops/cs (dan balasan bot yang telat) masuk lewat polling.
  useEffect(() => {
    if (!open || !conversationId) return
    let cancelled = false

    const tick = async () => {
      try {
        const res = await fetch(
          `/api/cs/chat?conversationId=${encodeURIComponent(conversationId)}&since=${encodeURIComponent(polledAt.current)}`,
          { cache: "no-store" }
        )
        if (!res.ok) return
        const data = (await res.json()) as {
          messages?: { id: string; body: string; created_at: string }[]
        }
        if (cancelled || !data.messages?.length) return
        setMessages((current) => {
          const next = [...current]
          for (const item of data.messages || []) {
            if (!item.body) continue
            const last = next[next.length - 1]
            if (last && last.role === "assistant" && last.text === item.body) continue
            if (next.some((message) => message.id === item.id)) continue
            next.push({ id: item.id, role: "assistant", text: item.body })
          }
          return next
        })
        const last = data.messages[data.messages.length - 1]
        if (last?.created_at) polledAt.current = last.created_at
      } catch {
        // polling gagal tidak boleh mengganggu chat
      }
    }

    const timer = window.setInterval(tick, 5000)
    void tick()
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [open, conversationId])

  const upload = useCallback(async (file: File) => {
    if (uploading) return
    setUploading(true)
    setError("")
    setMessages((current) => [...current, { id: newId(), role: "user", text: "📷 Foto terkirim" }])
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/cs/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "Foto gagal diunggah.")
        return
      }
      if (data.reply) {
        setMessages((current) => [...current, { id: newId(), role: "assistant", text: String(data.reply) }])
      }
    } catch {
      setError("Foto gagal diunggah. Coba lagi ya.")
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }, [uploading])

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
        if (data.conversationId) setConversationId(String(data.conversationId))
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
        className={`fixed bottom-24 right-5 z-[60] h-14 w-14 rounded-full text-white flex items-center justify-center shadow-[0_14px_34px_-12px_rgba(141,77,57,0.7)] transition-transform hover:scale-[1.03] active:scale-95 ${
          open ? "" : "cs-halo"
        }`}
        style={{ background: "linear-gradient(135deg, #C25A46 0%, #8D4D39 100%)" }}
      >
        {open ? (
          <span className="material-symbols-outlined text-[22px]">close</span>
        ) : (
          <CsAvatar className="h-8 w-8" />
        )}
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
            <a
              href={csWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat WhatsApp CS Aksaraa"
              className="h-8 rounded-full bg-white/15 text-white flex items-center gap-1.5 px-2.5 hover:bg-white/25"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M17.47 14.38c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35z" />
                <path d="M12.04 2C6.6 2 2.2 6.4 2.2 11.84c0 1.74.46 3.44 1.32 4.93L2 22l5.35-1.4a9.84 9.84 0 0 0 4.69 1.2h.01c5.43 0 9.84-4.4 9.84-9.84 0-2.63-1.02-5.1-2.88-6.96A9.78 9.78 0 0 0 12.04 2zm0 18.02h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.02-.19-.31a8.17 8.17 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.86 5.8 2.41a8.15 8.15 0 0 1 2.4 5.8c0 4.52-3.68 8.17-8.21 8.17z" />
              </svg>
              <span className="text-[11px] font-semibold hidden sm:inline">WhatsApp</span>
            </a>
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
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void upload(file)
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Kirim foto"
                className="h-10 w-10 shrink-0 rounded-full border border-[#EAD9C7] bg-[#FFFBF6] text-[#8D4D39] flex items-center justify-center disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              </button>
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
                disabled={busy || uploading || !text.trim()}
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
