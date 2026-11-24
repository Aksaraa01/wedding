"use client"

import type { TemplateProps } from "@/types/template"
import ModalShell from "./ModalShell"
import type { StoryData } from "../lib"
import { normalizeLanguage } from "@/lib/i18n"

const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const
const DISPLAY = { fontFamily: "var(--font-display, 'Playfair Display'), serif" } as const

function Milestone({ story }: { story: StoryData }) {
  return (
    <div className="relative flex items-start gap-3">
      <div className="relative flex-shrink-0 flex items-center justify-center w-8 h-8 mt-1">
        <span className="absolute w-5 h-5 rounded-full bg-[#38bdf8]/30 animate-ping" />
        <span className="relative w-4 h-4 rounded-full bg-[#090e1c] border-2 border-[#38bdf8] shadow-[0_0_10px_#38bdf8,0_0_20px_rgba(56,189,248,0.7)]" />
      </div>
      <div className="flex-1 rounded-2xl bg-[#1a1f2e]/70 border border-[#3e484f]/30 p-3 hover:border-[#38bdf8]/50 transition-all duration-200">
        {story.title && (
          <div className="mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-[#c4e7ff] text-[10px] font-bold tracking-wide" style={BODY}>
              {story.title}
            </span>
          </div>
        )}
        {story.image_url && (
          <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-[#38bdf8]/30 mb-2 bg-[#090e1c]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={story.image_url} alt={story.title || ""} className="w-full h-full object-contain" loading="lazy" />
          </div>
        )}
        {story.description && (
          <p className="text-[#bdc8d1] text-xs leading-relaxed" style={BODY}>
            {story.description}
          </p>
        )}
      </div>
    </div>
  )
}

export default function StoryModal({ profile, templateContent, onClose }: { profile: TemplateProps; templateContent?: Record<string, string>; onClose: () => void }) {
  const stories: StoryData[] = Array.isArray(profile.stories) ? profile.stories : []
  const lang = normalizeLanguage(profile.language)
  const tc = templateContent || {}
  return (
    <ModalShell icon="auto_stories" iconFill eyebrow="OUR JOURNEY" title={tc.love_story_title || (lang === "en" ? "OUR LOVE STORY" : "KISAH CINTA KAMI")} onClose={onClose}>
      <div className="space-y-5 relative">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[#38bdf8]/30" />
        {stories.map((s, i) => (
          <Milestone key={i} story={s} />
        ))}
      </div>
    </ModalShell>
  )
}