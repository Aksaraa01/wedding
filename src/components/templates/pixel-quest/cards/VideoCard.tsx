"use client"

import { normalizeLanguage, t } from "@/lib/i18n"
import { FONT_PIXEL } from "../../shared/Skin"
import CardShell from "./CardShell"

export type VideoCardData = { state: "ready"; videoUrl: string } | { state: "none" } | { state: "loading" }

// Autoplay teaser (pixel lesson: no poster step — the video starts immediately).
export default function VideoCard({ data, title, content, onHide, language = "id" }: { data: VideoCardData | null; title: string; content?: Record<string, string>; onHide: () => void; language?: string }) {
  const lang = normalizeLanguage(language)
  const tc = content || {}
  if (!data) return null
  return (
    <CardShell icon="movie" eyebrow="CINEMA TEASER" title={tc.livestream_title || t("secVideo", lang)} badge="4K HD" badgeClassName="bg-pink-950/80 border-pink-500/40 text-pink-400" onHide={onHide}>
      {data.state === "loading" ? (
        <p className="text-center text-sm text-slate-400">{lang === "en" ? "Loading video…" : "Memuat video…"}</p>
      ) : data.state === "none" ? (
        <p className="text-center text-sm text-slate-400">{lang === "en" ? "Video not available yet." : "Video belum tersedia."}</p>
      ) : (
        <>
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-cyan-400/50 bg-black shadow-[0_4px_24px_rgba(0,0,0,0.7),0_0_20px_rgba(56,189,248,0.2)]">
            <iframe
              src={`${data.videoUrl}${data.videoUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0&playsinline=1`}
              title="Video Teaser"
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="rounded-xl bg-[#090e1c]/90 border border-dashed border-cyan-400/40 p-2.5 text-center">
            <h4 className="text-[9px] text-white" style={FONT_PIXEL}>{title}</h4>
          </div>
        </>
      )}
    </CardShell>
  )
}