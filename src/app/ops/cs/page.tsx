"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import CsConversationContext from "@/components/ops/CsConversationContext"
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
  channel?: string | null
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
  conversation: {
    id: string
    status: string
    channel?: string | null
    intent: string | null
    ai_paused_until: string | null
    last_inbound_at: string | null
    last_outbound_at: string | null
  }
  contact: { id: string; name: string | null; phone: string | null; verified_at: string | null } | null
  couple: { id: string; groom_name: string | null; bride_name: string | null; slug: string | null } | null
  template: { id: string; name: string | null } | null
  lead: Lead | null
  messages: Message[]
  escalations: {
    id: string
    reason: string
    priority: string
    status: string
    summary: string | null
    created_at: string
  }[]
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

type IdentityRow = {
  channel?: string | null
  contact: { name?: string | null; phone?: string | null; verified_at?: string | null } | null
  couple: { groom_name?: string | null; bride_name?: string | null } | null
}

function channelLabel(channel?: string | null): "Website" | "WhatsApp" {
  return channel === "web" ? "Website" : "WhatsApp"
}

function coupleName(couple: IdentityRow["couple"]): string {
  if (!couple) return ""
  return [couple.groom_name, couple.bride_name].filter(Boolean).join(" & ")
}

// Nomor WhatsApp selalu ditampilkan untuk kontak WA; kalau nomornya terdaftar,
// nama pasangan yang jadi judul. Pengunjung web tampil sebagai "Website",
// dan baru memakai nama kalau memang sudah terhubung ke profil.
function contactTitle(row: IdentityRow): string {
  const name = coupleName(row.couple)
  const registered = Boolean(row.couple)
  if (channelLabel(row.channel) === "Website") {
    return registered && name ? name : "Website"
  }
  if (registered && name) return name
  return row.contact?.phone || row.contact?.name || "Tanpa nama"
}

function contactMeta(row: IdentityRow): string {
  const parts: string[] = [channelLabel(row.channel)]
  const registered = Boolean(row.couple)
  const phone = row.contact?.phone || ""
  if (channelLabel(row.channel) === "Website") {
    parts.push(registered ? "terdaftar" : "belum terdaftar")
  } else {
    if (phone) parts.push(phone)
    parts.push(registered ? "terdaftar" : "belum terdaftar")
  }
  return parts.join(" · ")
}

