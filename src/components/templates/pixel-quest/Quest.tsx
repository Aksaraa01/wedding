"use client"

import { useEffect, useState } from "react"
import type { TemplateProps } from "@/types/template"
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
import GiftCard from "./cards/GiftCard"
import FamilyCard from "./cards/FamilyCard"
import VideoCard, { type VideoCardData } from "./cards/VideoCard"

export type QuestStep = "couple" | "story" | "events" | "gift" | "inviting" | "video"

const FRAMES = [ASSETS.pixelQuest.frame1, ASSETS.pixelQuest.frame2, ASSETS.pixelQuest.frame3, ASSETS.pixelQuest.frame4]
const STEP_FRAME: Record<QuestStep, number> = { couple: 0, story: 1, events: 2, gift: 3, inviting: 3, video: 3 }
const CAT_POS: Record<QuestStep, { top: string; left: string; flip: boolean }> = {
  couple: { top: "48.5%", left: "33%", flip: false },
  story: { top: "44%", left: "62%", flip: true },
  events: { top: "46%", left: "26%", flip: false },
  gift: { top: "50%", left: "60%", flip: true },
  inviting: { top: "49%", left: "38%", flip: false },
  video: { top: "47%", left: "64%", flip: true },
}
const STEP_LABEL: Record<QuestStep, string> = {
  couple: "SOULMATES",
  story: "LOVE STORY",
  events: "DATE & VENUE",
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
}

