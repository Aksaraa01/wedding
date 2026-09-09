"use client"

import { useState } from "react"
import type { TemplateProps } from "@/types/template"
import ModalShell from "./ModalShell"
import type { GiftAccountData } from "../lib"

const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const
const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const
const MONO = { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" } as const

function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(
      () => true,
      () => fallbackCopy(text)
    )
  }
  return Promise.resolve(fallbackCopy(text))
}

function fallbackCopy(text: string): boolean {
  try {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    document.execCommand("copy")
    document.body.removeChild(ta)
    return true
  } catch {
    return false
  }
}

function CopyButton({ value, display }: { value: string; display: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle")
  const onClick = async () => {
    const ok = await copyText(value)
    setState(ok ? "copied" : "failed")
    setTimeout(() => setState("idle"), 2000)
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold shrink-0 border transition-all duration-200 active:scale-95 ${
        state === "copied"
          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
          : "bg-[#38bdf8]/8 border-[#38bdf8]/40 text-[#8ed5ff] hover:bg-[#38bdf8]/20 hover:border-[#38bdf8] hover:text-white"
      }`}
      style={BODY}
    >
      <span className="material-symbols-outlined text-[16px]">{state === "copied" ? "done" : "content_copy"}</span>
      <span>{state === "copied" ? "Copied!" : display}</span>
    </button>
  )
}

export default function GiftModal({
  accounts,
  giftAddress,
  giftAddressName,
  onClose,
}: {
  accounts: GiftAccountData[]
  giftAddress?: string
  giftAddressName?: string
  onClose: () => void
}) {
  return (
    <ModalShell icon="redeem" iconFill eyebrow="DENGAN PENUH SENANG HATI" title="WEDDING GIFT" onClose={onClose}>
      {accounts.map((a, i) => {
        const provider = (a.provider_name || "").trim()
        const num = (a.account_number || "").trim()
        const plain = num.replace(/[\s.-]/g, "")
        return (
          <div key={i} className="rounded-2xl p-3.5 sm:p-4 relative overflow-hidden bg-[#161b2a]/75 border border-white/5 hover:border-[#38bdf8]/35 transition-all">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-slate-400/20 to-transparent" />
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-md bg-[#005faa]/20 border border-[#005faa]/50 text-[#7bd0ff] text-[11px] font-bold tracking-wider" style={MONO}>
                {provider.toUpperCase() || (a.type || "").toUpperCase() || "BANK"}
              </span>
              <div className="w-7 h-5 rounded-[4px] bg-gradient-to-tr from-amber-600/40 via-[#f9bd22]/70 to-[#ffc640]/40 border border-[#ffc640]/40 flex items-center justify-center">
                <span className="material-symbols-outlined text-[12px] text-[#ffc640]">credit_card</span>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 mt-1">
              <div>
                <div className="text-[18px] font-semibold text-[#dee2f6] tracking-wider leading-none select-text" style={MONO}>
                  {num || "—"}
                </div>
                {a.account_name && (
                  <p className="text-[13px] font-medium text-slate-300 mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#8ed5ff]">person</span>
                    {a.account_name}
                  </p>
                )}
              </div>
              {plain && <CopyButton value={plain} display="Copy Number" />}
            </div>
          </div>
        )
      })}

      {giftAddress && (
        <div className="rounded-2xl p-3.5 sm:p-4 relative overflow-hidden bg-[#161b2a]/75 border border-white/5 hover:border-[#38bdf8]/35 transition-all">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#ffc640]">local_shipping</span>
              <span className="text-[11px] font-bold text-[#ffc640] tracking-widest uppercase" style={BODY}>
                Send Physical Gift
              </span>
            </div>
          </div>
          <div className="bg-[#090e1c]/60 rounded-xl p-3 border border-[#3e484f]/30 space-y-1.5">
            {giftAddressName && (
              <div className="flex items-center gap-1.5 text-[#dee2f6] font-semibold text-[13px]">
                <span className="material-symbols-outlined text-[15px] text-[#8ed5ff]">apartment</span>
                A.n {giftAddressName}
              </div>
            )}
            <p className="text-[12px] text-slate-300 leading-relaxed pl-1 select-text" style={BODY}>
              {giftAddress}
            </p>
          </div>
          <div className="flex items-center justify-between gap-3 mt-3 pt-1">
            <span className="text-[11px] text-slate-400 italic flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-[#ffc640]">info</span>
              Mohon konfirmasi kepada pasangan sebelum mengirim.
            </span>
            <CopyButton value={giftAddress} display="Copy Address" />
          </div>
        </div>
      )}

      <div className="rounded-2xl p-3.5 bg-gradient-to-r from-[#1a1f2e]/50 via-[#252a39]/40 to-[#1a1f2e]/50 border border-[#38bdf8]/20 text-center">
        <span className="material-symbols-outlined text-[18px] text-[#ffc640]" style={{ fontVariationSettings: "'FILL' 1" }}>
          favorite
        </span>
        <p className="text-[15px] text-[#dee2f6] font-medium italic mt-1.5" style={DISPLAY}>
          &ldquo;Terima kasih atas doa restu &amp; tanda kasih Anda&rdquo;
        </p>
      </div>
    </ModalShell>
  )
}