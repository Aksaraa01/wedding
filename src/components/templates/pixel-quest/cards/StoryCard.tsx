"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import type { StoryData } from "../../shared/lib"
import CardShell from "./CardShell"

const ACCENTS = [
  { text: "text-cyan-300", border: "border-cyan-400/40", bar: "bg-cyan-400" },
  { text: "text-pink-300", border: "border-pink-400/40", bar: "bg-pink-400" },
  { text: "text-amber-300", border: "border-amber-400/40", bar: "bg-amber-400" },
]

export default function StoryCard({ profile, onHide }: { profile: TemplateProps; onHide: () => void }) {
  const stories: StoryData[] = Array.isArray(profile.stories) ? profile.stories : []
  return (
    <CardShell icon="videogame_asset" iconClassName="bg-pink-500/20 border-pink-400/50 text-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.4)]" eyebrow="STOP 1: TIMELINE" title="Metropolitan Love Story" badge="MEMORIES" badgeClassName="bg-pink-950/80 border-pink-500/40 text-pink-400" onHide={onHide}>
      {stories.map((s, i) => {
        const a = ACCENTS[i % ACCENTS.length]
        return (
          <div key={i} className={`rounded-xl bg-[#090e1c]/90 border ${a.border} p-2.5 relative pl-3.5`}>
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${a.bar}`} />
            <div className="flex items-center justify-between gap-1">
              <span className={`text-[8px] ${a.text}`} style={FONT_PIXEL}>
                {`LVL ${String(i + 1).padStart(2, "0")}: ${(s.title || "MEMORY").toUpperCase()}`}
              </span>
            </div>
            {s.image_url && (
              <div className="mt-1.5 w-full aspect-[16/9] rounded-lg overflow-hidden border border-white/10 bg-[#05070c]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image_url} alt={s.title || ""} className="w-full h-full object-contain" loading="lazy" />
              </div>
            )}
            {s.description && <p className="text-[11px] text-slate-300 leading-relaxed mt-1">{s.description}</p>}
          </div>
        )
      })}
    </CardShell>
  )
}