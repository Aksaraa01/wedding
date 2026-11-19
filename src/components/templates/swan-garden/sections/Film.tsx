"use client"

import { Backdrop } from "../Ornaments"
import { video0, video1, video2 } from "../ornamentData"
import { videoSource } from "../../shared/lib"
import AutoplayYouTube from "../../shared/AutoplayYouTube"

type Props = {
  videoUrl: string
  title: string
  intro: string
  caption: string
  poster: string
}

export default function Film({ videoUrl, title, intro, caption, poster }: Props) {
  if (!videoUrl) return null
  const source = videoSource(videoUrl)
  const youtubeId = videoUrl.match(/([A-Za-z0-9_-]{11})(?:[?&#/]|$)/)?.[1] || ""

  return (
    <section className="video-gallery autoplay-video-section" data-section-order="gallery_video">
      <div className="inner">
        <div className="title">
          <h1>{title}</h1>
          {intro ? <p>{intro}</p> : null}
        </div>
        <div className="video-outer">
          <div className="video">
            <div className="p-relative">
              <Backdrop items={video0} />
              <div className="preview autoplay-video-box">
                {source?.kind === "file" ? (
                  <video className="autoplay-video" autoPlay muted loop playsInline poster={poster || undefined} controls>
                    <source src={source.src} />
                  </video>
                ) : youtubeId ? (
                  <div className="autoplay-video">
                    <AutoplayYouTube videoId={youtubeId} title={caption || title} />
                  </div>
                ) : null}
              </div>
              <Backdrop items={video1} />
            </div>
            <div className="title">
              <h2>{caption}</h2>
            </div>
            <Backdrop items={video2} />
          </div>
        </div>
      </div>
    </section>
  )
}
