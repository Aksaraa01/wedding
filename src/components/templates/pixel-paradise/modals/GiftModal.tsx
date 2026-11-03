"use client"

import { useState } from "react"
import type { TemplateProps } from "@/types/template"
import { FONT_BODY, FONT_PIXEL } from "../../shared/Skin"
import type { GiftAccountData } from "../../shared/lib"
import ModalShell from "./ModalShell"

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
      className={`px-3 py-2 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold shrink-0 border-2 transition-all active:scale-95 ${
        state === "copied"
          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300"
          : "bg-[#38bdf8]/10 border-[#38bdf8]/50 text-[#8ed5ff] shadow-[0_0_12px_rgba(56,189,248,0.3)] hover:bg-[#38bdf8]/25 hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined text-[16px]">{state === "copied" ? "check" : "content_copy"}</span>
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
    <ModalShell
      icon="featured_seasonal_and_gifts"
      iconColor="pink"
      eyebrow="GIFT SHOP"
      eyebrowColor="cyan"
      title="WEDDING GIFT ♥"
      onClose={onClose}
    >
      {accounts.map((a, i) => {
        const provider = (a.provider_name || "").trim()
        const num = (a.account_number || "").trim()
        const plain = num.replace(/[\s.-]/g, "")
        return (
          <div key={i} className="relative rounded-2xl p-3.5 sm:p-4 overflow-hidden bg-[#161b2a]/75 border-2 border-[#38bdf8]/40 group">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#38bdf8] via-[#f472b6] to-[#38bdf8] opacity-80" />
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded bg-[#005faa]/30 border border-[#38bdf8]/60 text-[#7bd0ff] text-[11px] font-bold tracking-wider shadow-[0_0_10px_rgba(56,189,248,0.25)]" style={MONO}>
                {provider.toUpperCase() || (a.type || "").toUpperCase() || "BANK"}
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 mt-1">
              <div>
                <div className="text-[19px] font-semibold text-[#8ed5ff] tracking-wider leading-none select-text" style={{ ...MONO, textShadow: "0 0 8px rgba(142,213,255,0.4)" }}>
                  {num || ", "}
                </div>
                {a.account_name && (
                  <p className="text-[13px] font-medium text-slate-200 mt-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-[#f472b6]">sports_esports</span>
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
        <div className="rounded-2xl p-3.5 sm:p-4 bg-[#161b2a]/75 border-2 border-[#f472b6]/40 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/40 flex items-center justify-center text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.25)]">
                <span className="material-symbols-outlined text-[15px]">local_shipping</span>
              </span>
              <span className="text-[10px] font-bold text-pink-300 tracking-wider" style={FONT_PIXEL}>
                ADDRESS
              </span>
            </div>
            <span className="text-[9px] text-[#ffc640] border border-[#ffc640]/40 px-1.5 py-0.5 rounded bg-[#ffc640]/10 font-bold" style={MONO}>
              PHYSICAL
            </span>
          </div>
          <div className="bg-[#090e1c]/80 rounded-xl p-3 border border-[#3e484f]/40 space-y-1.5">
            {giftAddressName && (
              <div className="flex items-center gap-1.5 text-[#dee2f6] font-semibold text-[13px]">
                <span className="material-symbols-outlined text-[15px] text-[#38bdf8]">home_pin</span>
                A.n {giftAddressName}
              </div>
            )}
            <p className="text-[12px] text-slate-300 leading-relaxed pl-1 select-text">{giftAddress}</p>
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
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-500/15 border border-pink-400/40 text-pink-400 mb-1.5 shadow-[0_0_12px_rgba(244,114,182,0.35)]">
          <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </div>
        <div className="text-[10px] text-pink-300 font-bold mb-1 tracking-widest" style={FONT_PIXEL}>
          THANK YOU
        </div>
        <p className="text-[13px] text-slate-200" style={FONT_BODY}>
          Terima kasih atas doa restu &amp; tanda kasih Anda untuk petualangan baru kami.
        </p>
      </div>
    </ModalShell>
  )
}