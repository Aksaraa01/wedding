"use client"

import { forwardRef } from "react"

interface StorageAudioProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
  src: string
}

// Egress-safe audio for NEW code: preload none means zero bytes download
// until play() is called (guest taps Buka Undangan). Never eagerly preload
// invitation music — it fetched the full 3-8MB MP3 on every page load,
// including bounces that never open the invitation.
const StorageAudio = forwardRef<HTMLAudioElement, StorageAudioProps>(function StorageAudio(
  { src, loop = true, ...rest },
  ref
) {
  return <audio ref={ref} src={src} loop={loop} playsInline preload="none" {...rest} />
})

export default StorageAudio
