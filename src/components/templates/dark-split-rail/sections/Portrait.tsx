"use client"

import { toTransformedUrl } from "@/lib/storageUrl"
import { FONT_BODY } from "../fonts"
import Section, { SectionHeading } from "../Section"
import VideoPlayer from "../VideoPlayer"

type Props = {
  videoEmbed?: string
  photos: string[]
}

export default function Portrait({ videoEmbed, photos }: Props) {
  const gallery = photos.filter(Boolean)
  if (!videoEmbed && gallery.length === 0) return null

  return (
    <Section id="portrait" className="bg-black/[0.06]">
      <div className="text-center text-white">
        <SectionHeading>Portrait of Us</SectionHeading>

        {videoEmbed && (
          <div className="mt-6">
            <VideoPlayer embed={videoEmbed} />
          </div>
        )}

        {gallery.length > 0 && (
          <div className="mt-6 grid grid-cols-2 gap-1.5">
            {gallery.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${i}`}
                src={toTransformedUrl(src, { width: 700, resize: "cover" })}
                alt=""
                loading="lazy"
                draggable={false}
                className="aspect-[3/4] w-full rounded-sm object-cover transition-transform duration-700 hover:scale-105"
              />
            ))}
          </div>
        )}

        <p className="mt-4 text-[12px] text-white/60" style={FONT_BODY}>
          {gallery.length} Kenangan
        </p>
      </div>
    </Section>
  )
}
