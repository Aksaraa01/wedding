"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"

type Template = {
  id: string
  name: string
  preview_image_url: string
}

function FeedbackNewInner({ id }: { id: string }) {
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [limit, setLimit] = useState({ max_revisions: 0, used_revisions: 0, remaining_revisions: 0, is_locked: false })
  const [area, setArea] = useState("")
  const [description, setDescription] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/${id}/web-invitation`),
      fetch(`/api/feedback-submissions/limit?wedding_profile_id=${id}`),
    ])
      .then(([profRes, limitRes]) => Promise.all([profRes.json(), limitRes.json()]))
      .then(([profData, limitData]) => {
        setTemplate(profData.template)
        setLimit(limitData)
        if (limitData.is_locked) {
          setError(`Batas revisi (${limitData.max_revisions} putaran) telah tercapai. Silakan hubungi konsultan Aksaraa.`)
        }
      })
      .catch(() => {})
  }, [id])

  function handleFilesUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const totalFiles = files.length + selected.length

    if (totalFiles > 5) {
      setError("Maksimal 5 file yang dapat diunggah.")
      return
    }

    for (const file of selected) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`Ukuran file "${file.name}" melebihi batas maksimal 5MB.`)
        return
      }
    }

    setError("")
    setFiles(prev => [...prev, ...selected])

    for (const file of selected) {
      const reader = new FileReader()
      reader.onload = ev => {
        setPreviews(prev => [...prev, ev.target?.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return
    setSaving(true)
    setError("")

    try {
      const imageUrls: string[] = []

      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        const uploadRes = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          if (uploadData.url) imageUrls.push(uploadData.url)
        }
      }

      const res = await fetch("/api/feedback-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_profile_id: id,
          template_id: template?.id || null,
          template_name: template?.name || "",
          area: area || null,
          description: description.trim(),
          image_url: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengirim feedback")
      }

      router.push(`/dashboard/${id}/web-invitation/feedback`)
    } catch (err) {
      setError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageTheme mode="light" />

      <header className="w-full top-0 sticky z-50 bg-surface flex items-center justify-between px-edge-margin-mobile py-6 border-b border-outline-variant/30">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-on-surface-variant hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="font-label-md text-label-md uppercase tracking-widest">Kembali</span>
        </button>
        <div className="w-10" />
      </header>

      <main className="max-w-container-max mx-auto px-edge-margin-mobile pt-10 pb-40">
        <section className="mb-12">
          <h1 className="font-headline-xl text-headline-md md:text-headline-xl mb-4 leading-tight">Feedback Anda</h1>
          <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Sampaikan revisi atau penyesuaian yang Anda inginkan untuk draf undangan{template ? <span className="italic font-semibold"> {template.name}</span> : ""}.
          </p>
          {limit.remaining_revisions > 0 && (
            <p className="font-label-md text-label-md text-on-surface-variant mt-2">
              Sisa revisi: <span className="font-semibold text-primary">{limit.remaining_revisions}</span> dari {limit.max_revisions} putaran
            </p>
          )}
        </section>

        <section className="mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 aspect-square bg-surface-container-low overflow-hidden relative group">
            <img
              src={template?.preview_image_url || "https://placehold.co/600x600/f5f0e8/8d4d39?text=Draft"}
              alt={template?.name || "Draft preview"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <div className="md:col-span-7 pt-4">
            <div className="flex items-start gap-4 mb-8">
              <span className="material-symbols-outlined text-primary text-3xl mt-1">auto_stories</span>
              <div>
                <h2 className="font-headline-md text-headline-md mb-2">Detail Revisi</h2>
                <p className="text-on-surface-variant font-body-md">
                  Satu langkah lebih dekat menuju narasi pernikahan sempurna Anda. Mohon uraikan perubahan dengan detail untuk memudahkan konsultan kami.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="font-body-md text-body-md text-rose-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="relative">
                <label className="font-label-md text-label-md uppercase tracking-widest block mb-4">Area yang Ingin Diubah</label>
                <select
                  value={area}
                  onChange={e => setArea(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant font-body-md py-3 px-4 appearance-none cursor-pointer rounded-none focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>Pilih area...</option>
                  <option value="Tipografi & Huruf">Tipografi & Huruf</option>
                  <option value="Foto & Visual">Foto & Visual</option>
                  <option value="Informasi Acara">Informasi Acara</option>
                  <option value="Tata Letak (Layout)">Tata Letak (Layout)</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <span className="material-symbols-outlined absolute right-0 bottom-3 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
              </div>

              <div>
                <label className="font-label-md text-label-md uppercase tracking-widest block mb-4">Deskripsi Masukan</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan detail revisi Anda di sini secara spesifik..."
                  className="w-full bg-surface-container-lowest border border-outline-variant font-body-md py-3 px-4 resize-none rounded-none focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="font-label-md text-label-md uppercase tracking-widest block mb-4">Unggah Referensi / Foto Pengganti (Opsional, Maks. 5 File)</label>
                <div className="border-2 border-dashed border-outline-variant hover:border-primary transition-colors cursor-pointer group p-8 flex flex-col items-center justify-center bg-surface-container-lowest relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFilesUpload}
                  />
                  {previews.length > 0 ? (
                    <div className="w-full space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {previews.map((src, i) => (
                          <div key={i} className="relative aspect-square bg-surface-container-highest rounded overflow-hidden border border-outline-variant group/image">
                            <img src={src} alt={`Referensi ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeFile(i)}
                              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover/image:opacity-100 transition-opacity"
                            >
                              close
                            </button>
                          </div>
                        ))}
                        {previews.length < 5 && (
                          <div className="aspect-square border-2 border-dashed border-outline-variant rounded flex items-center justify-center text-outline hover:border-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">add</span>
                          </div>
                        )}
                      </div>
                      <p className="font-label-md text-label-md text-on-surface-variant text-center">{files.length}/5 file dipilih</p>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant group-hover:text-primary transition-colors mb-4" style={{ fontVariationSettings: "'wght' 200" }}>add_photo_alternate</span>
                      <p className="font-body-md text-body-md text-on-surface-variant group-hover:text-primary transition-colors">Seret file atau klik untuk unggah</p>
                      <p className="text-[10px] uppercase tracking-tighter mt-2 text-outline">JPG, PNG (Maks. 5MB per file, max 5 file)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="fixed bottom-0 left-0 w-full z-50 border-t border-outline-variant/20 px-edge-margin-mobile py-6 bg-surface">
                <div className="max-w-container-max mx-auto flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={saving || !description.trim() || limit.is_locked}
                    className="w-full bg-primary text-surface py-5 px-8 font-label-md text-label-md uppercase tracking-widest hover:bg-secondary transition-all duration-300 transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Mengirim..." : "Kirim Umpan Balik ke Konsultan"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="w-full border border-outline text-on-surface py-5 px-8 font-label-md text-label-md uppercase tracking-widest hover:bg-surface-variant transition-all duration-300"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <FeedbackNewInner id={id} />
}
