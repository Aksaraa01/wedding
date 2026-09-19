"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import InvitationOverlay from "@/components/InvitationOverlay"
import Skin from "./Skin"
import SkylineCover from "./Cover"
import Room, { type ModalKind } from "./Room"
import CoupleModal from "./modals/CoupleModal"
import EventsModal from "./modals/EventsModal"
import StoryModal from "./modals/StoryModal"
import GalleryModal from "./modals/GalleryModal"
import GiftModal from "./modals/GiftModal"
import FamilyModal from "./modals/FamilyModal"
import VideoModal, { type VideoModalData } from "./modals/VideoModal"
import { normalizeVideoUrl } from "./lib"

export default function SkylinePenthouse(props: TemplateProps) {
  const [opened, setOpened] = useState(false)
  const [modal, setModal] = useState<ModalKind | null>(null)
  const [wishOpen, setWishOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const hasTrack = !!props.track_url

  const openInvitation = useCallback(() => {
    setOpened(true)
    if (hasTrack && props.auto_play !== false) {
      // Autoplay is allowed here: this handler is a direct user gesture.
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

  // Mirror playback state from the element (e.g. ended events).
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    el.addEventListener("play", onPlay)
    el.addEventListener("pause", onPause)
    el.addEventListener("ended", onPause)
    return () => {
      el.removeEventListener("play", onPlay)
      el.removeEventListener("pause", onPause)
      el.removeEventListener("ended", onPause)
    }
  }, [opened])

  const videoEmbed = normalizeVideoUrl(props.video_url)
  const videoData: VideoModalData = videoEmbed ? { state: "ready", videoUrl: videoEmbed } : { state: "none" }

  const closeModal = useCallback(() => setModal(null), [])

  // The QR/RSVP dock is rendered by the template itself so it never appears on
  // the cover: it shows only for identified guests, after the invitation opens,
  // and hides while a modal or the live-wishes modal is open.
  const showGuestDock = opened && !modal && !wishOpen && (!!props.guest_id || (props.guest_link_strict === false && !!props.guest_slug)) && !!props.wedding_profile_id
  const coupleName =
    (props.groom_full_name && props.bride_full_name
      ? `${props.groom_full_name} & ${props.bride_full_name}`
      : props.display_name) || `${props.groom_name || ""} & ${props.bride_name || ""}`

  return (
    <Skin>
      <div className="sp-shell w-full bg-[#05070c] flex justify-center overflow-hidden">
        <div className="relative h-full w-full max-w-[430px] overflow-hidden bg-[#020617] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
          {!opened ? (
            <SkylineCover
              groom_name={props.groom_name}
              bride_name={props.bride_name}
              guest_name={props.guest_name}
              couple_initials={props.couple_initials}
              onOpen={openInvitation}
            />
          ) : (
            <Room profile={props} musicPlaying={playing} onToggleMusic={toggleMusic} onOpenModal={setModal} modalActive={modal !== null} wishOpen={wishOpen} onWishOpenChange={setWishOpen} />
          )}

          {opened && modal === "gallery" && <GalleryModal profile={props} onClose={closeModal} />}
          {opened && modal === "story" && <StoryModal profile={props} onClose={closeModal} />}
          {opened && modal === "events" && <EventsModal profile={props} onClose={closeModal} />}
          {opened && modal === "couple" && <CoupleModal profile={props} onClose={closeModal} />}
          {opened && modal === "gift" && (
            <GiftModal
              accounts={Array.isArray(props.gift_accounts) ? props.gift_accounts : []}
              giftAddress={props.gift_address}
              giftAddressName={props.gift_address_name}
              onClose={closeModal}
            />
          )}
          {opened && modal === "family" && (
            <FamilyModal
              families={Array.isArray(props.inviting_families) ? props.inviting_families : []}
              onClose={closeModal}
            />
          )}
          {opened && modal === "video" && <VideoModal data={videoData} onClose={closeModal} />}
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
            anchor="bottom"
          />
        )}

        {hasTrack && (
          // Hidden from a11y tree; the music pill in the room is the control.
          <audio ref={audioRef} src={props.track_url} loop playsInline preload="none" />
        )}
      </div>
    </Skin>
  )
}