export default function Quest({ profile, musicPlaying, onToggleMusic, wishOpen, onWishOpenChange }: Props) {
  const stories = Array.isArray(profile.stories) ? profile.stories : []
  const families = Array.isArray(profile.inviting_families) ? profile.inviting_families.filter(Boolean) : []
  const sessions = Array.isArray(profile.sessions) ? profile.sessions : []
  const accounts: GiftAccountData[] = Array.isArray(profile.gift_accounts) ? profile.gift_accounts : []
  const gates = profile.feature_gates || {}

  const storyOn = gates.story !== false && profile.story_visible !== false && stories.length > 0
  const eventsOn = sessions.some((s) => s && (s.date || s.venue))
  const giftOn =
    profile.gift_section_visible !== false &&
    (accounts.length > 0 || (gates.gift_address !== false && !!profile.gift_address))
  const invitingOn = gates.inviting_families !== false && profile.inviting_families_visible !== false && families.length > 0
  const videoOn = gates.video !== false && profile.video_section_visible !== false && !!profile.video_url

  // Steps reduce automatically when their content is hidden/off.
  const steps: QuestStep[] = (["couple", "story", "events", "gift", "inviting", "video"] as QuestStep[]).filter((k) => {
    if (k === "couple") return true
    if (k === "story") return storyOn
    if (k === "events") return eventsOn
    if (k === "gift") return giftOn
    if (k === "inviting") return invitingOn
    return videoOn
  })

  const [stepIdx, setStepIdx] = useState(0)
  // Hiding the card persists across step navigation (never auto-reset).
  const [cardHidden, setCardHidden] = useState(false)
  useEffect(() => {
    setStepIdx((i) => Math.min(i, Math.max(0, steps.length - 1)))
  }, [steps.length])

  const step = steps[Math.min(stepIdx, Math.max(0, steps.length - 1))] || "couple"
  const frameIdx = STEP_FRAME[step]
  const catPos = CAT_POS[step]
  const celebrate = step === "gift" || step === "inviting" || step === "video"
  const isFirst = stepIdx <= 0
  const isLast = stepIdx >= steps.length - 1

  const videoEmbed = normalizeVideoUrl(profile.video_url)
  const videoData: VideoCardData = videoEmbed ? { state: "ready", videoUrl: videoEmbed } : { state: "none" }
  const coupleTitle = `${profile.groom_name || "Mempelai"} & ${profile.bride_name || "Mempelai"}: The Journey Begins`

  const go = (i: number) => {
    if (i < 0 || i >= steps.length) return
    setStepIdx(i)
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
      <CameoFrame4 active={frameIdx === 3} />
      <QuestAtmosphere celebrate={celebrate} />
      <QuestCat top={catPos.top} left={catPos.left} flip={catPos.flip} />

      {/* Top bar */}
      <header className="relative z-30 pt-3.5 px-4 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="px-3 py-1 rounded-full bg-[#0e1321]/90 border border-cyan-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[8px] text-cyan-300 tracking-wider" style={FONT_PIXEL}>
              {(profile.display_name || `${profile.groom_name || ""} & ${profile.bride_name || ""}`).toUpperCase().slice(0, 24) || "MEMPELAI"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMusic}
              aria-label="Putar atau jeda musik"
              className="px-2.5 py-1 rounded-full bg-[#0e1321]/90 flex items-center gap-1 border border-cyan-400/40 text-cyan-300 hover:text-white active:scale-95 transition text-[8px]"
              style={FONT_PIXEL}
            >
              <span className="material-symbols-outlined text-[14px]">{musicPlaying ? "music_note" : "music_off"}</span>
              <span>{musicPlaying ? "BGM" : "MUTED"}</span>
            </button>
            <button
              type="button"
              onClick={() => setCardHidden((h) => !h)}
              className="px-2.5 py-1 rounded-full bg-[#0e1321]/90 flex items-center gap-1 border border-cyan-400/40 text-cyan-300 hover:text-white active:scale-95 transition text-[8px]"
              style={FONT_PIXEL}
            >
              <span className="material-symbols-outlined text-[14px]">{cardHidden ? "visibility" : "visibility_off"}</span>
              <span>{cardHidden ? "SHOW CARD" : "HIDE CARD"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-[6vh]" />

      {/* Floating card (max half the device screen, body scrolls) */}
      {!cardHidden && (
        <main className="relative z-30 px-4 pb-2 shrink-0">
          {step === "couple" && <CoupleCard profile={profile} onHide={() => setCardHidden(true)} />}
          {step === "story" && <StoryCard profile={profile} onHide={() => setCardHidden(true)} />}
          {step === "events" && <EventsCard profile={profile} onHide={() => setCardHidden(true)} />}
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

      {/* Restore pill when the card is hidden */}
      {cardHidden && (
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
            onClick={() => go(stepIdx - 1)}
            disabled={isFirst}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-[9px] transition-all active:scale-95 ${isFirst ? "bg-slate-900/70 border-slate-700 text-slate-400 opacity-40 cursor-not-allowed" : "bg-slate-900/70 border-slate-700 text-slate-300 hover:border-cyan-400/60 hover:text-cyan-300"}`}
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
                aria-selected={i === stepIdx}
                aria-label={STEP_LABEL[k]}
                title={STEP_LABEL[k]}
                onClick={() => go(i)}
                className={`rounded-full transition-all cursor-pointer ${i === stepIdx ? "w-2.5 h-2.5 bg-cyan-400 shadow-[0_0_8px_#38bdf8]" : i < stepIdx ? "w-2 h-2 bg-cyan-400/60" : "w-2 h-2 bg-slate-700"}`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => (isLast ? go(0) : go(stepIdx + 1))}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 text-[10px] font-bold transition-all active:scale-95 ${
              isLast
                ? "bg-gradient-to-r from-amber-400 to-amber-500 border-amber-300 text-black shadow-[0_0_15px_rgba(251,191,36,0.6)]"
                : "bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 border-cyan-200 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.75)] hover:brightness-110"
            }`}
            style={FONT_PIXEL}
          >
            {isFirst ? "START" : isLast ? "FINISH" : "NEXT"}
            <span className="material-symbols-outlined text-sm">{isLast ? "done_all" : "arrow_forward"}</span>
          </button>
        </div>
      </footer>

      {/* Comment section (shared live wishes) */}
      <LiveWishes
        open={wishOpen}
        onOpenChange={onWishOpenChange}
        weddingProfileId={profile.wedding_profile_id}
        guestId={profile.guest_id}
        guestName={profile.guest_name}
        stickyClassName="bottom-[104px] left-3"
      />
    </div>
  )
}