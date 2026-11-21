"use client"

import { useCallback, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { resolveCoupleName } from "@/lib/coupleName"
import InvitationOverlay from "@/components/InvitationOverlay"
import { ASSETS } from "@/lib/assets"
import Skin from "../shared/Skin"
import PixelCover from "../pixel-paradise/Cover"
import Quest from "./Quest"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function PixelQuest(props: TemplateProps) {
  const lang = normalizeLanguage(props.language)
  const [opened, setOpened] = useState(false)
  const [wishOpen, setWishOpen] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [questCardVisible, setQuestCardVisible] = useState(false)
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
  const onGalleryOpenChange = useCallback((open: boolean) => setGalleryOpen(open), [])
  const onCardVisibilityChange = useCallback((visible: boolean) => setQuestCardVisible(visible), [])

  // Guest QR/RSVP dock shows only after the invitation opens, for identified
  // guests, and hides while the quest card, the gallery overlay, or the wishes
  // feed is displayed (pixel-paradise parity: floating buttons yield to content).
  const showGuestDock = opened && !wishOpen && !galleryOpen && !questCardVisible && (!!props.guest_id || (props.guest_link_strict === false && !!props.guest_slug)) && !!props.wedding_profile_id
  const coupleName = resolveCoupleName(props)

  return (
    <Skin display="Playfair Display" body="Plus Jakarta Sans" pixel="Press Start 2P">
      <div className="sp-shell w-full bg-[#05070c] flex justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-[#020617] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {!opened ? (
            <PixelCover
              groom_name={props.groom_name}
              bride_name={props.bride_name}
              guest_name={props.guest_name}
              couple_initials={props.couple_initials}
              onOpen={openInvitation}
              backgroundUrl={ASSETS.pixelQuest.coverBg}
            />
          ) : (
            <Quest
              profile={props}
              musicPlaying={playing}
              onToggleMusic={toggleMusic}
              wishOpen={wishOpen}
              onWishOpenChange={onWishOpenChange}
              galleryOpen={galleryOpen}
              onGalleryOpenChange={onGalleryOpenChange}
              onCardVisibilityChange={onCardVisibilityChange}
            />
          )}
        </div>

        {showGuestDock && (
          <InvitationOverlay
            guestId={props.guest_id}
            guestSlug={props.guest_slug}
            allowFlexibleRsvp={props.guest_link_strict === false}
            guestName={props.guest_name || t("honoredGuest", lang)}
            coupleName={coupleName}
            weddingProfileId={props.wedding_profile_id!}
            guestQrUrl={props.guest_qr_url}
            guestTableNumber={props.guest_table_number}
            guestRsvpStatus={props.guest_rsvp_status}
            guestRsvpMessage={props.guest_rsvp_message || undefined}
            rsvpMaxPax={props.rsvp_max_pax ?? 2}
            qrEnabled={props.feature_gates?.qr_code_book === true}
            anchor="bottom"
            bottom={110}
            language={lang}
          />
        )}

        {hasTrack && <audio ref={audioRef} src={props.track_url} loop playsInline preload="none" />}
      </div>
    </Skin>
  )
}