// Jeda otomatis (balasan tim) punya batas waktu; toggle manual tidak.
function aiPauseInfo(conversation: { status: string; ai_paused_until: string | null }): {
  active: boolean
  label: string
  hint: string
} {
  if (conversation.status !== "human") {
    return {
      active: true,
      label: "AI aktif",
      hint: "AI membalas otomatis. Klik untuk menghentikan AI dan menangani sendiri.",
    }
  }
  if (!conversation.ai_paused_until) {
    return {
      active: false,
      label: "AI dijeda",
      hint: "AI dijeda manual. Klik untuk mengaktifkan balasan otomatis lagi.",
    }
  }
  const remainingMs = new Date(conversation.ai_paused_until).getTime() - Date.now()
  if (remainingMs <= 0) {
    return {
      active: false,
      label: "AI dijeda",
      hint: "Jeda otomatis sudah lewat; AI menyala saat pesan klien berikutnya masuk.",
    }
  }
  const minutes = Math.max(1, Math.ceil(remainingMs / 60_000))
  return {
    active: false,
    label: `AI dijeda · ${minutes} mnt`,
    hint: `AI menyala sendiri dalam ${minutes} menit kalau tidak ada balasan tim lagi.`,
  }
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
  const [openEscalation, setOpenEscalation] = useState(false)
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
  const [globalAi, setGlobalAi] = useState<{ whatsapp: boolean; website: boolean } | null>(null)
  const [globalBusy, setGlobalBusy] = useState(false)

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

  const loadGlobalAi = useCallback(async () => {
    if (!employee) return
    try {
      const res = await fetch("/api/ops/cs/global", { headers, cache: "no-store" })
      if (res.ok) setGlobalAi(await res.json())
    } catch {
      // polling berikutnya mencoba lagi
    }
  }, [employee, headers])

  useEffect(() => {
    void loadGlobalAi()
    const timer = window.setInterval(loadGlobalAi, 15000)
    return () => window.clearInterval(timer)
  }, [loadGlobalAi])

  const toggleChannel = useCallback(
    async (channel: "wa" | "web") => {
      if (!globalAi) return
      const current = channel === "wa" ? globalAi.whatsapp : globalAi.website
      const next = !current
      if (!next) {
        const label = channel === "wa" ? "WhatsApp" : "Website (widget)"
        const ok = window.confirm(
          `Matikan AI di ${label}?\n\nBot berhenti membalas di kanal itu saja. Pesan klien tetap tersimpan dan muncul di daftar.`
        )
        if (!ok) return
      }
      setGlobalBusy(true)
      setError("")
      try {
        const res = await fetch("/api/ops/cs/global", {
          method: "POST",
          headers,
          body: JSON.stringify({ channel, enabled: next }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data?.error || "gagal mengubah AI kanal")
        setGlobalAi({
          whatsapp: !!data.whatsapp,
          website: !!data.website,
        })
      } catch (err) {
        setError(String((err as Error)?.message || "gagal mengubah AI kanal"))
      } finally {
        setGlobalBusy(false)
      }
    },
    [globalAi, headers]
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
      <main className="pt-20 h-screen supports-[height:100dvh]:h-[100dvh] flex bg-background overflow-hidden">
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

            {/* Kill switch per kanal: WhatsApp dan widget web terpisah.
                Status tiap percakapan tidak diubah, jadi saat dinyalakan lagi
                semuanya kembali ke status terakhirnya. */}
            <div className="border border-outline-variant bg-white p-3 space-y-2">
              <p className="text-[10px] font-label-md uppercase tracking-widest text-on-surface-variant">
                AI Bot per kanal
              </p>
              {[
                { key: "wa" as const, label: "WhatsApp", active: globalAi?.whatsapp !== false },
                { key: "web" as const, label: "Website (widget)", active: globalAi?.website !== false },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{row.label}</p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        row.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.active ? "AKTIF" : "MATI"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleChannel(row.key)}
                    disabled={!globalAi || globalBusy}
                    className={`px-2.5 py-1.5 text-[10px] font-label-md uppercase tracking-widest disabled:opacity-50 ${
                      row.active ? "bg-red-600 text-white" : "bg-emerald-600 text-white"
                    }`}
                  >
                    {row.active ? "Matikan" : "Nyalakan"}
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-on-surface-variant leading-snug">
                Mati di satu kanal tidak memengaruhi kanal lain. Pesan klien tetap masuk
                ke daftar; menyalakan lagi mengembalikan tiap percakapan ke status terakhirnya.
              </p>
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
                className="w-full border border-outline-variant pl-9 pr-9 py-2.5 text-base md:text-sm bg-white"
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
                className={`w-full text-left px-4 py-3.5 md:py-3 border-b border-outline-variant/60 hover:bg-surface-container-low ${
                  selectedId === item.id ? "bg-surface-container-low" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-sm truncate">{contactTitle(item)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${statusBadge(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{contactMeta(item)}</p>
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
              <header className="shrink-0 px-3 md:px-4 py-2 border-b border-outline-variant flex flex-wrap items-center gap-x-2 gap-y-1.5 md:gap-3 bg-background">
                <button
                  onClick={() => setSelectedId(null)}
                  className="md:hidden w-9 h-9 border border-outline-variant flex items-center justify-center"
                  aria-label="Kembali"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">
                    {contactTitle({ ...detail, channel: detail.conversation.channel })}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {contactMeta({ ...detail, channel: detail.conversation.channel })} ·{" "}
                    {detail.contact?.verified_at ? "Terverifikasi" : "Belum terverifikasi"} ·{" "}
                    {statusLabel(detail.conversation.status)}
                  </p>
                </div>
                <div className="basis-full md:basis-auto md:ml-auto flex items-center gap-2">
                  {/* Toggle AI per percakapan: satu kontrol, statusnya jelas. */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={aiPauseInfo(detail.conversation).active}
                    onClick={() => act(detail.conversation.status === "bot" ? "ai_off" : "ai_on")}
                    disabled={busy}
                    title={aiPauseInfo(detail.conversation).hint}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 md:px-3 md:py-2 text-[10px] font-label-md uppercase tracking-widest disabled:opacity-50 ${
                      aiPauseInfo(detail.conversation).active
                        ? "bg-emerald-600 text-white"
                        : "border border-amber-300 bg-amber-100 text-amber-900"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {aiPauseInfo(detail.conversation).active ? "smart_toy" : "pause_circle"}
                    </span>
                    {aiPauseInfo(detail.conversation).label}
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

              {detail.escalations.length > 0 && (() => {
                const escalation = detail.escalations[0]
                // Ringkasan eskalasi berisi laporan lengkap (banyak baris "-").
                // Yang berguna langsung: alasannya, prioritasnya, dan sejak kapan.
                const lines = String(escalation.summary || "")
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line && !/:\s*-\s*$/.test(line))
                return (
                  <div className="bg-amber-50 border-b border-amber-200">
                    <button
                      type="button"
                      onClick={() => setOpenEscalation((value) => !value)}
                      aria-expanded={openEscalation}
                      className="w-full px-3 md:px-4 py-2 flex items-center gap-2 text-left"
                    >
                      <span className="material-symbols-outlined text-[16px] text-amber-900">priority_high</span>
                      <span className="text-xs font-semibold text-amber-900">
                        Eskalasi {escalation.reason}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-amber-800">
                        {escalation.priority}
                      </span>
                      <span className="text-[10px] text-amber-800">{fmt(escalation.created_at)}</span>
                      <span className="ml-auto material-symbols-outlined text-[18px] text-amber-900">
                        {openEscalation ? "expand_less" : "expand_more"}
                      </span>
                    </button>
                    {openEscalation && lines.length > 0 && (
                      <div className="px-3 md:px-4 pb-2 max-h-40 overflow-y-auto">
                        <p className="text-[11px] text-amber-900 whitespace-pre-wrap break-words">
                          {lines.slice(0, 14).join("\n")}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })()}

              <CsConversationContext
                status={detail.conversation.status}
                lastInboundAt={detail.conversation.last_inbound_at}
                lastOutboundAt={detail.conversation.last_outbound_at}
                couple={detail.couple}
                templateName={detail.template?.name || null}
                draft={detail.draft}
                lead={detail.lead}
                budgetLabels={BUDGET_LABELS}
                editorUrl={detail.editorUrl}
              />

              <div
                ref={messagesRef}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 md:p-4 space-y-3 bg-[#f7f4ee]"
              >
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
                        title={message.model || undefined}
                        className={`text-[9px] mt-1 ${
                          message.direction === "in" ? "text-on-surface-variant" : "text-white/70"
                        }`}
                      >
                        {fmt(message.created_at)}
                        {/* Balasan tim ditandai; balasan AI tidak perlu nama model
                            di layar operasional (tetap ada di tooltip). */}
                        {message.model?.startsWith("human") ? " · Tim" : ""}
                        {message.guard && message.guard.ok === false ? " · guard" : ""}
                        {message.error ? ` · ${message.error}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <footer className="shrink-0 px-3 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] border-t border-outline-variant bg-white">
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
                    className="flex-1 border border-outline-variant px-3 py-2 text-base md:text-sm resize-none"
                  />
                  <button
                    onClick={() => {
                      if (text.trim() && !busy) act("reply", text.trim())
                    }}
                    disabled={busy || !text.trim()}
                    className="px-4 py-2 text-[10px] font-label-md uppercase tracking-widest bg-primary text-white disabled:opacity-50 h-[52px] min-w-[64px]"
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
