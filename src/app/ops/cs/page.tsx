"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"
import { useVisiblePoll } from "@/lib/useVisiblePoll"

type OpsEmployee = { id: string; name: string; role: string; phone_number?: string }

type Lead = {
  stage: string
  wedding_date: string | null
  city: string | null
  guest_count: number | null
  budget_band: string | null
  need: string | null
  package_interest: string | null
  template_interest: string | null
  objection_count: number
  next_action_at: string | null
  opt_out: boolean
}

type Item = {
  id: string
  status: string
  intent: string | null
  ai_paused_until: string | null
  escalated_at: string | null
  last_inbound_at: string | null
  last_outbound_at: string | null
  needs_reply: boolean
  contact: { id: string; name: string | null; phone: string | null; verified_at: string | null } | null
  couple: { id: string; groom_name: string | null; bride_name: string | null; slug: string | null } | null
  lead: Lead | null
  escalation: { id: string; reason: string; priority: string; status: string } | null
  last_message: { direction: string; body: string; created_at: string } | null
}

type Message = {
  id: string
  direction: string
  role: string
  body: string
  intent: string | null
  model: string | null
  guard: { ok?: boolean; violations?: string[] } | null
  error: string | null
  created_at: string
}

type Detail = {
  conversation: { id: string; status: string; intent: string | null; ai_paused_until: string | null }
  contact: { id: string; name: string | null; phone: string | null; verified_at: string | null } | null
  lead: Lead | null
  messages: Message[]
  escalations: { id: string; reason: string; priority: string; status: string; summary: string | null }[]
  draft: { draft: Record<string, unknown>; status: string; updated_at: string } | null
  editorUrl: string | null
}

const POLL_MS = 5000

