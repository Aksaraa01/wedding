"use client"

import { useEffect } from "react"
import { CopyButton } from "../shared/CopyButton"
import type { GiftAccountData } from "../shared/lib"
import { FONT_BODY, FONT_CLOSE, FONT_GIFT } from "./fonts"

type Props = {
  accounts: GiftAccountData[]
  giftAddress?: string
  giftAddressName?: string
  onClose: () => void
}

export default function GiftPopup({ accounts, giftAddress, giftAddressName, onClose }: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const list = accounts.filter((a) => a && (a.account_number || a.provider_name))

  return (
    <div className="fixed inset-0 z-[1003]">
      <button
        type="button"
        aria-label="Tutup"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-[450px] overflow-y-auto bg-[#F2F1EE] text-[#1B1B18] shadow-2xl">
        <button
          type="button"
          aria-label="Tutup"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 text-[#1B1B18]"
          style={FONT_CLOSE}
        >
          <span className="text-[34px] leading-none">&times;</span>
        </button>

        <div className="px-6 py-12" style={FONT_GIFT}>
          <h2 className="text-center text-[26px] font-medium uppercase" style={{ letterSpacing: "2px" }}>
            Wedding Gift
          </h2>
          <p className="mt-3 text-center text-[13px] leading-relaxed text-[#1B1B18]/70" style={FONT_BODY}>
            Tanpa mengurangi rasa hormat, bagi Anda yang ingin memberikan tanda kasih untuk kami, dapat melalui:
          </p>

          <div className="mt-8 space-y-5">
            {list.map((a, i) => {
              const num = (a.account_number || "").trim()
              const plain = num.replace(/[\s.-]/g, "")
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-[10px] bg-[#1B1B18] px-5 py-5 text-[#F2F1EE]"
                  style={{ boxShadow: "2px 2px 5px -2px rgba(0,0,0,0.5)" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] font-semibold uppercase" style={{ letterSpacing: "1px" }}>
                      {a.provider_name || (a.type || "").toUpperCase() || "Bank"}
                    </span>
                    <span className="material-symbols-outlined text-[22px] text-[#F2F1EE]/70">credit_card</span>
                  </div>
                  <p className="mt-5 text-[22px] font-semibold tracking-wider select-text">{num || "—"}</p>
                  {a.account_name && <p className="mt-1 text-[13px] text-[#F2F1EE]/80">{a.account_name}</p>}
                  {plain && (
                    <CopyButton
                      copyKey={`acct-${i}`}
                      value={plain}
                      display="Salin No. Rekening"
                      className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#F2F1EE]/40 px-4 py-1.5 text-[12px] text-[#F2F1EE] transition-colors hover:bg-[#F2F1EE]/10"
                    />
                  )}
                </div>
              )
            })}

            {giftAddress && (
              <div className="rounded-[10px] border border-[#1B1B18]/15 bg-white/70 px-5 py-5">
                <span className="text-[13px] font-semibold uppercase" style={{ letterSpacing: "1px" }}>
                  Kirim Kado
                </span>
                {giftAddressName && <p className="mt-2 text-[14px] font-medium">a.n. {giftAddressName}</p>}
                <p className="mt-1 text-[13px] leading-relaxed text-[#1B1B18]/80 select-text" style={FONT_BODY}>
                  {giftAddress}
                </p>
                <CopyButton
                  copyKey="gift-addr"
                  value={giftAddress}
                  display="Salin Alamat"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#1B1B18]/30 px-4 py-1.5 text-[12px] transition-colors hover:bg-[#1B1B18]/5"
                />
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-[13px] italic text-[#1B1B18]/70" style={FONT_BODY}>
            Terima kasih atas doa restu &amp; tanda kasih Anda.
          </p>
        </div>
      </div>
    </div>
  )
}
