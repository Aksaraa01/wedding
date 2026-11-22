"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { resolveCoupleName } from "@/lib/coupleName"
import InvitationOverlay from "@/components/InvitationOverlay"
import { ASSETS } from "@/lib/assets"
import { bridePhoto, coverPhoto, groomPhoto, initialsOf } from "../shared/lib"
import Skin, { FONT_BODY, FONT_SCRIPT } from "../shared/Skin"
import LiveWishes from "../shared/LiveWishes"
import ImpastoCover from "./Cover"
import ImpastoPages from "./Pages"

// Preload the template-critical imagery (painted backdrop, brush, photos)
// behind a splash so guests never see lazy pop-in. Fails safe after 9s.
function usePastelDreamReady(profile: TemplateProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    const srcs = [
      ASSETS.pastelDreamCathedral.coverBg,
      ASSETS.pastelDreamCathedral.bg,
      ASSETS.pastelDreamCathedral.brush,
      ASSETS.defaults.couple,
      ASSETS.defaults.groom,
      ASSETS.defaults.bride,
      coverPhoto(profile),
      groomPhoto(profile.groom_photo_url),
      bridePhoto(profile.bride_photo_url),
    ].filter(Boolean) as string[]
    const load = (src: string) =>
      new Promise<void>((resolve) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = () => resolve()
        img.src = src
      })
    const timer = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 9000)
    Promise.allSettled(srcs.map(load)).then(() => {
      if (!cancelled) {
        clearTimeout(timer)
        setReady(true)
      }
    })
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [profile.cover_photos, profile.couple_illustration_url, profile.groom_photo_url, profile.bride_photo_url])
  return ready
}

export default function PastelDreamCathedral(props: TemplateProps) {
  const [opened, setOpened] = useState(false)
  const [wishOpen, setWishOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const hasTrack = !!props.track_url

  const openInvitation = useCallback(() => {
    setOpened(true)
    if (hasTrack && props.auto_play !== false) {
      setPlaying(true)
      setTimeout(() => {
        audioRef.current?.play().catch(() => setPlaying(false))
      }, 60)
    }
  }, [hasTrack, props.auto_play])

  const toggleMusic = useCallback(() => {
    const el = audioRef.current
    if (!el) return
    if (el.paused) {
      el.play().catch(() => setPlaying(false))
      setPlaying(true)
    } else {
      el.pause()
      setPlaying(false)
    }
  }, [])

  const onWishOpenChange = useCallback((open: boolean) => setWishOpen(open), [])

  const ready = usePastelDreamReady(props)
  const initials = (props.couple_initials || "").trim() || initialsOf(props.groom_name, props.bride_name) || "AR"

  // Guest QR/RSVP dock shows only after the invitation opens, for identified
  // guests, and hides while the wishes feed is open.
  const showGuestDock = opened && !wishOpen && (!!props.guest_id || (props.guest_link_strict === false && !!props.guest_slug)) && !!props.wedding_profile_id
  const coupleName = resolveCoupleName(props)

  return (
    <Skin display="Cormorant Garamond" body="Montserrat" script="Alex Brush">
      <style>{`@keyframes imLoadPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }`}</style>
      <div className="sp-shell w-full bg-[#2A1F18] flex justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-[#2A1F18] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {!ready && (
            <div className="absolute inset-0 z-[100] overflow-hidden bg-[#171310]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSETS.pastelDreamCathedral.coverBg} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover object-center opacity-40" />
              <div className="absolute inset-0 bg-black/45" />
              <div className="relative h-full flex flex-col items-center justify-center gap-3 px-8 text-center">
                <span className="text-[46px] leading-none text-[#f2ca50]" style={{ ...FONT_SCRIPT, textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
                  {initials}
                </span>
                <span className="text-[11px] uppercase font-medium" style={{ ...FONT_BODY, letterSpacing: "0.3em", color: "#E5DEC9", animation: "imLoadPulse 1.6s ease-in-out infinite" }}>
                  Menyiapkan Undangan
                </span>
              </div>
            </div>
          )}
          {!opened ? (
            <ImpastoCover
              groom_name={props.groom_name}
              bride_name={props.bride_name}
              guest_name={props.guest_name}
              estimated_wedding_date={props.estimated_wedding_date}
              onOpen={openInvitation}
            />
          ) : (
            <ImpastoPages profile={props} onWishOpenChange={onWishOpenChange} />
          )}

          {opened && (
            <LiveWishes
              open={wishOpen}
              onOpenChange={onWishOpenChange}
              weddingProfileId={props.wedding_profile_id}
              guestId={props.guest_id}
              guestName={props.guest_name}
              hideTrigger
            />
          )}
        </div>

        {showGuestDock && (
          <InvitationOverlay
            guestId={props.guest_id}
            guestSlug={props.guest_slug}
            allowFlexibleRsvp={props.guest_link_strict === false}
            guestName={props.guest_name || "Tamu Undangan"}
            coupleName={coupleName}
            weddingProfileId={props.wedding_profile_id!}
            guestQrUrl={props.guest_qr_url}
            guestTableNumber={props.guest_table_number}
            guestRsvpStatus={props.guest_rsvp_status}
            guestRsvpMessage={props.guest_rsvp_message || undefined}
            rsvpMaxPax={props.rsvp_max_pax ?? 2}
            qrEnabled={props.feature_gates?.qr_code_book === true}
            anchor="center"
          />
        )}

        {opened && !wishOpen && (
          <button
            type="button"
            onClick={toggleMusic}
            aria-label="Putar atau jeda musik"
            title="Putar atau jeda musik"
            className="fixed right-4 z-[95] w-11 h-11 rounded-full bg-white text-[#111827] shadow-lg border border-black/10 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            style={{
              top: "50%",
              right: 16,
              transform: "translateY(-50%)",
              marginTop: showGuestDock ? (props.feature_gates?.qr_code_book === true && props.guest_qr_url ? 88 : 58) : 0,
            }}
          >
            <span className={`material-symbols-outlined text-[22px] ${playing ? "" : "opacity-70"}`}>
              {playing ? "graphic_eq" : "music_off"}
            </span>
          </button>
        )}

        {hasTrack && <audio ref={audioRef} src={props.track_url} loop playsInline preload="none" />}
      </div>
    </Skin>
  )
}
