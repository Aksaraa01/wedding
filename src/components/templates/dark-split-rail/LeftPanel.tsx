"use client"

import { FONT_DISPLAY } from "./fonts"
import Slideshow from "./Slideshow"

export type PanelMedia = "cover" | "video" | "story"

type Props = {
  photos: string[]
  storyImage?: string
  active: PanelMedia
  coupleLabel: string
}

// Sticky full-bleed media panel for the desktop split layout: a photo slideshow
// (all of the couple's cover photos) that cross-fades into the story image as the
// guest scrolls. The couple's video is rendered as the page's fixed background
// (see BackgroundVideo), so it shows through the rail column on desktop + mobile.
// Hidden on mobile (rail goes full width).
export default function LeftPanel({ photos, storyImage, active, coupleLabel }: Props) {
  const list = photos.filter(Boolean)
  return (
    <div className="relative hidden lg:block lg:h-screen lg:flex-1 lg:sticky lg:top-0 overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Slideshow images={list} className="h-full w-full" />
      </div>
      {storyImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={storyImage}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1400ms] ease-in-out"
          style={{ opacity: active === "story" ? 1 : 0 }}
        />
      )}

      <div className="absolute inset-0 bg-black/35" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />

      <div className="absolute bottom-10 left-10 right-10 flex items-end justify-between">
        <p className="text-[26px] text-white/95" style={{ ...FONT_DISPLAY, letterSpacing: "2px" }}>
          {coupleLabel}
        </p>
        <span className="text-[11px] uppercase text-white/60" style={{ letterSpacing: "0.35em" }}>
          The Wedding
        </span>
      </div>
    </div>
  )
}