function fmt(value: string | null): string {
  if (!value) return "-"
  return new Date(value).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function statusBadge(status: string): string {
  if (status === "human") return "bg-amber-100 text-amber-900"
  if (status === "closed") return "bg-neutral-200 text-neutral-700"
  return "bg-emerald-100 text-emerald-900"
}

function statusLabel(status: string): string {
  if (status === "human") return "Ditangani tim"
  if (status === "closed") return "Selesai"
  return "Bot"
}

const BUDGET_LABELS: Record<string, string> = {
  under_1m: "< 1 juta",
  "1_3m": "1–3 juta",
  "3_6m": "3–6 juta",
  "6_10m": "6–10 juta",
  above_10m: "> 10 juta",
}

export default function OpsCsPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<OpsEmployee | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [filter, setFilter] = useState<"all" | "needs" | "human" | "closed">("all")
  const [search, setSearch] = useState("")
  // Polling & refresh setelah aksi harus tetap memakai kata kunci yang aktif,
  // kalau tidak hasil pencarian tertimpa daftar 80 terbaru.
  const searchRef = useRef("")
  const [text, setText] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const messagesRef = useRef<HTMLDivElement>(null)
  const [wa, setWa] = useState<{
    connected?: boolean
    me?: string | null
    pairing?: boolean
    pairingCode?: string
    qr?: string
    offline?: boolean
    error?: string
  } | null>(null)
  const [waPhone, setWaPhone] = useState("")
  const [waBusy, setWaBusy] = useState(false)

  useEffect(() => {
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    setEmployee(JSON.parse(raw))
  }, [router])

  const headers = useMemo(
    () => ({
      "content-type": "application/json",
      "x-ops-phone": employee?.phone_number || "",
      "x-ops-role": employee?.role || "",
    }),
    [employee]
  )

  const loadWa = useCallback(async () => {
    if (!employee) return
    try {
      const res = await fetch("/api/ops/cs/wa", { headers, cache: "no-store" })
      if (res.ok) setWa(await res.json())
    } catch {
      // diamkan, polling berikutnya mencoba lagi
    }
  }, [employee, headers])

  useEffect(() => {
    void loadWa()
    const timer = window.setInterval(loadWa, 15000)
    return () => window.clearInterval(timer)
  }, [loadWa])

  const waAction = useCallback(
    async (action: "pair" | "logout") => {
      setWaBusy(true)
      setError("")
      try {
        const res = await fetch("/api/ops/cs/wa", {
          method: "POST",
          headers,
          body: JSON.stringify({ action, phone: waPhone }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) setError(data.error || "Gagal memproses WhatsApp")
        await loadWa()
      } catch {
        setError("Gateway WhatsApp tidak dapat dihubungi")
      } finally {
        setWaBusy(false)
      }
    },
    [headers, loadWa, waPhone]
  )

  const fetchList = useCallback(async (query?: string) => {
    const term = query === undefined ? searchRef.current : query
    try {
      const suffix = term && term.trim() ? `?q=${encodeURIComponent(term.trim())}` : ""
      const res = await fetch(`/api/ops/cs${suffix}`, { headers })
      if (res.status === 401) {
        router.replace("/ops/login")
        return
      }
      const data = await res.json()
      setItems(data.items || [])
    } catch {
      // biarkan polling berikutnya mencoba lagi
    } finally {
      setLoading(false)
    }
  }, [headers, router])

  const fetchDetail = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/ops/cs?id=${encodeURIComponent(id)}`, { headers })
        if (!res.ok) return
        const data = await res.json()
        setDetail(data)
      } catch {
        // diamkan
      }
    },
    [headers]
  )

  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    if (!employee) return
    const term = search.trim()
    // 1 karakter: saring daftar yang sudah dimuat. 2+ karakter: tanya server,
    // supaya percakapan lama (bukan 80 terbaru) ikut ketemu.
    if (term.length < 2) {
      void fetchList()
      return
    }
    const timer = setTimeout(() => void fetchList(term), 300)
    return () => clearTimeout(timer)
  }, [employee, fetchList, search])

  useVisiblePoll(fetchList, POLL_MS, !!employee)

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    fetchDetail(selectedId)
  }, [selectedId, fetchDetail])

  useVisiblePoll(() => {
    if (selectedId) fetchDetail(selectedId)
  }, POLL_MS, !!employee && !!selectedId)

  useEffect(() => {
    const el = messagesRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [detail?.messages.length])

  const filtered = items.filter((item) => {
    if (filter === "needs" && !(item.needs_reply || item.escalation)) return false
    if (filter === "human" && item.status !== "human") return false
    if (filter === "closed" && item.status !== "closed") return false
    return true
  })

  const searching = search.trim().length >= 2

  const act = useCallback(
    async (action: string, message?: string) => {
      if (!selectedId) return
      setBusy(true)
      setError("")
      try {
        const res = await fetch("/api/ops/cs", {
          method: "POST",
          headers,
          body: JSON.stringify({ action, conversation_id: selectedId, text: message }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Aksi gagal")
        } else {
          if (action === "reply") {
            if (data.sent === false) setError("Pesan tersimpan, tapi gateway WhatsApp gagal mengirim.")
            setText("")
          }
          await fetchList()
          await fetchDetail(selectedId)
        }
      } catch {
        setError("Tidak bisa menghubungi server")
      } finally {
        setBusy(false)
      }
    },
    [selectedId, headers, fetchList, fetchDetail]
  )

  if (!employee) return null

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background font-body-md">
        <div className="animate-spin material-symbols-outlined text-4xl text-primary">sync</div>
      </div>
    )
  }

  return (
    <>
      <PageTheme mode="light" />
      <OpsHeader employee={employee} activeKey="cs" />
      <main className="pt-20 h-screen flex bg-background overflow-hidden">
        <aside
          className={`${selectedId ? "hidden md:flex" : "flex"} w-full md:w-[360px] shrink-0 border-r border-outline-variant flex-col`}
        >
          <div className="p-4 border-b border-outline-variant space-y-3">
            <div className="border border-outline-variant bg-white p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-label-md uppercase tracking-widest text-on-surface-variant">
                  WhatsApp CS
                </p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded ${
                    wa?.connected ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                  }`}
                >
                  {wa?.connected ? "Terhubung" : wa?.offline ? "Gateway mati" : "Terputus"}
                </span>
              </div>

              {wa?.connected ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold truncate">{wa.me || "-"}</p>
                  <button
                    onClick={() => waAction("logout")}
                    disabled={waBusy}
                    className="px-2 py-1 text-[10px] border border-outline-variant uppercase tracking-widest disabled:opacity-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={waPhone}
                      onChange={(event) => setWaPhone(event.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="flex-1 min-w-0 border border-outline-variant px-2 py-1.5 text-xs bg-white"
                    />
                    <button
                      onClick={() => waAction("pair")}
                      disabled={waBusy || wa?.pairing}
                      className="px-2.5 py-1.5 text-[10px] font-label-md uppercase tracking-widest bg-primary text-white disabled:opacity-50"
                    >
                      {wa?.pairing ? "Menunggu…" : "Pair"}
                    </button>
                  </div>
                  {wa?.pairingCode && (
                    <p className="text-xs">
                      Kode: <span className="font-mono font-bold tracking-widest">{wa.pairingCode}</span>
                      <span className="block text-[10px] text-on-surface-variant mt-1">
                        WhatsApp → Linked devices → Link with phone number.
                      </span>
                    </p>
                  )}
                  {wa?.qr && !wa?.pairingCode && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={wa.qr} alt="QR pairing WhatsApp" className="w-40 h-40 mx-auto" />
                  )}
                </>
              )}
            </div>

            <div className="flex gap-2">
              {(["all", "needs", "human", "closed"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 text-[10px] font-label-md uppercase tracking-widest border ${
                    filter === key
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-on-surface-variant border-outline-variant"
                  }`}
                >
                  {key === "all" ? "Semua" : key === "needs" ? "Perlu" : key === "human" ? "Tim" : "Selesai"}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant">
                search
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, nomor, pasangan, atau isi pesan"
                aria-label="Cari percakapan"
                className="w-full border border-outline-variant pl-9 pr-9 py-2 text-sm bg-white"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            {searching && (
              <p className="text-[10px] text-on-surface-variant">
                {filtered.length} hasil untuk “{search.trim()}” · nama, nomor, nama pasangan, isi pesan
              </p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-6 text-sm text-on-surface-variant">Belum ada percakapan.</p>
            )}
            {filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full text-left px-4 py-3 border-b border-outline-variant/60 hover:bg-surface-container-low ${
                  selectedId === item.id ? "bg-surface-container-low" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">
                    {item.contact?.name || item.contact?.phone || "Tanpa nama"}
                    {item.couple?.groom_name && (
                      <span className="ml-1.5 text-[10px] font-normal text-on-surface-variant">
                        {item.couple.groom_name} &amp; {item.couple.bride_name}
                      </span>
                    )}
                  </p>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${statusBadge(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant truncate mt-1">
                  {item.last_message?.direction === "out" ? "↩ " : ""}
                  {item.last_message?.body || "—"}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-on-surface-variant">{fmt(item.last_inbound_at)}</span>
                  {item.escalation && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                      {item.escalation.reason}
                    </span>
                  )}
                  {item.lead?.stage && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-surface-container-highest rounded">
                      {item.lead.stage}
                    </span>
                  )}
                  {item.needs_reply && <span className="w-2 h-2 rounded-full bg-red-500 ml-auto" />}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className={`${selectedId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
          {!detail ? (
            <div className="flex-1 flex items-center justify-center text-sm text-on-surface-variant">
              Pilih percakapan untuk melihat detail.
            </div>
          ) : (
            <>
              <header className="p-4 border-b border-outline-variant flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden w-9 h-9 border border-outline-variant flex items-center justify-center"
                  aria-label="Kembali"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {detail.contact?.name || detail.contact?.phone || "Tanpa nama"}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {detail.contact?.phone || "-"} ·{" "}
                    {detail.contact?.verified_at ? "Terverifikasi" : "Belum terverifikasi"} ·{" "}
                    {statusLabel(detail.conversation.status)}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {/* Toggle AI per percakapan: satu kontrol, statusnya jelas. */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={detail.conversation.status === "bot"}
                    onClick={() => act(detail.conversation.status === "bot" ? "ai_off" : "ai_on")}
                    disabled={busy}
                    title={
                      detail.conversation.status === "bot"
                        ? "AI membalas otomatis. Klik untuk menghentikan AI dan menangani sendiri."
                        : "AI dijeda. Klik untuk mengaktifkan balasan otomatis lagi."
                    }
                    className={`inline-flex items-center gap-2 px-3 py-2 text-[10px] font-label-md uppercase tracking-widest disabled:opacity-50 ${
                      detail.conversation.status === "bot"
                        ? "bg-emerald-600 text-white"
                        : "border border-amber-300 bg-amber-100 text-amber-900"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {detail.conversation.status === "bot" ? "smart_toy" : "pause_circle"}
                    </span>
                    {detail.conversation.status === "bot" ? "AI aktif" : "AI dijeda"}
                  </button>
                  {detail.conversation.status !== "closed" && (
                    <button
                      onClick={() => act("close")}
                      disabled={busy}
                      className="px-3 py-2 text-[10px] font-label-md uppercase tracking-widest border border-outline-variant bg-white disabled:opacity-50"
                    >
                      Tutup
                    </button>
                  )}
                </div>
              </header>

              {detail.escalations.length > 0 && (
                <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
                  <p className="text-xs font-semibold text-amber-900">
                    Eskalasi: {detail.escalations[0].reason} ({detail.escalations[0].priority})
                  </p>
                  {detail.escalations[0].summary && (
                    <pre className="text-[11px] text-amber-900 whitespace-pre-wrap mt-1 font-body-md">
                      {detail.escalations[0].summary}
                    </pre>
                  )}
                </div>
              )}

              {detail.draft && Object.keys(detail.draft.draft || {}).length > 0 && (
                <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">
                      Data dikumpulkan CS ({detail.draft.status}) · {fmt(detail.draft.updated_at)}
                    </p>
                    {detail.editorUrl && (
                      <a
                        href={detail.editorUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] underline whitespace-nowrap"
                      >
                        Buka editor pasangan
                      </a>
                    )}
                  </div>
                  <ul className="mt-1.5 text-[11px] space-y-0.5">
                    {Object.entries(detail.draft.draft).map(([key, value]) => (
                      <li key={key}>
                        <span className="font-semibold">{key}</span>:{" "}
                        <span className="whitespace-pre-wrap break-words">
                          {typeof value === "string" ? value : JSON.stringify(value)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.lead && (
                <div className="px-4 py-3 border-b border-outline-variant bg-surface-container-low">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Tahap</p>
                      <p className="font-semibold">{detail.lead.stage}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Tanggal</p>
                      <p className="font-semibold">{detail.lead.wedding_date || "-"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Kota</p>
                      <p className="font-semibold">{detail.lead.city || "-"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Tamu</p>
                      <p className="font-semibold">{detail.lead.guest_count ?? "-"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Budget</p>
                      <p className="font-semibold">
                        {detail.lead.budget_band ? BUDGET_LABELS[detail.lead.budget_band] || detail.lead.budget_band : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Kebutuhan</p>
                      <p className="font-semibold">{detail.lead.need || "-"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Paket</p>
                      <p className="font-semibold">{detail.lead.package_interest || "-"}</p>
                    </div>
                    <div>
                      <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Keberatan</p>
                      <p className="font-semibold">{detail.lead.objection_count}x</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant mt-2">
                    Follow-up: {detail.lead.next_action_at ? fmt(detail.lead.next_action_at) : "-"}
                    {detail.lead.opt_out ? " · OPT-OUT" : ""}
                  </p>
                </div>
              )}

              <div ref={messagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f7f4ee]">
                {detail.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.direction === "in" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[70%] px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        message.direction === "in"
                          ? "bg-white border border-outline-variant"
                          : "bg-primary text-white"
                      }`}
                    >
                      {message.body}
                      <div
                        className={`text-[9px] mt-1 ${
                          message.direction === "in" ? "text-on-surface-variant" : "text-white/70"
                        }`}
                      >
                        {fmt(message.created_at)}
                        {message.model ? ` · ${message.model}` : ""}
                        {message.guard && message.guard.ok === false ? " · guard" : ""}
                        {message.error ? ` · ${message.error}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="p-3 border-t border-outline-variant bg-white">
                {error && <p className="text-xs text-red-700 mb-2">{error}</p>}
                <div className="flex gap-2 items-end">
                  <textarea
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault()
                        if (text.trim() && !busy) act("reply", text.trim())
                      }
                    }}
                    rows={2}
                    placeholder="Balas sebagai tim… (⌘/Ctrl + Enter untuk kirim)"
                    className="flex-1 border border-outline-variant px-3 py-2 text-sm resize-none"
                  />
                  <button
                    onClick={() => {
                      if (text.trim() && !busy) act("reply", text.trim())
                    }}
                    disabled={busy || !text.trim()}
                    className="px-4 py-2 text-[10px] font-label-md uppercase tracking-widest bg-primary text-white disabled:opacity-50 h-[52px]"
                  >
                    Kirim
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </main>
    </>
  )
}
