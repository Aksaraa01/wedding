"use client"

import { useState } from "react"
import type { CSSProperties } from "react"
import type { TemplateProps } from "@/types/template"
import { normalizeLanguage, t } from "@/lib/i18n"
import { ASSETS } from "@/lib/assets"
import { toTransformedUrl } from "@/lib/storageUrl"
import { FONT_BODY, FONT_PIXEL } from "../shared/Skin"
import { formatDotDate, initialsOf, type GiftAccountData } from "../shared/lib"
import LiveWishes from "../shared/LiveWishes"
import { useSceneFit } from "../shared/useSceneFit"
import PixelAtmosphere, { PIXEL_ATMOSPHERE_CSS } from "./Atmosphere"

const BODY = FONT_BODY
const PIXEL = FONT_PIXEL

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
          ? "border-cyan-400 bg-slate-900/90 text-cyan-200 shadow-[0_0_15px_rgba(56,239,255,0.8),0_0_25px_rgba(56,239,255,0.4)]"
          : "border-cyan-500/40 bg-slate-900/85 text-cyan-300 shadow-[0_0_10px_rgba(56,239,255,0.25)] hover:text-white hover:border-cyan-400"
      }`}
      style={BODY}
    >
      {children}
    </button>
  )
}

const GUIDE_STYLE = `
.pp-scene { width: 100%; }
.pp-guide { border: 2px solid rgb(103, 232, 249); background: rgba(56, 189, 248, 0.2); animation: ppHotspotPulse 2.2s infinite ease-in-out; }
.pp-guide-pink { border: 2px solid rgb(244, 114, 182); background: rgba(236, 72, 153, 0.25); animation: ppHotspotPulsePink 2.2s infinite ease-in-out; }
${PIXEL_ATMOSPHERE_CSS}
`

export default function PixelRoom({
  profile,
  musicPlaying,
  onToggleMusic,
  onOpenModal,
  modalActive,
  wishOpen,
  onWishOpenChange,
}: RoomProps) {
  const lang = normalizeLanguage(profile.language)
  const tc = profile.template_content || {}
  const [hint, setHint] = useState(true)
  // Art box is measured (never overflows): full image always visible, hotspots aligned.
  const { boxRef, boxStyle, onArtLoad } = useSceneFit(124, "768 / 1376")

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

  const hotspot = (left: number, top: number, width: number, height: number, pink = false) => ({
    style: { left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` } as CSSProperties,
    pink,
  })

  // Pixel room hotspot coordinates (% of the natural-aspect art). Gated hotspots are
  // dropped when their content is empty/toggled off. The pink hearts = the couple;
  // the GIFT sign = wedding gift. (No jukebox hotspot — music notes are decor only.)
  const items: ({ kind: ModalKind; label: string; pos: ReturnType<typeof hotspot>; giftLabel?: boolean } | null)[] = [
    giftEnabled ? { kind: "gift", label: "Buka Kado Pernikahan (Gift)", pos: hotspot(45, 4, 13, 10), giftLabel: true } : null,
    storyEnabled ? { kind: "story", label: "Buka Playstory", pos: hotspot(9, 11, 24, 19) } : null,
    galleryEnabled ? { kind: "gallery", label: "Buka Galeri Foto", pos: hotspot(37, 11, 15, 13) } : null,
    eventsEnabled ? { kind: "events", label: "Buka Waktu & Lokasi Acara", pos: hotspot(84, 8, 14, 15) } : null,
    { kind: "couple", label: "Buka Profil Mempelai", pos: hotspot(32, 55, 17, 14, true) },
  ]

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#020617] text-[#dee2f6]">
      <style>{GUIDE_STYLE}</style>

      {/* Scene: pixel arcade room behind the header */}
      <div ref={boxRef} className="absolute inset-0 flex items-start justify-center pt-[124px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#0d1527_0%,#020617_75%)]" />
        <div className="relative pp-scene" style={boxStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={toTransformedUrl(ASSETS.pixelParadise.room, { width: 800 })} alt="" onLoad={onArtLoad} className="block w-full h-full object-cover pointer-events-none" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/40 via-transparent to-[#020617]/70 pointer-events-none" />
          <PixelAtmosphere />

          {items.map((it, i) => {
            if (!it) return null
            const guide = hint ? (it.pos.pink ? "pp-guide-pink" : "pp-guide") : ""
            return (
              <button
                key={`${it.kind}-${i}`}
                type="button"
                aria-label={it.label}
                onClick={() => onOpenModal(it.kind)}
                className={`absolute flex items-center justify-center rounded-xl outline-none active:scale-95 transition-transform cursor-pointer ${guide}`}
                style={it.pos.style}
              >
                {it.giftLabel && (
                  <span className="text-[7px] font-bold tracking-wider text-cyan-200/80 pointer-events-none" style={{ ...PIXEL, textShadow: "0 0 8px rgba(56,239,255,0.8)" }}>
                    GIFT
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Top bar */}
      <header className="absolute top-0 inset-x-0 z-40 p-4 flex items-center justify-between pointer-events-none">
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label={t("playPauseMusic", lang)}
          className="pointer-events-auto flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-cyan-500/40 text-xs text-cyan-200 shadow-[0_0_12px_rgba(56,239,255,0.2)]"
          style={BODY}
        >
          <span className={`w-2 h-2 rounded-full ${musicPlaying ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
          <span className="font-medium tracking-wide truncate max-w-[150px]">{topLabel || "Aksaraa"}</span>
        </button>

        <div className="flex flex-col items-center gap-2 pointer-events-auto">
          <PillButton active={hint} onClick={() => setHint((h) => !h)}>
            <span className={`w-2.5 h-2.5 rounded-full ${hint ? "bg-cyan-300 animate-pulse shadow-[0_0_12px_#38efff]" : "bg-slate-500"}`} />
            <span className="text-[10px] font-bold tracking-wider uppercase font-mono">{hint ? (lang === "en" ? "Hint ON" : "Petunjuk NYALA") : (lang === "en" ? "Hint OFF" : "Petunjuk MATI")}</span>
          </PillButton>
          {invitingEnabled && (
            <PillButton active={false} onClick={() => onOpenModal("family")}>
              <span className="material-symbols-outlined text-[15px]">groups</span>
              <span className="text-[10px] font-bold tracking-wider uppercase font-mono">{lang === "en" ? "Family Honors" : "Turut Mengundang"}</span>
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

      {/* Floating speaker — bottom right, above the collapsed wishes dock. Hidden
          while a modal or the wishes feed is open (they overlap the dock). */}
      {!modalActive && !wishOpen && (
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label="Putar atau jeda musik"
          title="Putar atau jeda musik"
          className="fixed right-4 z-[95] w-11 h-11 rounded-full bg-white text-[#111827] shadow-lg border border-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          style={{ bottom: 184, right: 16 }}
        >
          <span className={`material-symbols-outlined text-[22px] ${musicPlaying ? "" : "opacity-70"}`}>
            {musicPlaying ? "graphic_eq" : "music_off"}
          </span>
        </button>
      )}

      {/* Room hint when guides are off — sits above the sticky wishes button and
          hides while any modal (incl. wishes) is open so they never overlap. */}
      {!hint && !modalActive && !wishOpen && (
        <div className="pointer-events-none absolute bottom-[72px] inset-x-0 flex justify-center z-10">
          <span className="text-[8px] uppercase tracking-[0.2em] text-slate-500" style={PIXEL}>
            Sentuh objek untuk menjelajah
          </span>
        </div>
      )}

      {/* Live wishes & doa dock */}
      <LiveWishes
        open={wishOpen}
        onOpenChange={onWishOpenChange}
        weddingProfileId={profile.wedding_profile_id}
        guestId={profile.guest_id}
        guestName={profile.guest_name}
        title={tc.wishes_title || t("secWishes", lang)}
        intro={tc.wishes_intro}
      />
    </div>
  )
}