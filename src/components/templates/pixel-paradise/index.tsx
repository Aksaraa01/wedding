"use client"

import { useCallback, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import { resolveCoupleName } from "@/lib/coupleName"
import InvitationOverlay from "@/components/InvitationOverlay"
import Skin from "../shared/Skin"
import PixelCover from "./Cover"
import PixelRoom, { type ModalKind } from "./Room"
import GalleryModal from "./modals/GalleryModal"
import StoryModal from "./modals/StoryModal"
import EventsModal from "./modals/EventsModal"
import CoupleModal from "./modals/CoupleModal"
import GiftModal from "./modals/GiftModal"
import FamilyModal from "./modals/FamilyModal"
import VideoModal, { type VideoModalData } from "./modals/VideoModal"
import { normalizeVideoUrl } from "../shared/lib"
import { normalizeLanguage, t } from "@/lib/i18n"

export default function PixelParadise(props: TemplateProps) {
  const lang = normalizeLanguage(props.language)
  const [opened, setOpened] = useState(false)
  const [modal, setModal] = useState<ModalKind | null>(null)
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

  const closeModal = useCallback(() => setModal(null), [])
  const onWishOpenChange = useCallback((open: boolean) => setWishOpen(open), [])

  // Guest QR/RSVP dock shows only after the invitation opens, for identified
  // guests, and hides while a modal or the wishes feed is open.
  const showGuestDock = opened && !modal && !wishOpen && (!!props.guest_id || (props.guest_link_strict === false && !!props.guest_slug)) && !!props.wedding_profile_id
  const coupleName = resolveCoupleName(props)

  const videoEmbed = normalizeVideoUrl(props.video_url)
  const videoData: VideoModalData = videoEmbed ? { state: "ready", videoUrl: videoEmbed } : { state: "none" }

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
            />
          ) : (
            <PixelRoom
              profile={props}
              musicPlaying={playing}
              onToggleMusic={toggleMusic}
              onOpenModal={setModal}
              modalActive={modal !== null}
              wishOpen={wishOpen}
              onWishOpenChange={onWishOpenChange}
            />
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
            <FamilyModal families={Array.isArray(props.inviting_families) ? props.inviting_families : []} onClose={closeModal} language={props.language} />
          )}
          {opened && modal === "video" && <VideoModal data={videoData} onClose={closeModal} language={props.language} />}
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
            bottom={64}
            language={lang}
          />
        )}

        {hasTrack && <audio ref={audioRef} src={props.track_url} loop playsInline preload="none" />}
      </div>
    </Skin>
  )
}
