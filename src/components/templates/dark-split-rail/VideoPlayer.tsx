"use client"

import AutoplayYouTube from "../shared/AutoplayYouTube"

function ytId(embed: string) {
  return embed.split("/").filter(Boolean).pop() || ""
}

// Muted autoplay is the only autoplay mode browsers allow reliably. The clip
// still loops and keeps controls, so a tap can unmute/fullscreen it.
export default function VideoPlayer({ embed, title = "Video Pasangan" }: { embed: string; title?: string }) {
  const id = ytId(embed)
  if (!id) return null

  return (
    <div className="overflow-hidden rounded-sm">
      <div className="aspect-video w-full">
        <AutoplayYouTube videoId={id} title={title} controls />
      </div>
    </div>
  )
}
