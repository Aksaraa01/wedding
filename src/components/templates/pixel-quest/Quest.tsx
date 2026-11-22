"use client"

import { useEffect, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { resolveCoupleName } from "@/lib/coupleName"
import { ASSETS } from "@/lib/assets"
import { FONT_PIXEL } from "../shared/Skin"
import LiveWishes from "../shared/LiveWishes"
import { normalizeVideoUrl, type GiftAccountData } from "../shared/lib"
import QuestAtmosphere, { QUEST_ATMOSPHERE_CSS } from "./QuestAtmosphere"
import QuestCat from "./QuestCat"
import { CameoFrame1, CameoFrame2, CameoFrame3, CameoFrame4, CAMEO_CSS } from "./Cameos"
import CoupleCard from "./cards/CoupleCard"
import StoryCard from "./cards/StoryCard"
import EventsCard from "./cards/EventsCard"
import GalleryCard from "./cards/GalleryCard"
import GiftCard from "./cards/GiftCard"
import FamilyCard from "./cards/FamilyCard"
import VideoCard, { type VideoCardData } from "./cards/VideoCard"
import GalleryModal from "../pixel-paradise/modals/GalleryModal"

export type QuestStep = "couple" | "story" | "events" | "gallery" | "gift" | "inviting" | "video"

const FRAMES = [ASSETS.pixelQuest.frame1, ASSETS.pixelQuest.frame2, ASSETS.pixelQuest.frame3, ASSETS.pixelQuest.frameGallery, ASSETS.pixelQuest.frame4]
const STEP_FRAME: Record<QuestStep, number> = { couple: 0, story: 1, events: 2, gallery: 3, gift: 4, inviting: 4, video: 4 }
const CAT_POS: Record<QuestStep, { top: string; left: string; flip: boolean }> = {
  couple: { top: "48.5%", left: "33%", flip: false },
  story: { top: "44%", left: "62%", flip: true },
  events: { top: "46%", left: "26%", flip: false },
  gallery: { top: "46%", left: "48%", flip: false },
  gift: { top: "50%", left: "60%", flip: true },
  inviting: { top: "49%", left: "38%", flip: false },
  video: { top: "47%", left: "64%", flip: true },
}
const STEP_LABEL: Record<QuestStep, string> = {
  couple: "SOULMATES",
  story: "LOVE STORY",
  events: "DATE & VENUE",
  gallery: "GALLERY",
  gift: "WEDDING GIFT",
  inviting: "TURUT MENGUNDANG",
  video: "VIDEO",
}

type Props = {
  profile: TemplateProps
  musicPlaying: boolean
  onToggleMusic: () => void
  wishOpen: boolean
  onWishOpenChange: (open: boolean) => void
  galleryOpen: boolean
  onGalleryOpenChange: (open: boolean) => void
  onCardVisibilityChange?: (visible: boolean) => void
}

export default function Quest({ profile, musicPlaying, onToggleMusic, wishOpen, onWishOpenChange, galleryOpen, onGalleryOpenChange, onCardVisibilityChange }: Props) {
  const stories = Array.isArray(profile.stories) ? profile.stories : []
  const families = Array.isArray(profile.inviting_families) ? profile.inviting_families.filter(Boolean) : []
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  const galleryPhotos = (Array.isArray(profile.gallery_photos) ? profile.gallery_photos : []).filter(Boolean)
  const accounts: GiftAccountData[] = Array.isArray(profile.gift_accounts) ? profile.gift_accounts : []
  const gates = profile.feature_gates || {}

  const storyOn = gates.story !== false && profile.story_visible !== false && stories.length > 0
  const eventsOn = sessions.some((s) => s && (s.date || s.venue))
  const galleryOn = galleryPhotos.length > 0
  const giftOn =
    profile.gift_section_visible !== false &&
    (accounts.length > 0 || (gates.gift_address !== false && !!profile.gift_address))
  const invitingOn = gates.inviting_families !== false && profile.inviting_families_visible !== false && families.length > 0
  const videoOn = gates.video !== false && profile.video_section_visible !== false && !!profile.video_url

  // Steps reduce automatically when their content is hidden/off.
  const steps: QuestStep[] = (["couple", "story", "events", "gallery", "gift", "inviting", "video"] as QuestStep[]).filter((k) => {
    if (k === "couple") return true
    if (k === "story") return storyOn
    if (k === "events") return eventsOn
    if (k === "gallery") return galleryOn
    if (k === "gift") return giftOn
    if (k === "inviting") return invitingOn
    return videoOn
  })

  const [stepIdx, setStepIdx] = useState(0)
  // Quest starts unstarted: frame 1 shows with no card and no active progress.
  // START begins at the couple card (still frame 1); FINISH resets to unstarted.
  const [started, setStarted] = useState(false)
  // Hiding the card persists across step navigation (never auto-reset).
  const [cardHidden, setCardHidden] = useState(false)
  useEffect(() => {
    setStepIdx((i) => Math.min(i, Math.max(0, steps.length - 1)))
  }, [steps.length])

  const step = started ? steps[Math.min(stepIdx, Math.max(0, steps.length - 1))] || "couple" : "couple"
  // The floating card is the quest's "modal": while it is displayed, the
  // floating QR/RSVP/speaker buttons stay hidden (pixel-paradise parity).
  const cardVisible = started && !cardHidden
  useEffect(() => {
    onCardVisibilityChange?.(cardVisible)
  }, [cardVisible, onCardVisibilityChange])
  const frameIdx = STEP_FRAME[step]
  const catPos = CAT_POS[step]
  const celebrate = started && (step === "gift" || step === "inviting" || step === "video")
  const isLast = stepIdx >= steps.length - 1

  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const videoData: VideoCardData = videoEmbed ? { state: "ready", videoUrl: videoEmbed } : { state: "none" }
  const coupleTitle = `${profile.groom_name || "Mempelai"} & ${profile.bride_name || "Mempelai"}: The Journey Begins`

  const go = (i: number) => {
    if (i < 0 || i >= steps.length) return
    setStarted(true)
    setStepIdx(i)
  }

  const handleNext = () => {
    if (!started) {
      setStarted(true)
      setStepIdx(0)
      return
    }
    if (isLast) {
      // FINISH loops back to the unstarted state (frame 1, no card).
      setStarted(false)
      setStepIdx(0)
      return
    }
    go(stepIdx + 1)
  }

  const handlePrev = () => {
    if (!started) return
    if (stepIdx <= 0) {
      setStarted(false)
      return
    }
    go(stepIdx - 1)
  }

  return (
    <div className="relative h-full w-full overflow-hidden select-none bg-[#05070c] text-[#dee2f6] flex flex-col">
      <style>{`${QUEST_ATMOSPHERE_CSS}\n${CAMEO_CSS}`}</style>

      {/* Background frames (cross-fade by step) */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {FRAMES.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ease-in-out ${i === frameIdx ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>

      {/* Cameo layers + atmosphere + cat */}
      <CameoFrame1 active={frameIdx === 0} />
      <CameoFrame2 active={frameIdx === 1} />
      <CameoFrame3 active={frameIdx === 2} />
      <CameoFrame4 active={frameIdx === 4} />
      <QuestAtmosphere celebrate={celebrate} />
      <QuestCat top={catPos.top} left={catPos.left} flip={catPos.flip} />

      {/* Top bar */}
      <header className="relative z-30 pt-3.5 px-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="px-3 py-1 rounded-full bg-[#0e1321]/90 border border-cyan-500/30 flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-[8px] text-cyan-300 tracking-wider truncate" style={FONT_PIXEL}>
              {(resolveCoupleName(profile) || "MEMPELAI").toUpperCase().slice(0, 24)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onWishOpenChange(true)}
              aria-label="Buka Live Wishes & Doa"
              className="px-2 py-1 rounded-full bg-[#0e1321]/90 flex items-center gap-1 border border-cyan-400/40 text-cyan-300 hover:text-white active:scale-95 transition text-[8px]"
              style={FONT_PIXEL}
            >
              <span className="material-symbols-outlined text-[13px]">forum</span>
              <span>WISHES</span>
            </button>
            <button
              type="button"
              onClick={() => setCardHidden((h) => !h)}
              className="px-2 py-1 rounded-full bg-[#0e1321]/90 flex items-center gap-1 border border-cyan-400/40 text-cyan-300 hover:text-white active:scale-95 transition text-[8px]"
              style={FONT_PIXEL}
            >
              <span className="material-symbols-outlined text-[13px]">{cardHidden ? "visibility" : "visibility_off"}</span>
              <span>{cardHidden ? "SHOW" : "HIDE"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-[6vh]" />

      {/* Floating card (max half the device screen, body scrolls).
          Shown only after START; hiding persists across steps. */}
      {cardVisible && (
        <main className="relative z-30 px-4 pb-2 shrink-0">
          {step === "couple" && <CoupleCard profile={profile} onHide={() => setCardHidden(true)} />}
          {step === "story" && <StoryCard profile={profile} onHide={() => setCardHidden(true)} />}
          {step === "events" && <EventsCard profile={profile} onHide={() => setCardHidden(true)} />}
          {step === "gallery" && <GalleryCard photos={galleryPhotos} onHide={() => setCardHidden(true)} onExpand={() => onGalleryOpenChange(true)} />}
          {step === "gift" && (
            <GiftCard
              accounts={accounts}
              giftAddress={gates.gift_address !== false ? profile.gift_address || undefined : undefined}
              giftAddressName={profile.gift_address_name || undefined}
              onHide={() => setCardHidden(true)}
            />
          )}
          {step === "inviting" && <FamilyCard families={families} onHide={() => setCardHidden(true)} />}
          {step === "video" && <VideoCard data={videoData} title={coupleTitle} onHide={() => setCardHidden(true)} />}
        </main>
      )}

      {/* Restore pill when the card is hidden (only after START) */}
      {started && cardHidden && (
        <div className="relative z-30 px-4 mb-2 flex justify-center shrink-0">
          <button
            type="button"
            onClick={() => setCardHidden(false)}
            className="px-4 py-1.5 rounded-full bg-[#0e1321]/90 flex items-center gap-2 border-2 border-cyan-400 text-cyan-300 hover:text-white shadow-[0_0_16px_rgba(56,189,248,0.5)] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm animate-bounce text-pink-400">expand_less</span>
            <span className="text-[9px] tracking-wider text-cyan-200" style={FONT_PIXEL}>
              BUKA INFO / VIEW CARD
            </span>
          </button>
        </div>
      )}

      {/* Footer nav */}
      <footer className="relative z-30 px-4 pb-5 pt-1 shrink-0 sticky bottom-0">
        <div className="p-2 rounded-2xl flex items-center justify-between bg-[#0e1321]/90 border border-cyan-400/40 shadow-xl">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!started}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[9px] transition-all active:scale-95 ${!started ? "bg-slate-900/70 border-slate-700 text-slate-400 opacity-40 cursor-not-allowed" : "bg-slate-900/70 border-slate-700 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"}`}
            style={FONT_PIXEL}
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            PREV
          </button>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Langkah">
            {steps.map((k, i) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={started && i === stepIdx}
                aria-label={STEP_LABEL[k]}
                title={STEP_LABEL[k]}
                onClick={() => go(i)}
                className={`rounded-full transition-all cursor-pointer ${started && i === stepIdx ? "w-2.5 h-2.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8]" : started && i < stepIdx ? "w-2 h-2 bg-cyan-400/60" : "w-2 h-2 bg-slate-700"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={handleNext}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all active:scale-95 ${
              started && isLast
                ? "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-300 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                : "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.75)] hover:brightness-110"
            }`}
            style={FONT_PIXEL}
          >
            {!started ? "START" : isLast ? "FINISH" : "NEXT"}
            <span className="material-symbols-outlined text-sm">{started && isLast ? "done_all" : "arrow_forward"}</span>
          </button>
        </div>
      </footer>

      {/* Floating speaker (same as pixel-paradise) — bottom right above the guest
          dock, hidden while the card, the gallery overlay, or the wishes feed
          is displayed. */}
      {!wishOpen && !cardVisible && !galleryOpen && (
        <button
          type="button"
          onClick={onToggleMusic}
          aria-label="Putar atau jeda musik"
          title="Putar atau jeda musik"
          className="fixed right-4 z-[95] w-11 h-11 rounded-full bg-white text-[#111827] shadow-lg border border-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
          style={{ bottom: 230, right: 16 }}
        >
          <span className={`material-symbols-outlined text-[22px] ${musicPlaying ? "" : "opacity-70"}`}>
            {musicPlaying ? "graphic_eq" : "music_off"}
          </span>
        </button>
      )}

      {/* Full gallery overlay (pixel-paradise gallery, fullscreen viewing) */}
      {galleryOpen && <GalleryModal profile={profile} onClose={() => onGalleryOpenChange(false)} />}

      {/* Comment section (shared live wishes; entry via header pill so it never
          overlaps the card, footer, or dock) */}
      <LiveWishes
        open={wishOpen}
        onOpenChange={onWishOpenChange}
        weddingProfileId={profile.wedding_profile_id}
        guestId={profile.guest_id}
        guestName={profile.guest_name}
        hideTrigger
        language={profile.language}
      />
    </div>
  )
}