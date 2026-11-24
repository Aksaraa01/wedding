"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import type { GiftAccountData } from "../../shared/lib"
import { CopyButton } from "../../shared/CopyButton"
import CardShell from "./CardShell"
import { t } from "@/lib/i18n"

export default function GiftCard({
  lang = "id",
  accounts,
  giftAddress,
  giftAddressName,
  content,
  onHide,
}: {
  lang?: "id" | "en"
  accounts: GiftAccountData[]
  giftAddress?: string
  giftAddressName?: string
  content?: Record<string, string>
  onHide: () => void
}) {
  const tc = content || {}
  return (
    <CardShell icon="featured_seasonal_and_gifts" iconClassName="bg-amber-500/20 border-amber-400/50 text-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]" eyebrow="FINAL STAGE: COMPLETE" title={tc.gift_intro_title || t("secGift", lang)} badge="FINISH" badgeClassName="bg-amber-950/80 border-amber-500/40 text-amber-400" onHide={onHide}>
      <div className="rounded-xl bg-[#090e1c]/90 border border-cyan-400/40 p-2.5 text-center">
        <p className="text-[11px] text-slate-300 leading-snug">
          {tc.gift_intro_description || (lang === "en" ? "Your blessings are the greatest gift. If you wish to send a token of love:" : "Doa restu Anda merupakan karunia terindah bagi kami. Jika ingin memberikan tanda kasih secara cashless:")}
        </p>
      </div>
      {accounts.map((a, i) => {
        const cyan = i % 2 === 0
        const num = (a.account_number || "").trim()
        const plain = num.replace(/[\s.-]/g, "")
        return (
          <div key={i} className={`rounded-xl bg-[#090e1c]/95 border-2 ${cyan ? "border-cyan-400/50 shadow-[0_0_12px_rgba(56,189,248,0.2)]" : "border-pink-400/50 shadow-[0_0_12px_rgba(244,114,182,0.2)]"} p-3 relative`}>
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[10px] tracking-wider ${cyan ? "text-cyan-300" : "text-pink-300"}`} style={FONT_PIXEL}>
                {((a.provider_name || a.type || "BANK").trim().toUpperCase())}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-700 gap-2">
              <div className="min-w-0">
                <span className="font-mono text-xs font-bold text-white tracking-widest block truncate">{num || ", "}</span>
                {a.account_name && <span className="text-[9px] text-slate-400 truncate block">a.n {a.account_name}</span>}
              </div>
              {plain && (
                <CopyButton
                  copyKey={`gift-${i}`}
                  value={plain}
                  display={lang === "en" ? "COPY" : "SALIN"}
                  copiedDisplay={lang === "en" ? "COPIED" : "TERSALIN"}
                  className={`px-2.5 py-1 rounded-md text-slate-950 text-[8px] font-bold transition active:scale-90 flex items-center gap-1 shrink-0 ${cyan ? "bg-cyan-500 hover:bg-cyan-400" : "bg-pink-500 hover:bg-pink-400"}`}
                  iconClassName="text-[12px]"
                />
              )}
            </div>
          </div>
        )
      })}
      {giftAddress && (
        <div className="rounded-xl bg-[#090e1c]/90 border border-dashed border-cyan-400/40 p-2.5">
          <div className="flex items-center gap-1.5 text-cyan-300 mb-1">
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            <span className="text-[8px] uppercase tracking-wider" style={FONT_PIXEL}>{lang === "en" ? "SHIP A GIFT" : "KIRIM KADO FISIK"}</span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed">
            {giftAddress}
            {giftAddressName ? ` (Penerima: ${giftAddressName})` : ""}
          </p>
          <CopyButton
            copyKey="gift-address"
            value={giftAddress}
            display={lang === "en" ? "COPY ADDRESS" : "SALIN ALAMAT"}
            copiedDisplay={lang === "en" ? "COPIED" : "TERSALIN"}
            className="mt-2 w-full py-2 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-300 text-[8px] tracking-wider flex items-center justify-center gap-1.5 transition active:scale-95"
            iconClassName="text-[14px]"
          />
        </div>
      )}
    </CardShell>
  )
}

// Re-exported for the template shell (keeps the gift wiring in one place).
export function giftAccountsOf(profile: TemplateProps): GiftAccountData[] {
  return Array.isArray(profile.gift_accounts) ? profile.gift_accounts : []
}