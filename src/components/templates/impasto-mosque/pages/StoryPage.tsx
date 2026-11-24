"use client"

import { FONT_BODY, FONT_DISPLAY } from "../../shared/Skin"
import type { StoryData } from "../../shared/lib"

export default function StoryPage({ stories, content }: { stories: StoryData[]; content?: Record<string, string> }) {
  const tc = content || {}
  return (
    <div className="flex-1 w-full max-w-[370px] mx-auto px-1 pt-2 pb-16">
      <div className="text-center mb-5 flex flex-col items-center">
        <h1 className="text-[26px] font-bold tracking-tight" style={{ ...FONT_DISPLAY, color: "#8C6212" }}>
          {tc.love_story_title || "Our Journey"}
        </h1>
        <div className="flex items-center justify-center gap-3 w-48 mt-3 text-[#d4af37]/50">
          <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#d4af37]/40" />
          <span className="material-symbols-outlined text-[14px] text-[#d4af37]">stars</span>
          <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#d4af37]/40" />
        </div>
      </div>
      <div className="relative pl-6">
        <div className="absolute left-2 top-4 bottom-10 w-[2px] bg-gradient-to-b from-[#d4af37] via-[#d4af37]/60 to-[#d4af37]/10" />
        {stories.map((s, i) => (
          <article key={i} className="relative mb-5">
            <div className="absolute -left-6 top-6 transform -translate-x-1/2 flex items-center justify-center">
              <div className="w-5 h-5 rounded-full bg-[#FFFCF3] border-2 border-[#d4af37] flex items-center justify-center shadow-[0_0_12px_rgba(242,202,80,0.5)]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#d4af37] im-gold-pulse" />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl bg-[#FFFCF3]/85 backdrop-blur-md border border-[#d4af37]/35 p-4 shadow-[0_16px_35px_-8px_rgba(0,0,0,0.15),0_0_20px_0_rgba(212,175,55,0.2)]">
              <div className="absolute inset-1.5 rounded-[20px] border border-dashed border-[#d4af37]/30 pointer-events-none" />
              {s.image_url && (
                <div className="rounded-[120px_120px_1.5rem_1.5rem] overflow-hidden relative border border-[#d4af37]/35 p-1 shadow-inner mb-3 bg-[#f7f4ee]">
                  <div className="rounded-[110px_110px_1rem_1rem] overflow-hidden w-full h-56">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.image_url} alt={s.title || ""} loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                  </div>
                </div>
              )}
              <div className="space-y-1.5">
                <h2 className="text-[18px] font-semibold" style={{ ...FONT_DISPLAY, color: "#8C6212" }}>
                  {s.title || `Kisah ${i + 1}`}
                </h2>
                {s.description && (
                  <p className="text-[14px] font-medium leading-relaxed" style={{ ...FONT_BODY, color: "#2A2118" }}>
                    {s.description}
                  </p>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
