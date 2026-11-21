"use client"

import type { TemplateProps } from "@/types/template"
import { normalizeLanguage, t } from "@/lib/i18n"
import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
import { normalizeVideoUrl, type GiftAccountData } from "../../shared/lib"
import { CopyButton } from "../../shared/CopyButton"

export default function CombinedPage({
  profile,
  accounts,
  families,
  videoOn,
  giftOn,
  invitingOn,
}: {
  profile: TemplateProps
  accounts: GiftAccountData[]
  families: string[]
  videoOn: boolean
  giftOn: boolean
  invitingOn: boolean
}) {
  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const lang = normalizeLanguage(profile.language)

  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto px-4 pt-3 pb-16 space-y-4">
      {videoOn && videoEmbed && (
        <article className="relative overflow-hidden rounded-[28px] p-5 bg-[#FFFDF8]/[0.88] backdrop-blur-md border border-[#d4af37]/35 shadow-[0_10px_30px_-5px_rgba(58,41,16,0.12)]">
          <div className="absolute inset-2 rounded-[22px] border border-[#d4af37]/25 pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 mb-2.5 px-3 py-0.5 rounded-full bg-[#faebd7]/70 border border-[#d4af37]/25">
            <span className="material-symbols-outlined text-[#8E6B3D] text-[14px]">videocam</span>
            <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ ...FONT_BODY, color: "#8E6B3D" }}>
              {lang === "en" ? "Our Footage" : "Rekaman Kami"}
            </span>
          </div>
          <h2 className="italic text-[22px] font-bold tracking-tight mb-2" style={{ ...FONT_DISPLAY, color: "#221C16" }}>
            {lang === "en" ? "Our Sacred Moments" : "Momen Suci Kami"}
          </h2>
          <div className="relative rounded-2xl overflow-hidden border border-[#d4af37]/35 bg-black/90 aspect-video">
            <iframe
              src={`${videoEmbed}${videoEmbed.includes("?") ? "&" : "?"}autoplay=0&rel=0&playsinline=1`}
              title={lang === "en" ? "Video Teaser" : "Video Teaser"}
              className="w-full h-full border-0"
              allow="encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </article>
      )}

      {invitingOn && (
        <article className="relative overflow-hidden rounded-[28px] p-5 bg-[#FFFDF8]/[0.88] backdrop-blur-md border border-[#d4af37]/35 shadow-[0_10px_30px_-5px_rgba(58,41,16,0.12)]">
          <div className="absolute inset-2 rounded-[22px] border border-[#d4af37]/25 pointer-events-none" />
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 mb-2 px-3 py-0.5 rounded-full bg-[#faebd7]/70 border border-[#d4af37]/25">
              <span className="material-symbols-outlined text-[#8E6B3D] text-[14px]">group</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ ...FONT_BODY, color: "#8E6B3D" }}>
                {lang === "en" ? "Our Family" : "Keluarga Besar"}
              </span>
            </div>
            <h2 className="italic text-[22px] font-bold tracking-tight" style={{ ...FONT_DISPLAY, color: "#221C16" }}>
              {t("secInviting", lang)}
            </h2>
          </div>
          <div className="bg-white/95 rounded-2xl p-4 border border-[#d4af37]/35 shadow-sm">
            <ul className="text-[13px] leading-relaxed space-y-1" style={{ ...FONT_BODY, color: "#574E45" }}>
              {families.map((f, i) => (
                <li key={i}>• {f}</li>
              ))}
            </ul>
          </div>
        </article>
      )}

      {giftOn && (
        <article className="relative overflow-hidden rounded-[28px] p-5 bg-[#FFFDF8]/[0.88] backdrop-blur-md border border-[#d4af37]/35 shadow-[0_10px_30px_-5px_rgba(58,41,16,0.12)]">
          <div className="absolute inset-2 rounded-[22px] border border-[#d4af37]/25 pointer-events-none" />
          <div className="text-center mb-3">
            <div className="inline-flex items-center gap-1.5 mb-2 px-3 py-0.5 rounded-full bg-[#faebd7]/70 border border-[#d4af37]/25">
              <span className="material-symbols-outlined text-[#8E6B3D] text-[14px]">featured_seasonal_and_gifts</span>
              <span className="text-[11px] font-semibold tracking-widest uppercase" style={{ ...FONT_BODY, color: "#8E6B3D" }}>
                {lang === "en" ? "Digital Envelope & Gifts" : "Amplop Digital & Hadiah"}
              </span>
            </div>
            <h2 className="italic font-bold text-[21px]" style={{ ...FONT_DISPLAY, color: "#221C16" }}>
              {t("secGift", lang)}
            </h2>
          </div>
          <div className="space-y-3">
            {accounts.map((a, i) => {
              const num = (a.account_number || "").trim()
              const plain = num.replace(/[\s.-]/g, "")
              return (
                <div key={i} className="bg-white/95 rounded-2xl p-4 border border-[#d4af37]/35 shadow-sm">
                  <p className="text-[11px] uppercase font-semibold tracking-wider mb-1" style={{ ...FONT_BODY, color: "#574E45" }}>
                    {a.provider_name || "Bank"}
                  </p>
                  <p className="text-[20px] font-bold tracking-wider" style={{ ...FONT_DISPLAY, color: "#b37a56" }}>
                    {num || ", "}
                  </p>
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2.5 border-t border-[#d4af37]/20">
                    <p className="text-[13px] font-medium" style={{ ...FONT_BODY, color: "#221C16" }}>
                      a.n. {a.account_name || ", "}
                    </p>
                    {plain && (
                      <CopyButton
                        copyKey={`pc-gift-${i}`}
                        value={plain}
                        display={t("copy", lang)}
                        copiedDisplay={t("copied", lang)}
                        className="bg-[linear-gradient(135deg,#df8268,#b37a56)] text-white font-semibold text-[12px] px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 shrink-0 transition active:scale-95 shadow-[0_4px_14px_rgba(179,122,86,0.35)]"
                        iconClassName="text-[15px]"
                      />
                    )}
                  </div>
                </div>
              )
            })}
            {profile.gift_address && (
              <div className="bg-white/95 rounded-2xl p-4 border border-[#d4af37]/35 shadow-sm">
                <p className="font-bold text-[15px] leading-tight" style={{ ...FONT_DISPLAY, color: "#221C16" }}>
                  {lang === "en" ? "Send a Physical Gift" : "Kirim Kado Fisik"}
                </p>
                <p className="text-[13px] leading-relaxed mt-1" style={{ ...FONT_BODY, color: "#574E45" }}>
                  {profile.gift_address_name ? `${profile.gift_address_name}, ` : ""}{profile.gift_address}
                </p>
                <CopyButton
                  copyKey="pc-gift-address"
                  value={profile.gift_address}
                  display={t("copyAddress", lang)}
                  copiedDisplay={t("copied", lang)}
                  className="bg-[linear-gradient(135deg,#df8268,#b37a56)] mt-2 w-full py-2 rounded-lg text-white font-semibold text-[12px] inline-flex items-center justify-center gap-1.5 transition active:scale-95 shadow-[0_4px_14px_rgba(179,122,86,0.35)]"
                  iconClassName="text-[15px]"
                />
              </div>
            )}
          </div>
        </article>
      )}
    </div>
  )
}
