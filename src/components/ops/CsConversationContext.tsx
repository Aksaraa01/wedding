"use client"

import { useState } from "react"

import { FIELD_LABELS } from "@/lib/fieldLabels"

// Ringkasan percakapan di atas transkrip. Tujuannya menjawab tiga pertanyaan
// staf dalam satu pandangan: siapa orang ini, undangannya sudah sampai mana,
// dan apa yang harus dilakukan sekarang. Field kosong tidak ditampilkan.

export interface CsCouple {
  id: string
  groom_name: string | null
  bride_name: string | null
  slug: string | null
}

export interface CsLead {
  stage: string | null
  wedding_date: string | null
  city: string | null
  guest_count: number | null
  budget_band: string | null
  need: string | null
  package_interest: string | null
  objection_count: number
  next_action_at: string | null
  opt_out: boolean
}

interface Props {
  status: string
  lastInboundAt: string | null
  lastOutboundAt: string | null
  couple: CsCouple | null
  templateName: string | null
  draft: { draft: Record<string, unknown>; status: string; updated_at: string } | null
  lead: CsLead | null
  budgetLabels: Record<string, string>
  editorUrl: string | null
}

function fmtTime(value: string | null): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

function waitingLabel(lastInboundAt: string | null, lastOutboundAt: string | null): string | null {
  if (!lastInboundAt) return null
  if (lastOutboundAt && new Date(lastOutboundAt).getTime() >= new Date(lastInboundAt).getTime()) return null
  const minutes = Math.max(0, Math.round((Date.now() - new Date(lastInboundAt).getTime()) / 60_000))
  if (minutes < 60) return `Menunggu ${minutes} mnt`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Menunggu ${hours} jam`
  return `Menunggu ${Math.round(hours / 24)} hari`
}

// Istilah internal jangan tampil mentah ke staf ("cta", "buku_tamu").
const STAGE_LABELS: Record<string, string> = {
  new: "Baru",
  qualifying: "Kualifikasi",
  recommending: "Rekomendasi",
  objection: "Keberatan",
  cta: "Siap daftar",
  handoff: "Diserahkan ke tim",
  support: "Bantuan",
}

const NEED_LABELS: Record<string, string> = {
  undangan: "Undangan",
  buku_tamu: "Buku tamu QR",
  galeri: "Galeri tamu",
  belum_tahu: "Belum tahu",
}

function prettify(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/_/g, " ")
}

function labelFor(key: string): string {
  const raw = FIELD_LABELS[key] || key
  return raw.split(" (")[0]
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—"
  if (Array.isArray(value)) {
    if (!value.length) return "—"
    if (value.every((item) => typeof item === "string")) {
      const list = value as string[]
      const files = list.filter((item) => /^https?:/i.test(item)).length
      return files ? `${list.length} berkas` : list.join(", ").slice(0, 160)
    }
    return `${value.length} entri`
  }
  if (typeof value === "object") return "…"
  const text = String(value)
  if (/^https?:/i.test(text)) return "tautan"
  return text.length > 160 ? `${text.slice(0, 160)}…` : text
}

export default function CsConversationContext({
  status,
  lastInboundAt,
  lastOutboundAt,
  couple,
  templateName,
  draft,
  lead,
  budgetLabels,
  editorUrl,
}: Props) {
  const [openDetails, setOpenDetails] = useState(false)
  const [openDraft, setOpenDraft] = useState(false)

  const waiting = waitingLabel(lastInboundAt, lastOutboundAt)

  const chips: { label: string; value: string; tone?: "warn" | "muted" }[] = []
  if (waiting) chips.push({ label: "Antrean", value: waiting, tone: "warn" })
  if (couple) {
    const names = [couple.groom_name, couple.bride_name].filter(Boolean).join(" & ")
    if (names) chips.push({ label: "Pasangan", value: names })
  }
  if (templateName) chips.push({ label: "Template", value: templateName })
  if (lead?.stage) chips.push({ label: "Tahap", value: STAGE_LABELS[lead.stage] || prettify(lead.stage) || lead.stage })
  if (lead?.wedding_date) chips.push({ label: "Tanggal", value: lead.wedding_date })
  if (lead?.city) chips.push({ label: "Kota", value: lead.city })
  if (lead?.guest_count) chips.push({ label: "Tamu", value: `${lead.guest_count}` })
  if (lead?.need) chips.push({ label: "Kebutuhan", value: NEED_LABELS[lead.need] || prettify(lead.need) || lead.need })
  if (lead?.package_interest) {
    chips.push({ label: "Paket", value: prettify(lead.package_interest) || lead.package_interest })
  }
  if (lead?.budget_band) {
    chips.push({ label: "Budget", value: budgetLabels[lead.budget_band] || lead.budget_band })
  }
  if (lead?.objection_count) chips.push({ label: "Keberatan", value: `${lead.objection_count}x` })
  if (lead?.next_action_at) chips.push({ label: "Follow-up", value: fmtTime(lead.next_action_at) })
  if (lead?.opt_out) chips.push({ label: "OPT-OUT", value: "jangan dihubungi", tone: "warn" })

  const draftFields = Object.entries(draft?.draft || {}).filter(([key, value]) => {
    if (key.startsWith("__")) return false
    if (value === null || value === undefined || value === "") return false
    if (Array.isArray(value) && value.length === 0) return false
    return true
  })
  const pendingKey = (() => {
    const onboarding = (draft?.draft as Record<string, unknown> | undefined)?.__onboarding
    if (!onboarding || typeof onboarding !== "object") return null
    const field = (onboarding as Record<string, unknown>).field
    return typeof field === "string" ? field : null
  })()

  const hasAnything = chips.length > 0 || draftFields.length > 0

  return (
    <section className="border-b border-outline-variant bg-surface-container-low">
      <div className="px-3 md:px-4 py-2.5 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
        {hasAnything ? (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-0.5 px-0.5 snap-x md:flex-1 md:min-w-0">
            {chips.map((chip) => (
              <span
                key={`${chip.label}-${chip.value}`}
                className={`snap-start shrink-0 inline-flex items-baseline gap-1.5 border px-2 py-1 text-[11px] ${
                  chip.tone === "warn"
                    ? "border-amber-300 bg-amber-100 text-amber-900"
                    : "border-outline-variant bg-white text-on-surface"
                }`}
              >
                <span className="text-[9px] uppercase tracking-widest text-on-surface-variant">{chip.label}</span>
                <span className="font-semibold">{chip.value}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-on-surface-variant">
            Belum ada data terkumpul. {status === "bot" ? "AI menjawab otomatis." : "Menunggu tim membalas."}
          </p>
        )}

        <div className="flex items-center gap-2 md:shrink-0">
          {draftFields.length > 0 && (
            <button
              type="button"
              onClick={() => setOpenDraft((value) => !value)}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">
                {openDraft ? "expand_less" : "expand_more"}
              </span>
              Data CS · {draftFields.length}
              {pendingKey && <span className="normal-case tracking-normal">· {labelFor(pendingKey)}</span>}
            </button>
          )}
          {(lead || chips.length > 4) && (
            <button
              type="button"
              onClick={() => setOpenDetails((value) => !value)}
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">
                {openDetails ? "expand_less" : "expand_more"}
              </span>
              Detail lead
            </button>
          )}
          {editorUrl && (
            <a
              href={editorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Editor
            </a>
          )}
        </div>

        {openDraft && draftFields.length > 0 && (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-[11px] bg-white border border-outline-variant p-2">
            {draftFields.map(([key, value]) => (
              <li key={key} className="flex gap-1.5 min-w-0">
                <span className="text-on-surface-variant shrink-0">{labelFor(key)}:</span>
                <span className="font-medium break-words">{formatValue(value)}</span>
              </li>
            ))}
          </ul>
        )}

        {openDetails && lead && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] bg-white border border-outline-variant p-2">
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Tahap</p>
              <p className="font-semibold">{lead.stage || "-"}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Tanggal</p>
              <p className="font-semibold">{lead.wedding_date || "-"}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Kota</p>
              <p className="font-semibold">{lead.city || "-"}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Tamu</p>
              <p className="font-semibold">{lead.guest_count ?? "-"}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Budget</p>
              <p className="font-semibold">
                {lead.budget_band ? budgetLabels[lead.budget_band] || lead.budget_band : "-"}
              </p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Kebutuhan</p>
              <p className="font-semibold">{lead.need || "-"}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Paket</p>
              <p className="font-semibold">{lead.package_interest || "-"}</p>
            </div>
            <div>
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Keberatan</p>
              <p className="font-semibold">{lead.objection_count}x</p>
            </div>
            <div className="col-span-2 md:col-span-4">
              <p className="uppercase tracking-widest text-[9px] text-on-surface-variant">Follow-up</p>
              <p className="font-semibold">
                {lead.next_action_at ? fmtTime(lead.next_action_at) : "-"}
                {lead.opt_out ? " · OPT-OUT" : ""}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
