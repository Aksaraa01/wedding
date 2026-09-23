"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import OpsHeader from "@/components/ops/OpsHeader"

type Track = {
  id: string
  title: string
  artist: string | null
  mood_category: string
  audio_url: string
  created_at: string
  is_custom: boolean
  uploaded_by: string | null
  uploaded_by_name: string | null
  is_public: boolean
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

export default function OpsMusicPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<{ id: string; name: string; role: string } | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState("")
  const [editingArtist, setEditingArtist] = useState("")
  const [uploadTitle, setUploadTitle] = useState("")
  const [uploadArtist, setUploadArtist] = useState("")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    const emp = JSON.parse(raw)
    if (emp.role === "sales") {
      router.replace("/ops")
      return
    }
    setEmployee(emp)
  }, [router])

  const fetchTracks = async () => {
    try {
      const res = await fetch("/api/tracks?scope=custom")
      const data = await res.json()
      setTracks(data.tracks || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!employee) return
    fetchTracks()
  }, [employee])

  const handleUpload = async (file: File) => {
    if (!employee) return
    setUploading(true)
    setUploadError("")
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("uploaded_by_name", employee.name)
      if (uploadTitle.trim()) formData.append("title", uploadTitle.trim())
      if (uploadArtist.trim()) formData.append("artist", uploadArtist.trim())
      const res = await fetch("/api/tracks", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || "Gagal mengunggah lagu")
        return
      }
      setUploadTitle("")
      setUploadArtist("")
      await fetchTracks()
    } catch {
      setUploadError("Gagal mengunggah lagu")
    } finally {
      setUploading(false)
    }
  }

  const togglePublic = async (track: Track) => {
    const res = await fetch(`/api/tracks/${track.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_public: !track.is_public }),
    })
    if (res.ok) await fetchTracks()
  }

  const saveTitle = async (track: Track) => {
    const title = editingTitle.trim()
    const artist = editingArtist.trim()
    const titleChanged = title && title !== track.title
    const artistChanged = artist !== (track.artist || "")
    if (!titleChanged && !artistChanged) {
      setEditingId(null)
      return
    }
    const res = await fetch(`/api/tracks/${track.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(titleChanged ? { title } : {}),
        ...(artistChanged ? { artist } : {}),
      }),
    })
    if (res.ok) {
      setEditingId(null)
      await fetchTracks()
    }
  }

  const handleDelete = async (track: Track) => {
    if (!window.confirm(`Hapus lagu "${track.title}"? Tindakan ini tidak dapat dibatalkan.`)) return
    setDeletingId(track.id)
    setUploadError("")
    try {
      const res = await fetch(`/api/tracks/${track.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        setUploadError(data.error || "Gagal menghapus lagu")
        return
      }
      await fetchTracks()
    } catch {
      setUploadError("Gagal menghapus lagu")
    } finally {
      setDeletingId(null)
    }
  }

  if (!employee) return null

  return (
    <>
      <PageTheme mode="light" />
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f2ede4; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1c1c16; }
      `}</style>

      <div className="min-h-screen bg-background text-on-surface antialiased font-body-md">
        <OpsHeader employee={employee} activeKey="music" />

        <main className="pt-24 pb-20 px-6 md:px-12 max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div>
              <span className="font-label-md text-xs uppercase tracking-[0.2em] text-secondary mb-2 block">
                Manajemen Musik
              </span>
              <h1 className="font-display-lg text-4xl md:text-5xl">Kelola Musik</h1>
              <p className="font-body-md text-sm text-on-surface-variant mt-3 max-w-xl">
                Semua musik: lagu unggahan pengguna &amp; staf dapat diubah judul atau dipublikasikan; lagu sistem ditandai Sistem.
              </p>
            </div>
            <div className="flex flex-col items-stretch md:items-end gap-2 md:w-72">
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Judul (opsional — default nama file)"
                className="w-full bg-white border border-outline-variant px-4 py-2.5 text-sm text-primary focus:border-primary focus:ring-0 outline-none"
              />
              <input
                type="text"
                value={uploadArtist}
                onChange={(e) => setUploadArtist(e.target.value)}
                placeholder="Penyanyi (opsional — kosong = disembunyikan)"
                className="w-full bg-white border border-outline-variant px-4 py-2.5 text-sm text-primary focus:border-primary focus:ring-0 outline-none"
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3.5 font-label-md text-xs uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${uploading ? "animate-spin" : ""}`}>
                  {uploading ? "progress_activity" : "upload_file"}
                </span>
                {uploading ? "Mengunggah..." : "Upload MP3"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="audio/*,.mp3"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                  e.target.value = ""
                }}
              />
              {uploadError && <p className="text-red-500 text-xs font-medium">{uploadError}</p>}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
              </div>
            ) : tracks.length === 0 ? (
              <div className="py-16 text-center opacity-40 italic font-body-md text-sm border border-dashed border-outline-variant">
                Belum ada musik
              </div>
            ) : (
              tracks.map((track) => {
                const isCustom = track.is_custom === true
                return (
                  <div key={track.id} className={`bg-white border p-4 md:p-5 flex flex-col gap-4 transition-colors ${isCustom ? "border-outline-variant hover:border-primary/40" : "border-outline-variant/40 opacity-70"}`}>
                    <div className="flex-none w-12 h-12 bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">{isCustom ? "music_note" : "library_music"}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {editingId === track.id ? (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveTitle(track)}
                            placeholder="Judul"
                            className="flex-1 bg-surface-container-low border border-outline-variant px-3 py-2 text-sm font-semibold text-primary focus:border-primary focus:ring-0 outline-none"
                            autoFocus
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingArtist}
                            onChange={(e) => setEditingArtist(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveTitle(track)}
                            placeholder="Penyanyi (opsional — kosongkan untuk sembunyikan)"
                            className="flex-1 bg-surface-container-low border border-outline-variant px-3 py-2 text-sm text-primary focus:border-primary focus:ring-0 outline-none"
                          />
                          <button onClick={() => saveTitle(track)} className="px-3 py-2 bg-primary text-white text-[10px] uppercase tracking-widest font-bold hover:bg-secondary">
                            Simpan
                          </button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-2 border border-outline-variant text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                          isCustom
                            ? "bg-secondary-container/70 text-on-secondary-container border border-secondary/30"
                            : "bg-surface-container-highest text-on-surface-variant border border-outline-variant"
                        }`}>
                          {isCustom ? "Unggahan" : "Sistem"}
                        </span>
                        <h3 className="font-display-lg text-base truncate">{track.title}</h3>
                        {isCustom && (
                          <button
                            onClick={() => { setEditingId(track.id); setEditingTitle(track.title); setEditingArtist(track.artist || "") }}
                            className="text-on-surface-variant hover:text-primary transition-colors shrink-0"
                            title="Ubah judul & penyanyi"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                        )}
                      </div>
                    )}
                    <p className="text-[11px] text-on-surface-variant mt-1 font-mono">
                      {isCustom ? (
                        <>Upload oleh: <span className="font-semibold">{track.uploaded_by_name || (track.uploaded_by ? "Pengguna" : "—")}</span> <span className="mx-2">•</span> Penyanyi: <span className="font-semibold">{track.artist || "—"}</span> <span className="mx-2">•</span> {formatDate(track.created_at)}</>
                      ) : (
                        <>Artis: <span className="font-semibold">{track.artist || "—"}</span> <span className="mx-2">•</span> Mood: {track.mood_category}</>
                      )}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
                    <audio controls preload="none" src={track.audio_url} className="h-9 w-full sm:w-56" />
                    {isCustom ? (
                      <>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          track.is_public
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-amber-100 text-amber-700 border border-amber-300"
                        }`}>
                          {track.is_public ? "Publik" : "Privat"}
                        </span>
                        <button
                          onClick={() => togglePublic(track)}
                          className={`px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold border transition-colors ${
                            track.is_public
                              ? "border-outline-variant text-on-surface-variant hover:bg-surface-container"
                              : "border-primary text-primary hover:bg-primary hover:text-white"
                          }`}
                        >
                          {track.is_public ? "Sembunyikan" : "Publikasikan"}
                        </button>
                        <button
                          onClick={() => handleDelete(track)}
                          disabled={deletingId === track.id}
                          className="px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                        >
                          {deletingId === track.id ? "Menghapus..." : "Hapus"}
                        </button>
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                        Default
                      </span>
                    )}
                  </div>
                </div>
                )
              })
            )}
          </div>
        </main>
      </div>
    </>
  )
}