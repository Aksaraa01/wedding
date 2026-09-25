"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { compressImage } from "@/lib/imageCompress"

type Template = {
  id: string
  name: string
  preview_image_url: string
}

function FeedbackNewInner({ id }: { id: string }) {
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [limit, setLimit] = useState({ max_revisions: 0, used_revisions: 0, remaining_revisions: 0, is_locked: false })
  const [packageType, setPackageType] = useState("")
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
        setPackageType(profData.profile?.package_type || "")
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
        // Compress phone photos client-side so feedback screenshots don't land
        // in storage as multi-MB originals (bandwidth + egress on every view).
        const compressed = file.type.startsWith("image/") ? await compressImage(file) : file
        const formData = new FormData()
        formData.append("file", compressed)
        const uploadRes = await fetch("/api/media/upload", {
          method: "POST",
          body: formData,
        })
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json()
          if (uploadData.url) imageUrls.push(uploadData.url)
        }
      }

      // Ops attribution (server-side audit): when this form is opened by
      // an ops employee, their session identity travels with the submit
      // so the server can log it — no entry-point flag needed.
      const submitHeaders: Record<string, string> = { "Content-Type": "application/json" }
      try {
        const empRaw = sessionStorage.getItem("ops_employee")
        const emp = empRaw ? JSON.parse(empRaw) : null
        if (emp?.phone_number) {
          submitHeaders["x-ops-phone"] = emp.phone_number
          submitHeaders["x-ops-role"] = emp.role || ""
        }
      } catch {}
      const res = await fetch("/api/feedback-submissions", {
        method: "POST",
        headers: submitHeaders,
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

      // Ops attribution is handled server-side (x-ops headers above) —
      // no second fetch needed.

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

      <header className="w-full top-0 sticky z-50 bg-[#FAF7F2]/90 backdrop-blur-md flex items-center justify-between px-edge-margin-mobile py-6 border-b border-[#E2D9CF]">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) router.back()
            else router.push(`/dashboard/${id}/web-invitation/feedback`)
          }}
          className="flex items-center gap-2 text-on-surface-variant hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          <span className="font-label-md text-label-md uppercase tracking-widest">Kembali</span>
        </button>
        <div className="w-10" />
      </header>

      <main className="max-w-container-max mx-auto px-edge-margin-mobile pt-10 pb-40 bg-[#FAF7F2]">
        <section className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h1 className="font-headline-xl text-headline-md md:text-headline-xl leading-tight">Feedback Anda</h1>
            {limit.remaining_revisions > 0 && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFFBEB] border border-[#FDE68A] text-[#78350F] font-label-md text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <span className="material-symbols-outlined text-[14px]">history_edu</span>
                Sisa Revisi: {limit.remaining_revisions} dari {limit.max_revisions}
              </span>
            )}
          </div>
          <p className="font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
            Sampaikan revisi atau penyesuaian yang Anda inginkan untuk draf undangan{template ? <span className="italic font-semibold"> {template.name}</span> : ""}.
          </p>
        </section>

        <section className="mb-16 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5 aspect-square bg-surface-container-low overflow-hidden relative group rounded-2xl border border-[#E2D9CF]">
            <img
              src={template?.preview_image_url || "https://placehold.co/600x600/f5f0e8/8d4d39?text=Draft"}
              alt={template?.name || "Draft preview"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <div className="md:col-span-7">
            <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 md:p-8 shadow-sm">
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
                  className="w-full bg-white border border-[#D1C7BD] font-body-md py-3 px-4 appearance-none cursor-pointer rounded-lg focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors"
                >
                  <option value="" disabled>Pilih area...</option>
                  <option value="Tipografi & Huruf">Tipografi & Huruf</option>
                  <option value="Foto & Visual">Foto & Visual</option>
                  <option value="Informasi Acara">Informasi Acara</option>
                  <option value="Tata Letak (Layout)">Tata Letak (Layout)</option>
                  {(packageType === "bonus_full_custom" || packageType === "elite") && <option value="Full Custom / Penuh Design Baru">Full Custom / Penuh Design Baru</option>}
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
                  className="w-full bg-white border border-[#D1C7BD] font-body-md py-3 px-4 resize-none rounded-lg focus:outline-none focus:border-[#B34E3F] focus:ring-1 focus:ring-[#B34E3F] transition-colors"
                  required
                />
              </div>

              <div>
                <label className="font-label-md text-label-md uppercase tracking-widest block mb-4">Unggah Referensi / Foto Pengganti (Opsional, Maks. 5 File)</label>
                <div className="border-2 border-dashed border-[#D1C7BD] hover:border-[#B34E3F] transition-colors cursor-pointer group p-8 flex flex-col items-center justify-center bg-[#FAF7F2] rounded-2xl relative">
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
                          <div key={i} className="relative aspect-square bg-surface-container-highest rounded overflow-hidden border border-[#E2D9CF] group/image">
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
                          <div className="aspect-square border-2 border-dashed border-[#D1C7BD] rounded flex items-center justify-center text-[#B34E3F] hover:border-[#B34E3F] transition-colors">
                            <span className="material-symbols-outlined text-2xl">add</span>
                          </div>
                        )}
                      </div>
                      <p className="font-label-md text-label-md text-on-surface-variant text-center">{files.length}/5 file dipilih</p>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-[#B34E3F] group-hover:text-[#9E3B2D] transition-colors mb-4" style={{ fontVariationSettings: "'wght' 200" }}>add_photo_alternate</span>
                      <p className="font-body-md text-body-md text-[#2C2A29] group-hover:text-[#B34E3F] transition-colors">Seret file atau klik untuk unggah</p>
                      <p className="text-[10px] uppercase tracking-tighter mt-2 text-on-surface-variant/60">JPG, PNG (Maks. 5MB per file, max 5 file)</p>
                    </>
                  )}
                </div>
              </div>

              <div className="fixed bottom-0 left-0 w-full z-50 border-t border-[#E2D9CF] px-edge-margin-mobile py-6 bg-white/95 backdrop-blur-md">
                <div className="max-w-container-max mx-auto flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={saving || !description.trim() || limit.is_locked}
                    className="w-full bg-[#B34E3F] text-white py-5 px-8 rounded-full font-label-md text-label-md font-bold uppercase tracking-widest hover:bg-[#9E3B2D] transition-all duration-300 transform active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {saving ? "Mengirim..." : "Kirim Umpan Balik ke Konsultan"}
                  </button>
                  <button
                    type="button"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) router.back()
            else router.push(`/dashboard/${id}/web-invitation/feedback`)
          }}
                    className="w-full border border-[#E2D9CF] text-[#2C2A29] py-5 px-8 rounded-full font-label-md text-label-md uppercase tracking-widest hover:bg-[#FAF7F2] transition-all duration-300"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </form>
            </div>
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
