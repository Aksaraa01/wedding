"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import ProfileMenu from "@/components/ProfileMenu"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"
import { toTransformedUrl } from "@/lib/storageUrl"
import StorageImage from "@/components/StorageImage"
import { ASSETS } from "@/lib/assets"
import { downloadBlob, sharePhoto, displayCategory } from "@/lib/gallery-client"
import { paymentWaLink } from "@/lib/contact"
import { StandeeFront, hashtagOf, type StandeeData } from "@/components/galeri/StandeeCards"
import { GALERI_FRAME_IDS, GALERI_FRAME_NAMES, GALERI_FRAME_THUMBS, normalizeFrameSelection, type FrameSelection, type GaleriFrameId } from "@/lib/galeriFrames"
import { GALERI_CAMERAS, normalizeCameraId, CAMERA_SWATCH_IMG, type GaleriCameraId } from "@/lib/galeriCameras"

type GuestPhoto = {
  id: string
  image_url: string
  created_at: string
  guest_id: string | null
  device_id: string | null
  uploader_name: string | null
  category: string | null
  caption: string | null
  source?: string | null
  guests: { name: string; category: string; is_checked_in?: boolean | null; rsvp_message?: string | null } | null
}

type Setup = {
  package_type: string
  is_gallery: boolean
  galeri_addon?: boolean
  galeri_enabled?: boolean
  galeri_photos_per_guest?: number | null
  galeri_guest_count?: number | null
  galeri_tier?: string | null
  galeri_price?: number
  galeri_quota_photos_per_guest?: number | null
  galeri_quota_guests?: number | null
  galeri_event_cap?: number | null
  payment_status: "UNPAID" | "PARTIAL_DP" | "FULLY_PAID"
  gallery_token: string | null
  gallery_url: string | null
  gallery_couple_name: string
  gallery_frame?: string | null
  gallery_camera?: string | null
  gallery_photo_url: string | null
  gallery_start_at: string | null
  gallery_end_at: string | null
  date_label: string
  start_label: string
  end_label: string
  prefill?: { date: string; start_time: string; photo_url?: string | null } | null
}

type Pill = "all" | "gallery" | "selfie"

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }
const CAPTION_FONT: React.CSSProperties = { fontFamily: "'EB Garamond', Georgia, serif" }

function formatDeletionDate(date: string): string {
  const [y, m, d] = date.split("-")
  return `${d}-${m}-${y}`
}

function wibDateInput(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
  } catch {
    return ""
  }
}

function wibTimeInput(iso: string | null): string {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" })
  } catch {
    return ""
  }
}

function formatCardStamp(iso: string): string {
  try {
    const d = new Date(iso)
    const date = d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })
    const time = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }).replace(".", ":")
    return `${date} • ${time} WIB`
  } catch {
    return ""
  }
}

function displayNameOf(p: GuestPhoto): string {
  return p.uploader_name || p.guests?.name || "Tamu"
}

