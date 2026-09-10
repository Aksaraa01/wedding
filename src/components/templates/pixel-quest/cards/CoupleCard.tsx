"use client"

import type { TemplateProps } from "@/types/template"
import { FONT_PIXEL } from "../../shared/Skin"
import { initialsOf, photoList } from "../../shared/lib"
import CardShell from "./CardShell"

export default function CoupleCard({ profile, onHide }: { profile: TemplateProps; onHide: () => void }) {
  const groomPhoto = photoList(profile.groom_photo_url)[0]
  const bridePhoto = photoList(profile.bride_photo_url)[0]
  const groomTag = initialsOf(profile.groom_name)
  const brideTag = initialsOf(profile.bride_name)

  const person = (
    key: "groom" | "bride",
    photo: string | undefined,
    tag: string,
    fullName: string | undefined,
    shortName: string | undefined,
    parents: string | undefined,
    parentsLabel: string,
  ) => {
    const cyan = key === "groom"
    return (
      <div className={`rounded-xl bg-[#090e1c]/90 border ${cyan ? "border-cyan-400/40" : "border-pink-400/40"} p-2.5 flex items-center gap-3`}>
        {photo ? (
          <div className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border ${cyan ? "border-cyan-400" : "border-pink-400"} bg-slate-900`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo} alt={fullName || ""} className="w-full h-full object-contain" loading="lazy" />
          </div>
        ) : (
          <div className={`shrink-0 w-20 h-20 rounded-xl bg-cyan-500/20 border ${cyan ? "border-cyan-400 text-cyan-300" : "border-pink-400 text-pink-300"} flex items-center justify-center text-xs shadow-[0_0_10px_rgba(56,189,248,0.4)]`} style={FONT_PIXEL}>
            {tag || "P1"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="text-[10px] text-white truncate" style={FONT_PIXEL}>
              {fullName || shortName || "Mempelai"}
            </h3>
            <span className={`text-[8px] shrink-0 ${cyan ? "text-cyan-400" : "text-pink-400"}`}>
              {key === "groom" ? "P1 GROOM" : "P2 BRIDE"}
            </span>
          </div>
          {parents && (
            <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
              {parentsLabel} {parents}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <CardShell icon="favorite" eyebrow="STAGE: SOULMATES" title="The Bride & The Groom" badge="LVL.100" onHide={onHide}>
      {person("groom", groomPhoto, groomTag, profile.groom_full_name || undefined, profile.groom_name || undefined, profile.groom_parents || undefined, "Putra dari")}
      <div className="flex items-center justify-center">
        <div className="flex-grow border-t border-dashed border-slate-700/80" />
        <div className="mx-2.5 px-2.5 py-0.5 rounded-full bg-[#161b2a] border border-pink-400/50 text-[9px] font-bold text-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.35)] flex items-center gap-1" style={FONT_PIXEL}>
          <span className="material-symbols-outlined text-[12px] animate-pulse">favorite</span>
          CO-OP MODE
        </div>
        <div className="flex-grow border-t border-dashed border-slate-700/80" />
      </div>
      {person("bride", bridePhoto, brideTag, profile.bride_full_name || undefined, profile.bride_name || undefined, profile.bride_parents || undefined, "Putri dari")}
      {profile.quote_text && (
        <div className="rounded-xl bg-[#090e1c]/90 border border-dashed border-cyan-400/40 p-2.5 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <span className="material-symbols-outlined text-[12px] text-cyan-400">chat</span>
            <span className="text-[8px] font-bold tracking-widest text-cyan-300 uppercase" style={FONT_PIXEL}>
              {profile.quote_source || "AR-RUM: 21"}
            </span>
          </div>
          <p className="italic text-[11px] text-slate-200 leading-snug">&ldquo;{profile.quote_text}&rdquo;</p>
        </div>
      )}
      <div className="bg-[#05070c]/70 rounded-xl p-2 border border-slate-700/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="material-symbols-outlined text-pink-400 text-sm shrink-0">favorite</span>
          <span className="text-[10px] text-slate-300 truncate">
            Kepada Yth: <strong className="text-white font-semibold">{profile.guest_name || "Tamu Undangan"}</strong>
          </span>
        </div>
        <span className="text-[8px] text-cyan-400 shrink-0" style={FONT_PIXEL}>INVITED</span>
      </div>
    </CardShell>
  )
}