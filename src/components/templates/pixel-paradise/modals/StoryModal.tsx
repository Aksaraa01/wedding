"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import type { StoryData } from "../../shared/lib"
import { toTransformedUrl } from "@/lib/storageUrl"
import ModalShell from "./ModalShell"
import { normalizeLanguage } from "@/lib/i18n"

function Milestone({ story, i }: { story: StoryData; i: number }) {
  const pink = i % 2 === 0
  const accent = pink ? "#f472b6" : "#38bdf8"
  return (
    <div className="relative flex items-start gap-3">
      <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 mt-1">
        <span
          className={`absolute w-6 h-6 rounded-full animate-ping ${pink ? "bg-[#f472b6]/30" : "bg-[#38bdf8]/30"}`}
        />
        <span
          className="relative w-5 h-5 rounded-full bg-[#090e1c] border-2 flex items-center justify-center"
          style={{ borderColor: accent, boxShadow: `0 0 10px ${accent}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent }} />
        </span>
      </div>
      <div
        className={`flex-1 rounded-xl bg-[#1a1f2e]/75 border p-3 backdrop-blur-md ${pink ? "border-[#f472b6]/40" : "border-[#38bdf8]/40"}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={`px-2.5 py-1 rounded-md text-[9px] ${pink ? "bg-[#f472b6]/20 border-[#f472b6]/50 text-[#f472b6]" : "bg-[#38bdf8]/20 border-[#38bdf8]/50 text-[#c4e7ff]"}`}
            style={{ ...FONT_PIXEL, boxShadow: `0 0 8px ${accent}66` }}
          >
            {`LVL ${String(i + 1).padStart(2, "0")} // ${(story.title || "LEVEL").toUpperCase()}`}
          </span>
        </div>
        {story.image_url && (
          <div className="w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10 mb-2 bg-[#090e1c]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={toTransformedUrl(story.image_url, { width: 600 })} alt={story.title || ""} className="w-full h-full object-contain" loading="lazy" />
          </div>
        )}
        {story.description && (
          <p className="text-[12px] leading-relaxed text-[#bdc8d1]">{story.description}</p>
        )}
      </div>
    </div>
  )
}

export default function StoryModal({ profile, onClose }: { profile: TemplateProps; onClose: () => void }) {
  const lang = normalizeLanguage(profile.language)
  const stories: StoryData[] = Array.isArray(profile.stories) ? profile.stories : []
  return (
    <ModalShell icon="sports_esports" iconColor="pink" eyebrow="PIXEL LOVE • STAGE LOG" eyebrowColor="pink" title={lang === "en" ? "OUR LOVE STORY" : "KISAH CINTA KAMI"} onClose={onClose}>
      <div className="space-y-5">
        {stories.map((s, i) => (
          <Milestone key={i} story={s} i={i} />
        ))}
      </div>
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-on-surface-variant">
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-[#f472b6] rounded-sm" />
          <span className="text-[8px] text-[#f472b6] tracking-wider" style={FONT_PIXEL}>
            PLAYER 1 &amp; PLAYER 2 READY
          </span>
        </span>
        <span className="text-[8px] text-[#38bdf8] tracking-widest" style={FONT_PIXEL}>
          PRESS START 2026
        </span>
      </div>
    </ModalShell>
  )
}