export default function GaleriKenangan({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [setup, setSetup] = useState<Setup | null>(null)
  const [stats, setStats] = useState({ photos: 0, devices: 0 })
  const [photos, setPhotos] = useState<GuestPhoto[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [pill, setPill] = useState<Pill>("all")
  // Name search is a Galeri Tamu exclusive; Buku Tamu Digital keeps pills.
  const [search, setSearch] = useState("")
  const [debouncedQ, setDebouncedQ] = useState("")
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [retention, setRetention] = useState<{ hasEventDate: boolean; latestEventDate: string | null; deletionDate: string | null }>({ hasEventDate: false, latestEventDate: null, deletionDate: null })
  const [downloadingAll, setDownloadingAll] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState("")
  const [showPaywall, setShowPaywall] = useState(false)
  const [frameSaving, setFrameSaving] = useState<string | null>(null)

  // Detail card: collapsible + view/edit (only three fields by design).
  // Defaults open until the first photo lands, then collapses (once).
  const [cardOpen, setCardOpen] = useState(true)
  const cardInitRef = useRef(false)
  const [coupleName, setCoupleName] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // QR card.
  const [qr, setQr] = useState<{ gallery_url: string; qr_png: string | null } | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrCopied, setQrCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const fetchSetup = useCallback(async () => {
    const res = await fetch(`/api/dashboard/${id}/gallery-setup`)
    if (!res.ok) return
    const data = await res.json()
    if (data.setup) {
      const s = data.setup as Setup
      setSetup(s)
      if (!s.gallery_start_at) setEditing(true)
      setCoupleName(s.gallery_couple_name || "")
      // Stored values win; editor prefill fills the rest while unconfigured.
      setEventDate(wibDateInput(s.gallery_start_at) || s.prefill?.date || "")
      setStartTime(wibTimeInput(s.gallery_start_at) || s.prefill?.start_time || "")
      setEndTime(wibTimeInput(s.gallery_end_at))
    }
    if (data.stats) setStats(data.stats)
  }, [id])

  const fetchPhotos = useCallback(async (p: number, pillValue: Pill, q: string, append: boolean) => {
    if (append) setLoadingMore(true)
    try {
      const sourceParam = pillValue === "all" ? "" : `&source=${pillValue}`
      const qParam = q ? `&q=${encodeURIComponent(q)}` : ""
      const res = await fetch(`/api/guest-photos?wedding_profile_id=${id}&page=${p}${sourceParam}${qParam}`)
      const data = await res.json().catch(() => null)
      if (data?.photos) {
        setPhotos((prev) => (append ? [...prev, ...data.photos] : data.photos))
        setTotal(data.total || 0)
        setPage(data.page || p)
        setHasMore(!!data.has_more)
      }
      if (data?.hasEventDate !== undefined) {
        setRetention({ hasEventDate: data.hasEventDate, latestEventDate: data.latestEventDate, deletionDate: data.deletionDate })
      }
      return (data?.total as number) || 0
    } finally {
      if (append) setLoadingMore(false)
    }
  }, [id])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchSetup(), fetchPhotos(1, "all", "", false)])
      .then(([, total]) => {
        if (!cardInitRef.current) {
          cardInitRef.current = true
          setCardOpen((total as number) === 0)
        }
      })
      .finally(() => setLoading(false))
  }, [fetchSetup, fetchPhotos])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(search.trim()), 400)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    // Skip the initial run (covered by the mount fetch above).
    setPhotos([])
    fetchPhotos(1, pill, debouncedQ, false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ])

  const switchPill = (next: Pill) => {
    if (next === pill) return
    setPill(next)
    setPhotos([])
    fetchPhotos(1, next, debouncedQ, false)
  }

  const isUnpaid = setup?.payment_status === "UNPAID"
  // Unduh + Buku Kenangan stay paywalled: unpaid couples get the payment
  // popup (same WA redirect as /qr-guestbook) instead of the action.
  const requirePaid = () => {
    if (isUnpaid) {
      setShowPaywall(true)
      return false
    }
    return true
  }
  const isGalleryPkg = !!setup?.is_gallery
  // Detail card + setup belongs to every GT surface: standalone band
  // packages, the Undangan add-on, and Buku Tamu Digital (feature-bundled).
  const hasGaleri = isGalleryPkg || setup?.galeri_addon === true || setup?.galeri_enabled === true
  // Filter pills belong to Buku Tamu Digital only (not standalone GT,
  // not Undangan + Galeri combos).
  const isDgbPkg = (setup?.package_type || "").startsWith("dgb_")
  const configured = !!setup?.gallery_start_at

  const statusLine = !configured
    ? "Lengkapi detail acara untuk menerbitkan QR"
    : isUnpaid
      ? "Selesaikan pembayaran untuk mengaktifkan QR"
      : (() => {
          const now = Date.now()
          const start = setup?.gallery_start_at ? new Date(setup.gallery_start_at).getTime() : NaN
          const end = setup?.gallery_end_at ? new Date(setup.gallery_end_at).getTime() : NaN
          if (Number.isNaN(start) || Number.isNaN(end)) return "Jadwal belum valid"
          if (now < start - 3600000) return "Acara Siap Dimulai • QR aktif 1 jam sebelum mulai"
          if (now > end + 3600000) return "Acara Selesai • QR tidak aktif"
          return "Acara Siap Dimulai • QR Tamu Aktif"
        })()

  const handleSaveSetup = async () => {
    if (!coupleName.trim() || !eventDate || !startTime || !endTime) {
      setSaveError("Lengkapi nama mempelai, tanggal, jam mulai, dan jam selesai.")
      return
    }
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch(`/api/dashboard/${id}/gallery-setup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ couple_name: coupleName.trim(), date: eventDate, start_time: startTime, end_time: endTime }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan")
      setEditing(false)
      setQr(null)
      await fetchSetup()
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan")
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/dashboard/${id}/gallery-setup`, { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto")
      await fetchSetup()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengunggah foto")
    } finally {
      setUploadingPhoto(false)
    }
  }

  const loadQr = async () => {
    setQrLoading(true)
    try {
      const res = await fetch(`/api/dashboard/${id}/gallery-qr`)
      const data = await res.json().catch(() => ({}))
      if (res.ok) setQr({ gallery_url: data.gallery_url, qr_png: data.qr_png || null })
    } finally {
      setQrLoading(false)
    }
  }

  const copyQrLink = async () => {
    if (!qr?.gallery_url) return
    try {
      await navigator.clipboard.writeText(qr.gallery_url)
      setQrCopied(true)
      setTimeout(() => setQrCopied(false), 2000)
    } catch {}
  }

  // Standee display faces are self-hosted in fonts.css — no runtime
  // font fetch needed before rasterizing.

  const [dlBusy, setDlBusy] = useState(false)

  // Unduh Standee: renders the full front card off-screen and rasterizes
  // the card node itself — the PNG is exactly the card, no outer frame.
  const downloadStandee = async () => {
    if (dlBusy || !qr?.qr_png || !setup) return
    setDlBusy(true)
    let host: HTMLDivElement | null = null
    let root: { unmount: () => void } | null = null
    try {
      let venue = ""
      try {
        const dres = await fetch(`/api/dashboard/${id}`)
        if (dres.ok) {
          const ddata = await dres.json()
          const sessions = ddata.profile?.sessions
          if (Array.isArray(sessions) && sessions[0]?.venue) venue = String(sessions[0].venue)
        }
      } catch {}
      const coupleName = setup.gallery_couple_name || "Mempelai"
      const data: StandeeData = {
        couple: coupleName,
        dateLine: [setup.date_label || "", venue].filter(Boolean).join(" • "),
        qrPng: qr.qr_png,
        qrUrl: qr.gallery_url,
        hashtag: hashtagOf(coupleName),
        sigDate: "",
      }
      host = document.createElement("div")
      host.style.cssText = "position:absolute;left:-10000px;top:0;width:530px;"
      document.body.appendChild(host)
      const { createRoot } = await import("react-dom/client")
      root = createRoot(host)
      await new Promise<void>((res) => {
        ;(root as unknown as { render: (n: React.ReactNode) => void }).render(
          <div style={{ width: 530 }}>
            <StandeeFront data={data} />
          </div>
        )
        setTimeout(res, 80)
      })
      try {
        await (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready
      } catch {}
      const imgs = Array.from(host.querySelectorAll("img"))
      await Promise.all(imgs.map((img) => (img as HTMLImageElement).decode?.().catch(() => {})))
      await new Promise((r) => setTimeout(r, 250))
      const node = host.firstElementChild as HTMLElement | null
      if (!node) throw new Error("render gagal")
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(node, { scale: 3, useCORS: true, backgroundColor: "#FAF7F2", logging: false })
      const slug = coupleName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "acara"
      const link = document.createElement("a")
      link.href = canvas.toDataURL("image/png")
      link.download = `standee-galeri-${slug}.png`
      link.click()
    } catch {
      alert("Gagal mengunduh standee.")
    } finally {
      try { root?.unmount() } catch {}
      host?.remove()
      setDlBusy(false)
    }
  }

  const regenerateQr = async () => {
    if (!confirm("Buat QR baru? QR yang sudah dicetak sebelumnya tidak akan berfungsi lagi.")) return
    setRegenerating(true)
    try {
      const res = await fetch(`/api/dashboard/${id}/gallery-qr`, { method: "POST" })
      if (res.ok) {
        setQr(null)
        await fetchSetup()
        await loadQr()
      }
    } finally {
      setRegenerating(false)
    }
  }

  const downloadSingle = async (url: string, filename: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      await downloadBlob(blob, filename)
    } catch {
      window.open(url, "_blank")
    }
  }

  const shareSingle = async (photo: GuestPhoto) => {
    const name = displayNameOf(photo)
    try {
      const res = await fetch(photo.image_url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const ext = (blob.type.split("/")[1] || "jpg").split("+")[0]
      const file = new File([blob], `${name}-${photo.id}.${ext}`, { type: blob.type || "image/jpeg" })
      const text = photo.caption
        ? `${photo.caption} — ${name} untuk ${setup?.gallery_couple_name || ""}`
        : `Kenangan dari ${name} untuk ${setup?.gallery_couple_name || ""}`
      const outcome = await sharePhoto({ file, title: `Kenangan untuk ${setup?.gallery_couple_name || "mempelai"}`, text })
      if (outcome === "unsupported") {
        await downloadSingle(photo.image_url, `${name}-${photo.id}.${ext}`)
      }
    } catch {
      window.open(photo.image_url, "_blank")
    }
  }

  // Chunked manifest + browser-side zip: the VPS never holds the archive in
  // memory, and progress stays visible for 400–600-photo events.
  const downloadAll = async () => {
    if (!requirePaid()) return
    if (downloadingAll) return
    setDownloadingAll(true)
    setDownloadProgress("Menyiapkan daftar...")
    try {
      const manifest: { url: string; name: string }[] = []
      const captionChunks: string[] = []
      const CHUNK = 200
      let offset = 0
      let grandTotal = 0
      for (;;) {
        const res = await fetch(`/api/guest-photos/download-all?wedding_profile_id=${id}&offset=${offset}&limit=${CHUNK}`)
        if (!res.ok) {
          const text = await res.text()
          alert(text || "Gagal mengunduh")
          return
        }
        const data = await res.json()
        grandTotal = data.total || 0
        const items = data.photos || []
        manifest.push(...items)
        if (data.captions) captionChunks.push(data.captions)
        offset += items.length
        if (items.length < CHUNK || offset >= grandTotal) break
        setDownloadProgress(`Menyiapkan daftar... (${offset}/${grandTotal})`)
      }
      if (manifest.length === 0) {
        alert("Belum ada foto untuk diunduh")
        return
      }

      const { zip } = await import("fflate")
      const files: Record<string, Uint8Array> = {}
      const CONCURRENCY = 6
      let done = 0
      for (let i = 0; i < manifest.length; i += CONCURRENCY) {
        const batch = manifest.slice(i, i + CONCURRENCY)
        await Promise.all(batch.map(async (item) => {
          try {
            const imgRes = await fetch(item.url)
            if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`)
            files[item.name] = new Uint8Array(await imgRes.arrayBuffer())
          } catch {
            // lewati file yang gagal
          }
        }))
        done += batch.length
        setDownloadProgress(`Mengunduh ${Math.min(done, manifest.length)}/${manifest.length}...`)
      }
      if (captionChunks.length > 0) {
        files["captions.txt"] = new TextEncoder().encode(captionChunks.join("\n\n"))
      }
      if (Object.keys(files).length === 0) {
        alert("Tidak ada foto yang berhasil diunduh")
        return
      }
      setDownloadProgress("Membuat ZIP...")
      const zipped = await new Promise<Uint8Array>((resolve, reject) => {
        zip(files, { level: 6 }, (err, data) => (err ? reject(err) : resolve(data)))
      })
      const blob = new Blob([new Uint8Array(zipped)], { type: "application/zip" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = "galeri-kenangan.zip"
      link.click()
      URL.revokeObjectURL(link.href)
    } finally {
      setDownloadingAll(false)
      setDownloadProgress("")
    }
  }

  const openKeepsakeBook = () => {
    if (!requirePaid()) return
    window.open(`/dashboard/${id}/galeri-kenangan/buku`, "_blank", "noopener")
  }

  // Frame + camera pickers: immediate single-field saves (no setup validation).
  const activeFrame = normalizeFrameSelection(setup?.gallery_frame)
  const activeCamera = normalizeCameraId(setup?.gallery_camera)
  const saveFrame = async (fid: FrameSelection) => {
    if (fid === activeFrame || frameSaving) return
    setFrameSaving(fid)
    try {
      const res = await fetch(`/api/dashboard/${id}/gallery-setup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frame: fid }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan frame")
      await fetchSetup()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan frame")
    } finally {
      setFrameSaving(null)
    }
  }
  const saveCamera = async (cid: GaleriCameraId) => {
    if (cid === activeCamera || frameSaving) return
    setFrameSaving(cid)
    try {
      const res = await fetch(`/api/dashboard/${id}/gallery-setup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camera: cid }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan tipe kamera")
      await fetchSetup()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan tipe kamera")
    } finally {
      setFrameSaving(null)
    }
  }

  const prefillPhoto =
    !setup?.gallery_photo_url && (setup?.prefill?.photo_url || "").startsWith("http")
      ? (setup?.prefill?.photo_url as string)
      : ""
  const avatarSrc = (setup?.gallery_photo_url || prefillPhoto)
    ? toTransformedUrl((setup?.gallery_photo_url || prefillPhoto) as string, { width: 200, quality: 65 })
    : ""
  // Photo box follows the same fallback as the invitation: stored upload,
  // then editor cover, then the default couple image (local public asset,
  // served by the app itself — never through the storage transform).
  const boxPhoto = setup?.gallery_photo_url || prefillPhoto || ASSETS.defaults.couple
  const hasOwnPhoto = !!setup?.gallery_photo_url
  const avatarInitial = ((setup?.gallery_couple_name || "G").trim()[0] || "G").toUpperCase()

  return (
    <div className="min-h-screen text-on-surface font-body-md antialiased" style={{ ...SANS, ...DASH_SATIN_BG }}>
      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 border-b border-outline-variant h-20 transition-all duration-300 ease-in-out" style={DASH_HERO_BG}>
        <div className="flex items-center justify-between px-edge-margin-mobile md:px-edge-margin-desktop h-full w-full">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => router.push(`/dashboard/${id}`)} aria-label="Kembali ke dasbor" className="flex items-center justify-center w-11 h-11 -ml-2 rounded-full text-on-surface-variant hover:text-primary active:bg-surface-container transition-colors shrink-0">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="font-label-md text-label-md text-primary uppercase tracking-widest truncate">Galeri Kenangan</span>
          </div>
          <ProfileMenu />
        </div>
      </header>

      <main className="pt-20 pb-28 md:pb-32">
        {/* Banner — flush under the header */}
        <div className="relative overflow-hidden px-6 pt-8 pb-8 rounded-b-[1.5rem] shadow-sm" style={{ backgroundColor: "#f5f3ee" }}>
          <img src={ASSETS.galeriEnvelope.galleryBannerTopRight} alt="" aria-hidden className="absolute -top-6 -right-6 w-28 h-28 object-contain pointer-events-none" style={{ opacity: 0.25, transform: "rotate(12deg)" }} />
          <img src={ASSETS.galeriEnvelope.galleryBannerBottomLeft} alt="" aria-hidden className="absolute -bottom-8 -left-8 w-24 h-24 object-contain pointer-events-none" style={{ opacity: 0.2, transform: "rotate(-12deg)" }} />

          <div className="flex items-center justify-end mb-4 relative z-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <img src={ASSETS.galeriEnvelope.aksaraaMonogram} alt="Aksaraa" className="w-8 h-8 rounded-full object-cover shadow-sm" />
            </div>
          </div>

          <div className="relative z-10 flex flex-col items-center text-center max-w-7xl mx-auto">
            <h2 className="font-medium tracking-normal mb-1 text-[30px] md:text-[44px] leading-tight" style={{ ...SERIF, color: "#4f1519" }}>
              Galeri Kenangan
            </h2>
            <p className="text-[14px] md:text-[17px] leading-relaxed text-[#444841] max-w-xl mx-auto px-4">
              Kumpulan tawa, kehangatan, dan rekaman kasih dari setiap sahabat yang hadir membersamai langkah kami.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm text-[#444841] border border-[#d9c1c0]/30">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" style={{ color: "#4f1519" }}>photo_camera</span>
                <span className="text-[11px] font-semibold text-[#1b1c19]">{loading ? "..." : `${stats.photos} Foto`}</span>
              </div>
              <span className="w-1 h-1 rounded-full bg-[#d9c1c0]" />
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]" style={{ color: "#536251" }}>group</span>
                <span className="text-[11px] font-semibold text-[#1b1c19]">{loading ? "..." : `${stats.devices} Tamu Terkasih`}</span>
              </div>
            </div>
            {!loading && total > 0 && (
              <div className="mt-3.5 flex items-center justify-center gap-2 flex-nowrap">
                <button
                  onClick={downloadAll}
                  disabled={downloadingAll}
                  className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full text-white hover:opacity-95 shadow-sm hover:shadow transition-all active:scale-95 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase disabled:opacity-50 whitespace-nowrap"
                  style={{ backgroundColor: "#6b2b2d" }}
                >
                  <span className="material-symbols-outlined text-[16px]">{downloadingAll ? "hourglass_empty" : "cloud_download"}</span>
                  {downloadingAll ? (downloadProgress || "Menyiapkan...") : "Unduh Semua Foto"}
                </button>
                <button
                  onClick={openKeepsakeBook}
                  className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 rounded-full bg-white border border-[#d9c1c0] text-[#1b1c19] hover:opacity-90 shadow-sm transition-all active:scale-95 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase whitespace-nowrap"
                >
                  <span className="material-symbols-outlined text-[16px]">menu_book</span>
                  Buku Kenangan
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 md:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Detail card — standalone GT bands + Undangan add-on */}
              {hasGaleri && (
              <div className="w-full max-w-7xl mx-auto bg-white rounded-[1rem] shadow-md border border-[#d9c1c0]/40 overflow-hidden transition-all duration-300 mt-6">
                <button
                  onClick={() => setCardOpen((v) => !v)}
                  className="w-full p-4 md:p-5 flex items-center justify-between select-none hover:bg-[#f5f3ee]/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-[#4f1519]/20 shadow-sm shrink-0 bg-[#f5f3ee] flex items-center justify-center">
                      {avatarSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarSrc} alt={setup?.gallery_couple_name || "Mempelai"} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-semibold" style={{ ...SERIF, color: "#4f1519" }}>{avatarInitial}</span>
                      )}
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[17px] md:text-[19px] font-medium leading-tight" style={{ ...SERIF, color: "#4f1519" }}>Detail Acara & Frame</h3>
                        {setup?.date_label && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase" style={{ backgroundColor: "#fea3a2", color: "#793638" }}>
                            {setup.date_label}
                          </span>
                        )}
                      </div>
                      <p className="text-[14px] md:text-[15px] text-[#444841] truncate">{setup?.gallery_couple_name || ""}&nbsp;</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-2 shrink-0">
                    <span className="hidden sm:inline-block text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#4f1519" }}>
                      {cardOpen ? "Tutup Detail" : "Buka Detail"}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-[#f0eee9] flex items-center justify-center" style={{ color: "#4f1519" }}>
                      <span className="material-symbols-outlined text-[20px] transition-transform duration-300" style={{ transform: cardOpen ? "none" : "rotate(180deg)" }}>
                        expand_less
                      </span>
                    </div>
                  </div>
                </button>

                {!loading && (setup?.galeri_quota_photos_per_guest || setup?.galeri_quota_guests) ? (
                  <div className="px-4 md:px-5 pb-4 -mt-1 flex">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#d9c1c0]/40 bg-[#f5f3ee]/60 px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold text-[#444841] whitespace-nowrap">
                      <span className="material-symbols-outlined text-[15px]" style={{ color: "#6b2b2d" }}>burst_mode</span>
                      Kuota: {setup?.galeri_quota_photos_per_guest || 0} foto/tamu
                      {setup?.galeri_quota_guests ? ` untuk ${setup.galeri_quota_guests} tamu` : ""}
                    </span>
                  </div>
                ) : null}

                {cardOpen && (
                  <div className="border-t border-[#d9c1c0]/30 bg-[#f5f3ee]/30 p-4 md:p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <div className="lg:col-span-8 flex flex-col md:flex-row gap-5 items-stretch bg-white p-5 md:p-6 rounded-[1rem] border border-[#d9c1c0]/30 shadow-sm">
                        <div className="flex flex-col items-center shrink-0 justify-center w-full md:w-auto">
                          {/* Instagram-grid concept: portrait 3:4 cell + cover.
                              Phone portraits fill it with almost no crop
                              (a square cut ~1/3 off this photo). */}
                          <div className="relative group w-[180px] md:w-[200px] aspect-[3/4] rounded-2xl overflow-hidden border-2 border-[#4f1519]/20 shadow-md bg-[#f5f3ee]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={boxPhoto.startsWith("http") ? toTransformedUrl(boxPhoto, { width: 400, quality: 70 }) : boxPhoto} alt={`Foto Mempelai ${setup?.gallery_couple_name || ""}`} className="absolute inset-0 w-full h-full object-cover" />
                            <label className={`absolute inset-0 bg-[#4f1519]/45 backdrop-blur-[2px] text-white transition-opacity flex flex-col items-center justify-center cursor-pointer gap-1 p-2 ${hasOwnPhoto ? "opacity-0 group-hover:opacity-100 focus-within:opacity-100" : "opacity-100"}`}>
                              <span className="material-symbols-outlined text-[24px]">{uploadingPhoto ? "hourglass_empty" : "photo_camera"}</span>
                              <span className="text-[10px] uppercase tracking-wider font-semibold text-center">{uploadingPhoto ? "Mengunggah..." : hasOwnPhoto ? "Ganti Foto" : "Unggah Foto"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={uploadingPhoto}
                                onChange={(e) => {
                                  const f = e.target.files?.[0]
                                  if (f) handlePhotoUpload(f)
                                  e.target.value = ""
                                }}
                              />
                            </label>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between pt-1 md:pt-0 border-t md:border-t-0 md:border-l border-[#d9c1c0]/30 md:pl-5 min-w-0">
                          {!editing && configured ? (
                            <div className="flex flex-col gap-3.5">
                              <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[#d9c1c0]/20">
                                <div className="min-w-0">
                                  <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#6b2b2d" }}>Informasi Acara</span>
                                  <h4 className="text-[22px] md:text-[26px] mt-0.5 leading-snug truncate" style={{ ...SERIF, color: "#4f1519" }}>{setup?.gallery_couple_name}</h4>
                                </div>
                                <button
                                  onClick={() => setEditing(true)}
                                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#f0eee9] hover:bg-[#e4e2dd] transition-colors text-[11px] font-semibold shrink-0 shadow-sm"
                                  style={{ color: "#4f1519" }}
                                >
                                  <span className="material-symbols-outlined text-[14px]">edit</span>
                                  Edit Detail
                                </button>
                              </div>
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: "#fea3a2", color: "#793638" }}>
                                  <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                                </div>
                                <div className="min-w-0">
                                  <span className="text-[11px] uppercase tracking-wider text-[#444841] font-medium">Hari &amp; Waktu Acara</span>
                                  <p className="text-[#1b1c19] font-medium text-[15px] md:text-[16px]">
                                    {setup?.date_label}{setup?.start_label ? ` • ${setup.start_label}` : ""}{setup?.end_label ? ` - ${setup.end_label} WIB` : ""}
                                  </p>
                                </div>
                              </div>
                              <div className="p-2.5 rounded-lg bg-[#f5f3ee]/60 border border-[#d9c1c0]/20 flex items-center gap-2 text-[#444841] text-[12px] md:text-[13px]">
                                <span className="material-symbols-outlined text-[17px] shrink-0" style={{ color: "#536251" }}>verified</span>
                                <span>Status: {statusLine}</span>
                              </div>
                            </div>
                          ) : (
                            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); handleSaveSetup() }}>
                              <div className="flex items-center justify-between pb-2 border-b border-[#d9c1c0]/20">
                                <span className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#4f1519" }}>
                                  {configured ? "Edit Detail Acara" : "Detail Acara"}
                                </span>
                                <span className="text-[10px] text-[#444841]">Simpan untuk memperbarui</span>
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase tracking-wider text-[#444841] mb-1 font-semibold">Nama Mempelai</label>
                                <input
                                  type="text"
                                  value={coupleName}
                                  maxLength={80}
                                  onChange={(e) => setCoupleName(e.target.value)}
                                  placeholder="Bryan & Cheline"
                                  className="w-full px-3 py-1.5 rounded-lg border border-[#d9c1c0]/60 bg-[#fbf9f4] text-[#1b1c19] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4f1519]"
                                />
                              </div>
                              <div className="flex flex-col gap-2.5">
                                <div>
                                  <label className="block text-[10px] uppercase tracking-wider text-[#444841] mb-1 font-semibold">Tanggal Acara</label>
                                  <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    className="w-full px-3 py-1.5 rounded-lg border border-[#d9c1c0]/60 bg-[#fbf9f4] text-[#1b1c19] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4f1519]"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase tracking-wider text-[#444841] mb-1 font-semibold">Waktu Acara</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="block text-[9px] uppercase tracking-wider text-[#444841] mb-0.5">Waktu Mulai (Dari)</span>
                                      <input
                                        type="time"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9c1c0]/60 bg-[#fbf9f4] text-[#1b1c19] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4f1519]"
                                      />
                                    </div>
                                    <div>
                                      <span className="block text-[9px] uppercase tracking-wider text-[#444841] mb-0.5">Waktu Selesai (Sampai)</span>
                                      <input
                                        type="time"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9c1c0]/60 bg-[#fbf9f4] text-[#1b1c19] text-[13px] focus:outline-none focus:ring-1 focus:ring-[#4f1519]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
                              <div className="flex items-center gap-2 pt-1 justify-end">
                                {configured && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditing(false)
                                      setSaveError("")
                                      setCoupleName(setup?.gallery_couple_name || "")
                                      setEventDate(wibDateInput(setup?.gallery_start_at || null))
                                      setStartTime(wibTimeInput(setup?.gallery_start_at || null))
                                      setEndTime(wibTimeInput(setup?.gallery_end_at || null))
                                    }}
                                    className="px-3 py-1 rounded-full border border-[#d9c1c0]/50 text-[#444841] hover:bg-[#f0eee9] text-[11px] font-semibold transition-colors"
                                  >
                                    Batal
                                  </button>
                                )}
                                <button
                                  type="submit"
                                  disabled={saving}
                                  className="px-3.5 py-1 rounded-full text-white text-[11px] font-semibold shadow-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                  style={{ backgroundColor: "#4f1519" }}
                                >
                                  <span className="material-symbols-outlined text-[14px]">save</span>
                                  {saving ? "Menyimpan..." : "Simpan"}
                                </button>
                              </div>
                            </form>
                          )}
                        </div>
                      </div>

                      <div className="lg:col-span-4 flex flex-col items-center text-center bg-white p-5 rounded-[1rem] border border-[#d9c1c0]/30 shadow-sm h-full justify-between">
                        <div className="flex flex-col items-center w-full">
                          <span className="text-[11px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#6b2b2d" }}>QR Kode Akses Acara</span>
                          {!configured ? (
                            <p className="text-[13px] text-[#444841] leading-relaxed">QR terbit setelah detail acara disimpan.</p>
                          ) : isUnpaid ? (
                            <>
                              <p className="text-[13px] text-[#444841] leading-relaxed">Selesaikan pembayaran untuk menampilkan QR acara.</p>
                              <button
                                onClick={() => window.open(paymentWaLink({ packageType: setup?.package_type, galeriTier: setup?.galeri_tier }), "_blank")}
                                className="mt-3 inline-flex items-center justify-center gap-2 bg-[#D97706] text-white rounded-full px-6 py-2.5 text-[11px] uppercase tracking-widest font-semibold hover:bg-[#92400E] active:scale-95 transition-all"
                              >
                                <span className="material-symbols-outlined text-[16px]">payments</span>
                                Bayar Sekarang
                              </button>
                            </>
                          ) : !qr ? (
                            <button
                              onClick={loadQr}
                              disabled={qrLoading}
                              className="mt-1 inline-flex items-center gap-2 text-white rounded-full px-6 py-2.5 text-[11px] uppercase tracking-widest hover:opacity-95 transition-colors disabled:opacity-50"
                              style={{ backgroundColor: "#6b2b2d" }}
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                              {qrLoading ? "Memuat..." : "Tampilkan QR"}
                            </button>
                          ) : (
                            <>
                              <div className="p-3 bg-white rounded-[1rem] border-2 border-[#4f1519]/20 shadow-sm">
                                {qr.qr_png ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={qr.qr_png} alt="QR akses galeri" className="w-32 h-32 md:w-36 md:h-36" />
                                ) : (
                                  <p className="font-mono text-[11px] break-all max-w-[160px]">{qr.gallery_url}</p>
                                )}
                              </div>
                              <p className="text-[12px] text-[#444841] mt-3 leading-snug px-1">
                                Tamu dapat scan QR ini untuk langsung mengunggah foto ke Galeri Kenangan.
                              </p>
                              <p className="font-mono text-[11px] text-[#444841] bg-[#f5f3ee] border border-[#d9c1c0] rounded-lg px-3 py-2 mt-2 break-all w-full">
                                {qr.gallery_url}
                              </p>
                            </>
                          )}
                        </div>
                        {qr && !isUnpaid && (
                          <div className="flex items-center gap-2 mt-4 w-full">
                            <button onClick={copyQrLink} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full bg-[#f0eee9] text-[#1b1c19] hover:opacity-80 text-[11px] font-semibold transition-colors">
                              <span className="material-symbols-outlined text-[14px]">{qrCopied ? "check" : "share"}</span>
                              {qrCopied ? "Tersalin!" : "Bagikan"}
                            </button>
                            <button onClick={downloadStandee} disabled={!qr.qr_png || dlBusy} className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-full text-white text-[11px] font-semibold shadow-sm transition-colors disabled:opacity-50" style={{ backgroundColor: "#536251" }}>
                              <span className="material-symbols-outlined text-[14px]">download</span>
                              {dlBusy ? "Menyiapkan..." : "Unduh Standee"}
                            </button>
                          </div>
                        )}
                        {configured && !isUnpaid && qr && (
                          <button onClick={regenerateQr} disabled={regenerating} className="mt-2 text-[11px] uppercase tracking-widest text-[#444841]/70 hover:text-red-500 transition-colors disabled:opacity-50">
                            {regenerating ? "Membuat QR baru..." : "Buat QR baru"}
                          </button>
                        )}
                        {configured && !isUnpaid && setup?.galeri_guest_count ? (
                          <button
                            onClick={() => router.push(`/dashboard/${id}/galeri-kenangan/cetak`)}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-full bg-[#f0eee9] hover:bg-[#e4e2dd] text-[11px] font-semibold uppercase tracking-widest transition-colors"
                            style={{ color: "#4f1519" }}
                          >
                            <span className="material-symbols-outlined text-[16px]">print</span>
                            Cetak Standee
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Frame picker — baked into guest captures at upload */}
                    <div className="border-t border-[#d9c1c0]/30 px-4 md:px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#4f1519" }}>Bingkai Foto Tamu</p>
                        {frameSaving && <span className="text-[11px] text-[#444841]/70">Menyimpan...</span>}
                      </div>
                      <div className="flex items-center gap-2 rounded-xl border-l-4 px-2.5 py-2 md:px-3 md:py-2.5 mb-3" style={{ backgroundColor: "#FBF1EE", borderLeftColor: "#B34E3F" }}>
                        <span className="material-symbols-outlined text-[16px] md:text-[18px] shrink-0" style={{ color: "#B34E3F" }}>check_circle</span>
                        <p className="text-[11px] md:text-[12px] font-semibold leading-snug" style={{ color: "#4f1519" }}>
                          {activeFrame === "none"
                            ? "Tanpa bingkai — foto tamu diunggah apa adanya."
                            : `${GALERI_FRAME_NAMES[activeFrame]} aktif — diterapkan ke setiap foto tamu saat diunggah.`}
                        </p>
                      </div>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
                        <button
                          onClick={() => void saveFrame("none")}
                          disabled={frameSaving !== null}
                          className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition-all active:scale-95 disabled:opacity-70 shrink-0 w-24 md:w-auto ${activeFrame === "none" ? "border-[#4f1519] bg-white shadow-md" : "border-[#d9c1c0]/40 bg-white/60 hover:border-[#4f1519]/50"}`}
                        >
                          {activeFrame === "none" && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4f1519] text-white flex items-center justify-center shadow">
                              <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                            </span>
                          )}
                          <span className="w-full rounded-lg bg-[#f0eee9] flex items-center justify-center" style={{ aspectRatio: "4/5" }}>
                            <span className="material-symbols-outlined text-[24px] text-[#444841]/50">hide_image</span>
                          </span>
                          <span className={`text-[10px] font-semibold leading-tight text-center ${activeFrame === "none" ? "text-[#4f1519]" : "text-[#444841]/70"}`}>
                            Tanpa Bingkai
                          </span>
                        </button>
                        {GALERI_FRAME_IDS.map((fid) => {
                          const selected = fid === activeFrame
                          return (
                            <button
                              key={fid}
                              onClick={() => void saveFrame(fid)}
                              disabled={frameSaving !== null}
                              className={`relative flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition-all active:scale-95 disabled:opacity-70 shrink-0 w-24 md:w-auto ${selected ? "border-[#4f1519] bg-white shadow-md" : "border-[#d9c1c0]/40 bg-white/60 hover:border-[#4f1519]/50"}`}
                            >
                              {selected && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#4f1519] text-white flex items-center justify-center shadow z-10">
                                  <span className="material-symbols-outlined text-[13px] font-bold">check</span>
                                </span>
                              )}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={GALERI_FRAME_THUMBS[fid]} alt={`Bingkai ${GALERI_FRAME_NAMES[fid]}`} loading="lazy" className="w-full rounded-lg object-cover" />
                              <span className={`text-[10px] font-semibold leading-tight text-center ${selected ? "text-[#4f1519]" : "text-[#444841]/70"}`}>
                                {GALERI_FRAME_NAMES[fid]}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Camera type — Instagram concept: one static preview,
                        tap a swatch to apply its filter live (and save it —
                        baked into guest captures at upload). */}
                    <div className="border-t border-[#d9c1c0]/30 px-4 md:px-6 py-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={CAMERA_SWATCH_IMG}
                        alt="Pratinjau tipe kamera"
                        loading="lazy"
                        className="w-full max-w-[340px] aspect-[4/3] rounded-lg object-cover shadow-md mx-auto"
                        style={(() => {
                          const css = GALERI_CAMERAS.find((c) => c.id === activeCamera)?.css || ""
                          return css ? { filter: css } : undefined
                        })()}
                      />
                      <div className="flex items-center gap-2 rounded-xl border-l-4 px-2.5 py-2 md:px-3 md:py-2.5 mt-3.5 mb-1" style={{ backgroundColor: "#FBF1EE", borderLeftColor: "#B34E3F" }}>
                        <span className="material-symbols-outlined text-[16px] md:text-[18px] shrink-0" style={{ color: "#B34E3F" }}>check_circle</span>
                        <p className="text-[11px] md:text-[12px] font-semibold leading-snug" style={{ color: "#4f1519" }}>
                          {frameSaving
                            ? "Menyimpan..."
                            : `${GALERI_CAMERAS.find((c) => c.id === activeCamera)?.name || "Normal"} aktif — diterapkan ke setiap foto tamu saat diunggah.`}
                        </p>
                      </div>
                      <div className="mt-3.5 w-full bg-surface-container-low border border-outline-variant/40 rounded-xl p-3.5 shadow-sm flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold tracking-wider uppercase text-on-surface">
                            Pilih Tipe Kamera Kamu
                          </span>
                          <span className="text-[11px] font-medium text-primary px-2 py-0.5 rounded-full bg-surface-container-high">
                            {frameSaving ? "Menyimpan..." : (GALERI_CAMERAS.find((c) => c.id === activeCamera)?.name || "Normal")}
                          </span>
                        </div>
                        <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 snap-x px-0.5">
                          {GALERI_CAMERAS.map((cam) => {
                            const selected = cam.id === activeCamera
                            return (
                              <button
                                key={cam.id}
                                onClick={() => void saveCamera(cam.id)}
                                disabled={frameSaving !== null}
                                className="flex flex-col items-center gap-1.5 flex-shrink-0 group cursor-pointer focus:outline-none disabled:opacity-70"
                              >
                                <div className={`relative w-[52px] h-[52px] rounded-full p-[2px] transition-all border-2 ${selected ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}>
                                  <div className="w-full h-full rounded-full overflow-hidden shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      alt={cam.name}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                      src={CAMERA_SWATCH_IMG}
                                      style={cam.css ? { filter: cam.css } : undefined}
                                    />
                                  </div>
                                  <div className={`absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary text-surface-container-lowest flex items-center justify-center shadow-md ${selected ? "" : "hidden"}`}>
                                    <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-center leading-tight">
                                  <span className={`text-[10px] ${selected ? "font-semibold text-primary" : "font-medium text-on-surface-variant group-hover:text-primary"} transition-colors`}>{cam.name}</span>
                                  <span className="text-[9px] text-on-surface-variant/70">{cam.desc}</span>
                                </div>
                              </button>
                            )
                          })}
                        </div>
                        <div className="w-full h-[1px] bg-outline-variant/30" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              )}

              {!loading && retention.hasEventDate && retention.deletionDate && (
                <div className="max-w-7xl mx-auto w-full mt-6">
                  <div className="flex items-start gap-3 bg-[#E0F2FE] border border-[#7DD3FC] rounded-xl px-5 py-4 shadow-sm">
                    <span className="material-symbols-outlined text-[#0284C7] shrink-0 mt-0.5">info</span>
                    <p className="font-body-md text-[13px] text-[#0C4A6E]">
                      Foto tersedia sampai {formatDeletionDate(retention.deletionDate)}, jangan lupa di download
                    </p>
                  </div>
                </div>
              )}

              {isUnpaid && (
                <div className="max-w-7xl mx-auto w-full mt-6">
                  <div className="flex items-start gap-3 bg-[#E0F2FE] border border-[#7DD3FC] rounded-xl px-5 py-4 shadow-sm">
                    <span className="material-symbols-outlined text-[#0284C7] shrink-0 mt-0.5">warning</span>
                    <p className="font-body-md text-[13px] text-[#0C4A6E] leading-relaxed">
                      Selesaikan pembayaran untuk menerbitkan QR acara. Pengaturan detail acara tetap bisa diisi sekarang.
                    </p>
                  </div>
                </div>
              )}

              {/* Search — all packages */}
              <div className="mt-6 max-w-7xl mx-auto w-full bg-white border border-[#d9c1c0]/40 rounded-full px-4 h-12 flex items-center gap-3 shadow-sm focus-within:ring-1 focus-within:ring-[#4f1519] focus-within:border-[#4f1519] transition-all">
                <span className="material-symbols-outlined text-[#444841]/70 text-xl">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama atau caption..."
                  className="bg-transparent border-none focus:ring-0 w-full h-12 py-3.5 text-sm text-[#1b1c19] placeholder:text-[#867272]/80 outline-none"
                  style={SANS}
                />
              </div>
              {/* Filter pills — pure Buku Tamu Digital packages only */}
              {isDgbPkg && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-6 max-w-7xl mx-auto w-full">
                  {([
                    { id: "all" as Pill, icon: "grid_view", label: "Semua Kenangan" },
                    { id: "gallery" as Pill, icon: "view_timeline", label: "Kenangan Tamu" },
                    { id: "selfie" as Pill, icon: "face", label: "Check IN" },
                  ]).map((f) => {
                    const active = pill === f.id
                    return (
                      <button
                        key={f.id}
                        onClick={() => switchPill(f.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] uppercase tracking-wider font-semibold shrink-0 transition-all active:scale-95 ${active ? "text-white shadow-sm" : "bg-white text-[#444841] shadow-sm hover:opacity-80"}`}
                        style={active ? { backgroundColor: "#6b2b2d" } : undefined}
                      >
                        <span className="material-symbols-outlined text-[16px]">{f.icon}</span>
                        {f.label}
                      </button>
                    )
                  })}
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 pt-6 max-w-7xl mx-auto w-full">
                <div className="h-px bg-[#d9c1c0]/50 flex-grow" />
                <div className="flex items-center gap-2">
                  <img src={ASSETS.galeriEnvelope.galleryBannerTopRight} alt="" aria-hidden className="w-4 h-4 object-contain" />
                  <span className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: "#6b2b2d" }}>Unggahan Sahabat &amp; Keluarga</span>
                  <img src={ASSETS.galeriEnvelope.galleryBannerBottomLeft} alt="" aria-hidden className="w-4 h-4 object-contain" />
                </div>
                <div className="h-px bg-[#d9c1c0]/50 flex-grow" />
              </div>

              {photos.length === 0 ? (
                <div className="text-center py-24 max-w-7xl mx-auto w-full">
                  <span className="material-symbols-outlined text-6xl text-[#444841]/30 mb-4">photo_library</span>
                  <p className="text-[#444841]">
                    {debouncedQ
                      ? `Tidak ada foto untuk “${debouncedQ}”`
                      : pill !== "all"
                        ? "Belum ada foto pada kategori ini"
                        : "Belum ada foto dari tamu"}
                  </p>
                  {pill === "all" && !configured && (
                    <p className="text-sm text-[#444841]/70 mt-2">Simpan detail acara untuk menerbitkan QR agar tamu mulai mengunggah.</p>
                  )}
                </div>
              ) : (
                <>
                  <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6 max-w-7xl mx-auto w-full items-start mt-4 md:mt-6">
                    {photos.map((photo) => {
                      const name = displayNameOf(photo)
                      const initial = (name.trim()[0] || "T").toUpperCase()
                      return (
                        <div key={photo.id} className="bg-white rounded-[1rem] p-3 md:p-4 shadow-md flex flex-col h-full justify-between">
                          <div className="flex flex-col">
                            <div className="flex items-center justify-between pb-3 gap-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[16px] font-semibold shrink-0" style={{ ...SERIF, backgroundColor: "#ffdad9", color: "#4f1519" }}>
                                  {initial}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <h3 className="text-[17px] leading-tight truncate" style={{ ...SERIF, color: "#1b1c19" }}>Momen dari {name}</h3>
                                  <span className="text-[11px] text-[#444841]">{formatCardStamp(photo.created_at)}</span>
                                </div>
                              </div>
                              {displayCategory(photo.category || photo.guests?.category) && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: "#fea3a2", color: "#793638" }}>
                                  {displayCategory(photo.category || photo.guests?.category)}
                                </span>
                              )}
                              {photo.source === "selfie" && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0" style={{ backgroundColor: "#4f1519", color: "#ffdad9" }}>
                                  Check-in
                                </span>
                              )}
                            </div>
                            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#f0eee9] shadow-sm">
                              <StorageImage
                                src={photo.image_url}
                                width={400}
                                alt={`Foto oleh ${name}`}
                                loading="lazy"
                                decoding="async"
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => window.open(photo.image_url, "_blank")}
                              />
                            </div>
                            {photo.caption && (
                              <p className="text-[17px] leading-[26px] mt-3 px-1" style={{ ...CAPTION_FONT, color: "#1b1c19" }}>
                                {photo.caption}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-end gap-2 pt-3 mt-4 bg-[#f5f3ee]/40 p-2 rounded-lg">
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#536251] text-white text-[11px] font-semibold shadow-sm hover:opacity-90 transition-all active:scale-95"
                              onClick={() => downloadSingle(photo.image_url, `${name}-${photo.id}.jpg`)}
                            >
                              <span className="material-symbols-outlined text-[16px]">download</span>
                              Unduh Foto
                            </button>
                            <button
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-[#E2D9CF] text-[#1b1c19] hover:opacity-80 text-[11px] font-semibold transition-all"
                              onClick={() => shareSingle(photo)}
                            >
                              <span className="material-symbols-outlined text-[16px]">share</span>
                              Bagikan
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </section>
                  {hasMore && (
                    <div className="flex justify-center mt-8 max-w-7xl mx-auto w-full">
                      <button
                        onClick={() => fetchPhotos(page + 1, pill, debouncedQ, true)}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 bg-white border border-[#E2D9CF] text-[#1b1c19] rounded-full px-8 py-3 text-[11px] uppercase tracking-widest hover:opacity-80 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {loadingMore ? "Memuat..." : `Muat Lagi (${total - photos.length} tersisa)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      {showPaywall && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPaywall(false)}>
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">payments</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Selesaikan Pembayaran</h3>
              <p className="text-sm text-on-surface-variant">
                Fitur ini aktif setelah pembayaran selesai. Klik Bayar untuk menghubungi tim Aksaraa via WhatsApp.
              </p>
              <button
                onClick={() => window.open(paymentWaLink({ packageType: setup?.package_type, galeriTier: setup?.galeri_tier }), "_blank")}
                className="w-full bg-primary text-on-primary py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                Bayar
              </button>
              <button
                onClick={() => setShowPaywall(false)}
                className="w-full border border-outline-variant text-on-surface-variant py-3.5 md:py-3 min-h-[44px] rounded-xl font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
