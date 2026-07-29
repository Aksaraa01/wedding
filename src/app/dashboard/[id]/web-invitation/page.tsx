"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import TemplatePreviewModal from "@/components/TemplatePreviewModal"

type Profile = {
  id: string
  bride_name: string
  groom_name: string
  slug: string
}

type Template = {
  id: string
  code: string
  name: string
  description: string
  preview_image_url: string
  demo_url: string
}

type Track = {
  id: string
  title: string
  artist: string
  mood_category: string
  audio_url: string
}

const moodLabels: Record<string, string> = {
  "klasik-abad": "Klasik & Abadi",
  "modern-romantis": "Modern Romantis",
  "nusantara-heritage": "Nusantara Heritage",
}

function proxyAudio(url: string) {
  const trimmed = url.trim()
  if (trimmed.includes("drive.usercontent.google.com") || trimmed.includes("drive.google.com")) {
    return `/api/audio-proxy?url=${encodeURIComponent(trimmed)}`
  }
  return trimmed
}

function WebInvitationInner({ id }: { id: string }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [template, setTemplate] = useState<Template | null>(null)
  const [track, setTrack] = useState<Track | null>(null)
  const [allTracks, setAllTracks] = useState<Track[]>([])
  const [activeMood, setActiveMood] = useState("")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    fetch(`/api/dashboard/${id}/web-invitation`)
      .then(r => r.json())
      .then(data => {
        setProfile(data.profile)
        setTemplate(data.template)
        setTrack(data.track)
      })
    fetch("/api/tracks")
      .then(r => r.json())
      .then(data => {
        const tracks = data.tracks || []
        setAllTracks(tracks)
        const moods = [...new Set(tracks.map((t: Track) => t.mood_category))] as string[]
        if (moods.length > 0) setActiveMood(moods[0])
      })
  }, [id])

  const moods = [...new Set(allTracks.map(t => t.mood_category))]
  const filteredTracks = allTracks.filter(t => t.mood_category === activeMood)

  const handlePlay = (t: Track) => {
    const url = proxyAudio(t.audio_url)
    if (!url) return
    if (playingId === t.id) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) audioRef.current.pause()
      const audio = new Audio(url)
      audio.onended = () => setPlayingId(null)
      audio.play().catch(() => {})
      audioRef.current = audio
      setPlayingId(t.id)
    }
  }

  const handleSelectTrack = async (trackId: string) => {
    await fetch(`/api/dashboard/${id}/web-invitation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_track_id: trackId }),
    })
    setTrack(allTracks.find(t => t.id === trackId) || null)
  }

  return (
    <>
      <PageTheme mode="light" />

      <header className="px-edge-margin-mobile pt-8 pb-12">
        <button
          onClick={() => router.push(`/dashboard/${id}`)}
          className="inline-flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:opacity-70 transition-opacity mb-8"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
        <h1 className="font-headline-md text-headline-md text-primary mb-4 leading-tight">Progres Undangan Digital Anda</h1>
      </header>

      <main className="min-h-screen pb-32">
        {template ? (
          <>
            <section className="px-edge-margin-mobile mb-12">
              <div className="flex flex-col items-center text-center">
                <div className="w-full max-w-[400px] mx-auto mb-12 relative">
                  <div className="aspect-[4/5] w-full overflow-hidden rounded-lg shadow-2xl">
                    <img
                      alt={`Mockup ${template.name}`}
                      className="w-full h-full object-cover grayscale-[0.2] hover:scale-105 transition-transform duration-700 ease-out"
                      src={template.preview_image_url}
                    />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r border-b border-primary/20 pointer-events-none" />
                  <div className="absolute -top-4 -left-4 w-24 h-24 border-l border-t border-primary/20 pointer-events-none" />
                </div>

                <div className="max-w-2xl mx-auto">
                  <span className="font-label-md text-label-md uppercase tracking-[0.2em] text-secondary block mb-4">
                    Koleksi Pilihan Anda
                  </span>
                  <h2 className="font-headline-xl text-headline-xl text-primary mb-6">{template.name}</h2>

                  <div className="flex flex-col gap-6 items-center">
                    <button
                      onClick={() => router.push(`/dashboard/${id}/web-invitation/templates`)}
                      className="group flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-primary transition-all"
                    >
                      <span className="material-symbols-outlined text-[20px]">sync</span>
                      <span className="border-b border-primary/30 group-hover:border-primary pb-0.5 transition-all">
                        Ganti Pilihan Template
                      </span>
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/${id}/web-invitation/feedback`)}
                      className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                    >
                      Lihat Riwayat Feedback
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="px-edge-margin-mobile mb-12">
            <div className="py-16 flex flex-col items-center text-center max-w-md mx-auto">
              <span className="material-symbols-outlined text-6xl text-outline/40 mb-6" style={{ fontVariationSettings: "'wght' 200" }}>
                diamond
              </span>
              <h2 className="font-headline-md text-headline-md text-primary mb-2">Belum Memilih Template</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">
                Pilih template undangan digital untuk memulai.
              </p>
              <button
                onClick={() => router.push(`/dashboard/${id}/web-invitation/templates`)}
                className="bg-primary text-on-primary font-label-md text-label-md uppercase tracking-widest py-4 px-12 hover:bg-secondary transition-colors"
              >
                Pilih Template
              </button>
            </div>
          </section>
        )}

        <section className="px-edge-margin-mobile mb-section-gap">
          <div className="mb-8">
            <h2 className="font-headline-md text-headline-md text-primary mb-2">Kurasi Musik Latar</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Pilih harmoni yang akan menemani tamu Anda menjelajahi narasi pernikahan Anda.
            </p>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-edge-margin-mobile px-edge-margin-mobile mb-8">
            {moods.map(mood => (
              <button
                key={mood}
                onClick={() => setActiveMood(mood)}
                className={`px-5 py-2 whitespace-nowrap font-label-md text-label-md uppercase border transition-colors ${
                  activeMood === mood
                    ? "border-primary bg-primary text-white"
                    : "border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"
                }`}
              >
                {moodLabels[mood] || mood}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredTracks.map(t => (
              <div
                key={t.id}
                className={`group flex items-center justify-between p-4 border transition-colors ${
                  track?.id === t.id
                    ? "border-primary bg-surface-container-low"
                    : "border-outline-variant/30 hover:border-primary bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <button onClick={() => handlePlay(t)} disabled={!t.audio_url}>
                    <span
                      className={`material-symbols-outlined ${t.audio_url ? "cursor-pointer" : "opacity-30"} ${playingId === t.id ? "text-primary" : "text-on-surface-variant group-hover:text-primary"}`}
                      style={playingId === t.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {!t.audio_url ? "music_note" : playingId === t.id ? "pause_circle" : "play_circle"}
                    </span>
                  </button>
                  <div>
                    <p className="font-body-md text-body-md text-primary font-semibold">{t.title}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{t.artist}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleSelectTrack(t.id)}
                  className="w-6 h-6 rounded-full border flex items-center justify-center"
                  style={{ borderColor: track?.id === t.id ? "var(--color-primary, #000)" : "var(--color-outline, #747878)" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: track?.id === t.id ? "var(--color-primary, #000)" : "transparent" }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full px-edge-margin-mobile pb-8 pt-4 bg-surface/90 backdrop-blur-sm z-50">
        <button className="w-full bg-primary text-white py-5 px-8 font-label-md text-label-md uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-transform">
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Hubungi Konsultan Aksara
        </button>
      </div>

      {previewTemplate && (
        <TemplatePreviewModal
          name={previewTemplate.name}
          demoUrl={previewTemplate.demo_url}
          code={previewTemplate.code}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <WebInvitationInner id={id} />
}
