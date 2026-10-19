"use client"

import { useState } from "react"
import { FONT_BTN } from "./fonts"

function ytId(embed: string) {
  return embed.split("/").filter(Boolean).pop() || ""
}

// Click-to-play YouTube embed. Autoplay-in-an-iframe is blocked by most mobile
// browsers (which is why the clip appeared frozen), so we render a poster with a
// play button and only mount the iframe on an explicit tap — then it always
// plays. Mirrors the reference widget (muted, looping, with controls).
export default function VideoPlayer({ embed, title = "Video Pasangan" }: { embed: string; title?: string }) {
  const [started, setStarted] = useState(false)
  const id = ytId(embed)
  const poster = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : ""
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    controls: "1",
    playsinline: "1",
    rel: "0",
    playlist: id,
  })
  const src = `${embed}?${params.toString()}`

  if (started) {
    return (
      <div className="overflow-hidden rounded-sm">
        <iframe
          src={src}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="aspect-video w-full"
          style={{ border: 0 }}
        />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setStarted(true)}
      aria-label="Putar video"
      className="group relative block w-full overflow-hidden rounded-sm"
    >
      {poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={title}
          draggable={false}
          className="aspect-video w-full object-cover opacity-80 transition-opacity duration-500 group-hover:opacity-100"
        />
      ) : (
        <span className="block aspect-video w-full bg-neutral-800" />
      )}
      <span className="absolute inset-0 bg-black/30" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-[#1B1B18] shadow-lg transition-transform duration-300 group-hover:scale-110">
          <span className="material-symbols-outlined text-[36px]">play_arrow</span>
        </span>
      </span>
      <span
        className="absolute bottom-3 left-3 rounded-full bg-black/50 px-3 py-1 text-[11px] uppercase text-white"
        style={{ ...FONT_BTN, letterSpacing: "1px" }}
      >
        Putar Video
      </span>
    </button>
  )
}
