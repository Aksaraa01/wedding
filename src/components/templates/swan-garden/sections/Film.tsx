"use client"

import { useState } from "react"
import { Backdrop } from "../Ornaments"
import { video0, video1, video2 } from "../ornamentData"
import { videoSource } from "../../shared/lib"

type Props = {
  videoUrl: string
  title: string
  intro: string
  caption: string
  poster: string
}

// The reference shows a YouTube poster with a play disc; tapping it starts the
// film. We keep that surface and mount the iframe straight away (no YouTube JS
// API), with the poster painted underneath so the frame is never an empty box.
export default function Film({ videoUrl, title, intro, caption, poster }: Props) {
  if (!videoUrl) return null
  const source = videoSource(videoUrl)
  // One capture group: /embed/ links (what the editor stores) and watch links
  // both resolve, so the poster and player never silently disappear.
  const youtubeId =
    videoUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/))([A-Za-z0-9_-]{11})/
    )?.[1] || ""
  const [started, setStarted] = useState(false)
  const ytPoster = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/maxresdefault.jpg` : ""
  const thumb = ytPoster || poster
  // A provider embed we cannot poster-frame (Vimeo, a custom player) still has
  // to render: mount it directly instead of leaving an empty box.
  const genericEmbed = !youtubeId && source?.kind === "embed"
  if (!source && !youtubeId) return null

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
              <div className={`preview autoplay-video-box${started ? " is-playing" : ""}`}>
                {genericEmbed ? (
                  <iframe
                    className="autoplay-video show"
                    src={source.src}
                    title={caption || title}
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : source?.kind === "file" ? (
                  <video className="autoplay-video show" autoPlay muted loop playsInline poster={poster || undefined} controls>
                    <source src={source.src} />
                  </video>
                ) : youtubeId ? (
                  <>
                    {thumb ? (
                      <img
                        className="sw-film__poster"
                        src={thumb}
                        alt=""
                        loading="lazy"
                        onError={(e) => {
                          const el = e.currentTarget
                          if (el.src.includes("maxresdefault")) el.src = `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`
                        }}
                      />
                    ) : null}
                    {started ? (
                      <iframe
                        className="autoplay-video show"
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=1&rel=0&modestbranding=1&playsinline=1`}
                        title={caption || title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <button type="button" className="play-btn" onClick={() => setStarted(true)} aria-label={caption || title}>
                        <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true">
                          <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
                        </svg>
                      </button>
                    )}
                  </>
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
