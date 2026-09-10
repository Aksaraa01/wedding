"use client"

import { FONT_DISPLAY, FONT_PIXEL } from "../../shared/Skin"
import CardShell from "./CardShell"

export type VideoCardData = { state: "ready"; videoUrl: string } | { state: "none" } | { state: "loading" }

// Autoplay teaser (pixel lesson: no poster step — the video starts immediately).
export default function VideoCard({ data, title, quote, onHide }: { data: VideoCardData | null; title: string; quote?: string; onHide: () => void }) {
  if (!data) return null
  return (
    <CardShell icon="movie" eyebrow="CINEMA TEASER" title="Our Story Video" badge="4K HD" badgeClassName="bg-pink-950/80 border-pink-500/40 text-pink-400" onHide={onHide}>
      {data.state === "loading" ? (
        <p className="text-center text-sm text-slate-400">Memuat video…</p>
      ) : data.state === "none" ? (
        <p className="text-center text-sm text-slate-400">Video belum tersedia.</p>
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
            {quote && (
              <p className="italic text-[11px] text-slate-300 mt-1" style={FONT_DISPLAY}>
                &ldquo;{quote}&rdquo;
              </p>
            )}
          </div>
        </>
      )}
    </CardShell>
  )
}