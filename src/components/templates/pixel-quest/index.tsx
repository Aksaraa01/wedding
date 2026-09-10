"use client"

import { useCallback, useRef, useState } from "react"
import type { TemplateProps } from "@/types/template"
import InvitationOverlay from "@/components/InvitationOverlay"
import { ASSETS } from "@/lib/assets"
import Skin from "../shared/Skin"
import PixelCover from "../pixel-paradise/Cover"
import Quest from "./Quest"

export default function PixelQuest(props: TemplateProps) {
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

  // Guest QR/RSVP dock shows only after the invitation opens, for identified
  // guests, and hides while the wishes feed is open.
  const showGuestDock = opened && !wishOpen && !!props.guest_id && !!props.wedding_profile_id
  const coupleName =
    (props.groom_full_name && props.bride_full_name
      ? `${props.groom_full_name} & ${props.bride_full_name}`
      : props.display_name) || `${props.groom_name || ""} & ${props.bride_name || ""}`

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
            />
          )}
        </div>

        {showGuestDock && (
          <InvitationOverlay
            guestId={props.guest_id!}
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
            bottom={110}
          />
        )}

        {hasTrack && <audio ref={audioRef} src={props.track_url} loop playsInline preload="auto" />}
      </div>
    </Skin>
  )
}