"use client"

import { FONT_PIXEL } from "../../shared/Skin"
import ModalShell from "./ModalShell"

const BULLETS = ["text-[#f472b6]", "text-[#38bdf8]", "text-[#ffc640]"]

export default function FamilyModal({ families, onClose, language }: { families: string[]; onClose: () => void; language?: string }) {
  const lang = language === "en" ? "en" : "id"
  if (!families || families.length === 0) return null
  return (
    <ModalShell icon="videogame_asset" iconColor="pink" eyebrow="FAMILY HONORS" eyebrowColor="cyan" title={lang === "en" ? "WITH THE BLESSING OF" : "TURUT MENGUNDANG"} onClose={onClose}>
      <div className="text-center px-2 py-1 bg-[#090e1c]/80 border border-[#38bdf8]/30 rounded-xl">
        <p className="text-[10px] text-[#38bdf8] tracking-widest uppercase" style={{ ...FONT_PIXEL, lineHeight: 1.6 }}>
          {lang === "en" ? "✦ WITH THE BLESSING OF OUR FAMILIES ✦" : "✦ KELUARGA BESAR TURUT MENGUNDANG ✦"}
        </p>
      </div>
      <div className="bg-[#090e1c]/95 rounded-2xl p-5 border-2 border-[#38bdf8] shadow-[0_0_18px_rgba(56,189,248,0.25)] relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-24 h-24 bg-[#f472b6]/20 rounded-full blur-xl pointer-events-none" />
        <div className="divide-y divide-[#3e484f]/20 flex flex-col">
          {families.map((f, i) => (
            <div key={i} className="py-3 flex items-start gap-3">
              <span className={`text-xs mt-0.5 ${BULLETS[i % BULLETS.length]}`}>►</span>
              <p className="text-[13px] text-[#dee2f6] font-medium leading-relaxed tracking-wide">{f}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl p-4 bg-[#090e1c]/90 border border-[#f472b6]/40 text-center shadow-[0_0_16px_rgba(244,114,182,0.18)]">
        <div className="flex justify-center items-center gap-2 mb-2 text-[#f472b6]">
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          <span className="text-[9px] uppercase tracking-wider" style={FONT_PIXEL}>
            THANK YOU
          </span>
          <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </div>
        <p className="text-[14px] text-[#bdc8d1] italic leading-relaxed">
          “Ungkapan terima kasih yang tulus dari segenap keluarga besar kedua mempelai atas doa, perhatian, dan kehadiran Anda.”
        </p>
      </div>
    </ModalShell>
  )
}