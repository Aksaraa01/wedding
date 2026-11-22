"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { ASSETS } from "@/lib/assets"
import { formatDotDate, initialsOf, type GiftAccountData } from "./lib"
import LiveWishes from "../shared/LiveWishes"
import { useSceneFit } from "../shared/useSceneFit"
import SkylineAtmosphere, { SKYLINE_ATMOSPHERE_CSS } from "./Atmosphere"

const BODY = { fontFamily: "var(--font-body, 'Plus Jakarta Sans'), sans-serif" } as const

export type ModalKind = "gallery" | "story" | "events" | "couple" | "gift" | "family" | "video"

type RoomProps = {
  profile: TemplateProps
  musicPlaying: boolean
  onToggleMusic: () => void
  onOpenModal: (k: ModalKind) => void
  modalActive: boolean
  wishOpen: boolean
  onWishOpenChange: (open: boolean) => void
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-full backdrop-blur-md border transition cursor-pointer ${
        active
          ? "border-[#38bdf8]/50 bg-slate-900/85 text-[#7bd0ff] shadow-[0_0_12px_rgba(56,239,255,0.35)]"
          : "border-slate-800 bg-slate-900/80 text-slate-400 hover:text-slate-200"
      }`}
      style={BODY}
    >
      {children}
    </button>
  )
}

// Base CSS for hotspot guide outlines (HINT ON). The art renders at its natural
// aspect, full column width, so it is never cropped and hotspots always align
// in the editor preview and on a real device.
const GUIDE_STYLE = `
.sp-scene { width: 100%; }
.sp-guide { border: 1.5px solid rgba(56, 189, 248, 0.55); background: rgba(56, 189, 248, 0.05); animation: spGuidePulse 2.6s infinite ease-in-out; }
.sp-guide-pink { border: 1.5px solid rgba(244, 63, 94, 0.55); background: rgba(244, 63, 94, 0.05); }
${SKYLINE_ATMOSPHERE_CSS}
`


export default function Room({ profile, musicPlaying, onToggleMusic, onOpenModal, modalActive, wishOpen, onWishOpenChange }: RoomProps) {
  const [hint, setHint] = useState(true)
  // Art box is measured (never overflows): full image always visible, hotspots aligned.
  const { boxRef, boxStyle, onArtLoad } = useSceneFit(124, "390 / 513.2")

  const stories = Array.isArray(profile.stories) ? profile.stories : []
  const families = Array.isArray(profile.inviting_families) ? profile.inviting_families.filter(Boolean) : []
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  const gallery = (Array.isArray(profile.gallery_photos) ? profile.gallery_photos : []).filter(Boolean)
  const accounts: GiftAccountData[] = Array.isArray(profile.gift_accounts) ? profile.gift_accounts : []

  const gates = profile.feature_gates || {}
  const storyEnabled = gates.story !== false && profile.story_visible !== false && stories.length > 0
  const invitingEnabled = gates.inviting_families !== false && profile.inviting_families_visible !== false && families.length > 0
  const videoEnabled = gates.video !== false && profile.video_section_visible !== false && !!profile.video_url
  const giftEnabled =
    profile.gift_section_visible !== false &&
    (accounts.length > 0 || (gates.gift_address !== false && !!profile.gift_address))
  const eventsEnabled = sessions.some((s) => s && (s.date || s.venue))
  const galleryEnabled = gallery.length > 0

  const initials = (profile.couple_initials || "").trim() || initialsOf(profile.groom_name, profile.bride_name)
  const dateStr = formatDotDate(profile.estimated_wedding_date)
  const topLabel = [initials && `${initials.split("").join(" ")}`, dateStr].filter(Boolean).join(" • ")

  // Hotspot coordinates (percent) tuned to the room illustration — do not change.
  const hotspot = (z: number, left: number, top: number, width: number, height: number, pink?: boolean, enabled = true) => ({
    style: { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%`, zIndex: z } as CSSProperties,
    pink,
    enabled,
  })

  const items: ({ kind: ModalKind; label: string; pos: ReturnType<typeof hotspot> } | null)[] = [
    galleryEnabled
      ? { kind: "gallery", label: "Buka Galeri Foto", pos: hotspot(2, 11, 22, 34, 40) }
      : null,
    storyEnabled
      ? { kind: "story", label: "Buka Cerita Cinta", pos: hotspot(2, 52, 24, 19, 28) }
      : null,
    eventsEnabled
      ? { kind: "events", label: "Buka Waktu & Lokasi Acara", pos: hotspot(2, 75, 35, 19, 22) }
      : null,
    { kind: "couple", label: "Buka Profil Mempelai", pos: hotspot(2, 32, 54, 31, 29, true) },
    giftEnabled
      ? { kind: "gift", label: "Buka Kado Pernikahan", pos: hotspot(2, 63, 62, 22, 26) }
      : null,
  ]

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#020617] text-[#dee2f6]">
      <style>{GUIDE_STYLE}</style>

      {/* Scene: the isometric room illustration with hotspots anchored to it.
          The art starts below the stacked header controls (HINT/Family/Video),
          so it never covers the video button. */}
      <div ref={boxRef} className="absolute inset-0 flex items-start justify-center pt-[124px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,#0d1527_0%,#020617_75%)]" />
        <div className="relative sp-scene" style={boxStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ASSETS.skylinePenthouse.room}
            alt=""
            onLoad={onArtLoad}
            className="block w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] from-2% via-transparent to-[#020617]/60 pointer-events-none" />
          <SkylineAtmosphere />

          {/* Hotspots */}
          {items.map((it) => {
            if (!it) return null
            const guide = hint ? (it.pos.pink ? "sp-guide-pink" : "sp-guide") : ""
            return (
              <button
                key={it.kind}
                type="button"
                aria-label={it.label}
                onClick={() => onOpenModal(it.kind)}
                className={`absolute rounded-2xl outline-none active:scale-95 transition-transform cursor-pointer ${guide}`}
                style={it.pos.style}
              />
            )
          })}

          <LiveWishes
            open={wishOpen}
            onOpenChange={onWishOpenChange}
            weddingProfileId={profile.wedding_profile_id}
            guestId={profile.guest_id}
            guestName={profile.guest_name}
            language={profile.language}
          />
        </div>
      </div>

      {/* WP-style floating speaker (pause/resume). Sits just above the bottom-right
          QR/RSVP dock (which is bottom:24 + 2 buttons, then a 12px gap).
          Hidden while a modal is open. */}
      {!modalActive && !wishOpen && (
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label="Putar atau jeda musik"
          title="Putar atau jeda musik"
          className="fixed right-4 z-[95] w-11 h-11 rounded-full bg-white text-[#111827] shadow-lg border border-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          style={{ bottom: 144 }}
        >
          <span className={`material-symbols-outlined text-[22px] ${musicPlaying ? "" : "opacity-70"}`}>
            {musicPlaying ? "graphic_eq" : "music_off"}
          </span>
        </button>
      )}

      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-30 p-4 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label="Putar/jeda musik"
          className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/40 text-xs text-cyan-200 shadow-[0_0_12px_rgba(56,239,255,0.2)]"
          style={BODY}
        >
          <span className={`w-2 h-2 rounded-full ${musicPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          <span className="font-medium tracking-wide truncate max-w-[150px]">{topLabel || "Aksaraa"}</span>
        </button>

        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <PillButton active={hint} onClick={() => setHint((h) => !h)}>
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#38efff]" />
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono">{hint ? "Hint ON" : "Hint OFF"}</span>
          </PillButton>
          {invitingEnabled && (
            <PillButton active={false} onClick={() => onOpenModal("family")}>
              <span className="material-symbols-outlined text-[15px]">groups</span>
              <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Family Honors</span>
            </PillButton>
          )}
          {videoEnabled && (
            <PillButton active={false} onClick={() => onOpenModal("video")}>
              <span className="material-symbols-outlined text-[15px]">play_arrow</span>
              <span className="text-[10px] font-bold tracking-wider uppercase font-mono">Video</span>
            </PillButton>
          )}
        </div>
      </header>

      {/* Room hint for hidden hotspots — sits above the sticky wishes button and
          hides while any modal (incl. wishes) is open so they never overlap. */}
      {!hint && !modalActive && !wishOpen && (
        <div className="pointer-events-none absolute bottom-[72px] inset-x-0 flex justify-center z-10">
          <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500" style={BODY}>
            Sentuh objek untuk menjelajah
          </span>
        </div>
      )}
    </div>
  )
}