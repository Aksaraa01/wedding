"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import { MESSAGE_TEMPLATES } from "@/lib/reminderTemplates"
import ProfileMenu from "@/components/ProfileMenu"
import { DASH_HERO_BG, DASH_SATIN_BG } from "@/lib/dashboardTheme"

function stripQrLines(text: string): string {
  return text
    .split("\n")
    .filter(line => {
      const lower = line.toLowerCase()
      return !lower.includes("qr code") && !lower.includes("qr-card")
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0]
}

function formatTime(d: Date): string {
  return d.toTimeString().slice(0, 5)
}

export default function ReminderTamuVIPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [selectedTemplate, setSelectedTemplate] = useState("formal")
  const [messageText, setMessageText] = useState(MESSAGE_TEMPLATES.formal.text)
  const [scheduledDate, setScheduledDate] = useState(formatDate(new Date()))
  const [scheduledTime, setScheduledTime] = useState("09:00")
  const [totalGuests, setTotalGuests] = useState(0)
  const [waBlastTier, setWaBlastTier] = useState(0)
  const [packageType, setPackageType] = useState("signature")
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [vipGuests, setVipGuests] = useState<{ id: string; name: string; phone_number: string; table_number: string; created_at: string }[]>([])
  const [showVipModal, setShowVipModal] = useState(false)
  const [vipSearch, setVipSearch] = useState("")
  const [weddingDate, setWeddingDate] = useState("")
  const [locked, setLocked] = useState(false)
  const [showSaveConfirm, setShowSaveConfirm] = useState(false)
  const [showNoVipModal, setShowNoVipModal] = useState(false)
  const [isPublished, setIsPublished] = useState(false)
  const [showConfirmFirstModal, setShowConfirmFirstModal] = useState(false)
  const [qrCodeBook, setQrCodeBook] = useState(true)

  useEffect(() => {
    fetch(`/api/dashboard/${id}/wa-blast`)
      .then(r => r.json())
      .then(data => {
        setTotalGuests(data.total_guests || 0)
        setWaBlastTier(data.wa_blast_tier || 0)
        setPackageType(data.package_type || "signature")
        setWeddingDate(data.wedding_date || "")
        setVipGuests(data.vip_guests || [])
          setIsPublished(data.is_published === true)
        if (typeof data.qr_code_book === "boolean") setQrCodeBook(data.qr_code_book)
        if (data.schedule) {
          setLocked(true)
          setSelectedTemplate(data.schedule.template_type || "formal")
          const savedText = data.schedule.message_text || MESSAGE_TEMPLATES.formal.text
          setMessageText(qrCodeBook ? savedText : stripQrLines(savedText))
          setScheduledDate(data.schedule.scheduled_date || formatDate(new Date()))
          setScheduledTime(data.schedule.scheduled_time?.slice(0, 5) || "09:00")
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  function handleTemplateChange(val: string) {
    setSelectedTemplate(val)
    const template = MESSAGE_TEMPLATES[val]
    if (template) {
      const text = qrCodeBook ? template.text : stripQrLines(template.text)
      setMessageText(text)
      setEditText(text)
    }
  }

  function handleSave() {
    if (vipGuests.length === 0) {
      setShowNoVipModal(true)
      setShowSaveConfirm(false)
      return
    }
    setSaving(true)
    setSaved(false)
    fetch(`/api/dashboard/${id}/wa-blast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_type: selectedTemplate,
        message_text: editing ? editText : messageText,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        total_guests: totalGuests,
      }),
    })
      .then(r => r.json())
      .then(() => { setSaved(true); setLocked(true); setShowSaveConfirm(false) })
      .catch(console.error)
      .finally(() => setSaving(false))
  }

  const displayText = editing ? editText : messageText

  const packageBase = packageType === "prestige" ? 100 : 0
  const totalQuota = packageBase + waBlastTier
  const quotaLabel = totalQuota > 0 ? `Kuota: ${Math.min(vipGuests.length, totalQuota)}/${totalQuota}` : `${vipGuests.length} Tamu VIP`

  function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr)
    d.setDate(d.getDate() + days)
    return d.toISOString().split("T")[0]
  }
  const weddingDateFormatted = weddingDate
    ? new Date(weddingDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : ""

  const filteredVip = vipGuests.filter(
    (g) =>
      !vipSearch ||
      g.name.toLowerCase().includes(vipSearch.toLowerCase()) ||
      (g.phone_number || "").includes(vipSearch) ||
      (g.table_number || "").toLowerCase().includes(vipSearch.toLowerCase())
  )

  return (
    <>
      <PageTheme mode="light" />
      <div className="min-h-screen text-on-surface font-body-md antialiased pb-32" style={DASH_SATIN_BG}>
        <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-50 border-b border-outline-variant/30 flex items-center px-6 md:px-12 h-16" style={DASH_HERO_BG}>
          <div className="w-full flex items-center justify-between">
            <span className="font-label-md text-label-md uppercase tracking-widest text-on-surface-variant">Reminder Tamu VIP</span>
            <ProfileMenu />
          </div>
        </header>
        <main className="w-full max-w-6xl mx-auto px-6 pt-28 pb-28 md:pb-0 flex flex-col gap-8">
          <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-headline-lg text-3xl md:text-4xl text-primary leading-tight tracking-tight">Reminder Tamu VIP</h1>
            {weddingDateFormatted && (
              <p className="text-sm text-on-surface-variant">
                Tanggal Pernikahan: <span className="font-semibold text-secondary">{weddingDateFormatted}</span>
              </p>
            )}
          </div>
            <div className="h-px bg-outline-variant/40 mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-xl">auto_stories</span>
                <h2 className="font-headline-md text-xl font-medium text-primary">Konfigurasi Pesan</h2>
              </div>
            </div>
            <div className="flex flex-col gap-5">
                <div className="relative flex flex-col gap-2">
                  <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Pilih Tipe Pesan</label>
                  <div className="relative">
                    <select
                      value={selectedTemplate}
                      onChange={e => handleTemplateChange(e.target.value)}
                      disabled={locked}
                      className="w-full min-h-[44px] border border-outline-variant/60 rounded-lg bg-surface-container-lowest px-4 py-3.5 font-body-md text-sm text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary transition-all appearance-none cursor-pointer pr-10 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {Object.entries(MESSAGE_TEMPLATES).map(([key, t]) => (
                        <option key={key} value={key}>{t.label}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/70 pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Pratinjau Pesan</label>
                  {editing && !locked ? (
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      className="bg-surface rounded-lg p-5 font-body-md text-sm text-on-surface/90 leading-relaxed border border-outline-variant/40 min-h-[220px] resize-y focus:ring-1 focus:ring-secondary focus:border-secondary"
                    />
                  ) : (
                    <div className="bg-surface rounded-lg p-5 font-body-md text-sm text-on-surface/90 leading-relaxed whitespace-pre-wrap border border-outline-variant/40 shadow-inner min-h-[160px]">
                      {displayText}
                    </div>
                  )}
                </div>

            </div>
          </section>
            </div>

            <div className="space-y-8">
          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-secondary text-xl">calendar_month</span>
                <h3 className="font-headline-md text-xl font-medium text-primary">Jadwal Pengiriman</h3>
              </div>
              <button
                onClick={() => setShowVipModal(true)}
                className="flex items-center gap-1.5 bg-surface-container border border-outline-variant/40 px-3 min-h-[44px] rounded-md text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors"
                title="Lihat daftar tamu VIP"
              >
                <span className="material-symbols-outlined text-sm">local_offer</span>
                <span className="font-label-md text-[10px] uppercase tracking-wider font-medium">{quotaLabel}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Tanggal</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  disabled={locked}
                  max={weddingDate || undefined}
                  className="w-full min-h-[44px] bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 font-body-md text-sm text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {!locked && weddingDate && (
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => setScheduledDate(addDays(weddingDate, -1))}
                      className="text-[10px] font-label-md uppercase tracking-wider px-2.5 min-h-[44px] py-2 border border-outline-variant/50 rounded text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors"
                    >
                      Rekomendasi H-1
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduledDate(addDays(weddingDate, -3))}
                      className="text-[10px] font-label-md uppercase tracking-wider px-2.5 min-h-[44px] py-2 border border-outline-variant/50 rounded text-on-surface-variant hover:border-secondary hover:text-secondary transition-colors"
                    >
                      Rekomendasi H-3
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-label-md uppercase tracking-wider text-on-surface-variant font-semibold">Waktu Eksekusi (WIB)</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  disabled={locked}
                  className="w-full min-h-[44px] bg-surface-container-lowest border border-outline-variant/60 rounded-lg px-4 py-3 font-body-md text-sm text-on-surface focus:ring-1 focus:ring-secondary focus:border-secondary shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-secondary text-xl">sensors</span>
                <h2 className="font-headline-md text-xl font-medium text-primary">Status Broadcast</h2>
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse ring-4 ring-emerald-600/20" />
              </div>
              <span className="text-xs font-label-md bg-emerald-50 text-emerald-700 border border-emerald-200/50 px-2.5 py-0.5 rounded font-medium uppercase tracking-wider">Live Active</span>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-outline-variant/30 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">Aktivitas Progres Antrean</span>
                <span className="font-headline-md text-lg font-bold text-secondary">0%</span>
              </div>
              <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                <div className="h-full bg-secondary rounded-full transition-all duration-1000 ease-out shadow-sm" style={{ width: "0%" }} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="border border-outline-variant/50 bg-surface-container-lowest p-4 rounded-lg flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-2 shadow-sm">
                <div className="flex items-center gap-2.5 text-emerald-700">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span className="font-body-md text-sm font-medium text-on-surface-variant">Terkirim</span>
                </div>
                <span className="font-headline-md text-2xl font-semibold text-primary sm:mt-1">0 <span className="text-[10px] font-label-md uppercase text-on-surface-variant/70 tracking-normal ml-0.5">Pesan</span></span>
              </div>

              <div className="border border-outline-variant/50 bg-surface-container-lowest p-4 rounded-lg flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-2 shadow-sm">
                <div className="flex items-center gap-2.5 text-amber-600">
                  <span className="material-symbols-outlined text-xl">hourglass_empty</span>
                  <span className="font-body-md text-sm font-medium text-on-surface-variant">Antrean</span>
                </div>
                <span className="font-headline-md text-2xl font-semibold text-primary sm:mt-1">{totalGuests} <span className="text-[10px] font-label-md uppercase text-on-surface-variant/70 tracking-normal ml-0.5">Pesan</span></span>
              </div>

              <div className="border border-outline-variant/50 bg-surface-container-low/40 p-4 rounded-lg flex sm:flex-col justify-between sm:justify-start items-center sm:items-start gap-2 opacity-60">
                <div className="flex items-center gap-2.5 text-error">
                  <span className="material-symbols-outlined text-xl">error_outline</span>
                  <span className="font-body-md text-sm font-medium text-on-surface-variant">Gagal</span>
                </div>
                <span className="font-headline-md text-2xl font-semibold text-primary sm:mt-1">0 <span className="text-[10px] font-label-md uppercase text-on-surface-variant/70 tracking-normal ml-0.5">Pesan</span></span>
              </div>
            </div>
          </section>
            </div>
          </div>
        </main>

        <div className="fixed bottom-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] bg-background/90 backdrop-blur-md border-t border-outline-variant/60 py-4 px-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="max-w-6xl mx-auto flex items-center justify-end">
            <button
              onClick={() => {
                if (!isPublished) {
                  setShowConfirmFirstModal(true)
                } else if (vipGuests.length === 0) {
                  setShowNoVipModal(true)
                } else {
                  setShowSaveConfirm(true)
                }
              }}
              disabled={saving || (locked && isPublished)}
              className="w-full sm:w-44 min-h-[44px] bg-primary text-on-primary py-4 px-6 rounded-lg font-label-md text-xs uppercase tracking-[0.2em] transition-all duration-200 active:scale-[0.98] hover:bg-primary/95 shadow-md font-semibold disabled:opacity-60"
            >
              {locked ? "Tersimpan" : saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {showSaveConfirm && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowSaveConfirm(false)}>
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl border border-outline-variant/50 shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">calendar_month</span>
              <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Simpan Jadwal Pengiriman?</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                Apakah Anda yakin ingin menyimpan jadwal pengiriman reminder ini?<br />
                <span className="font-semibold text-secondary">Setelah disimpan, jadwal tidak dapat diubah.</span>
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full min-h-[44px] py-3.5 bg-primary text-on-primary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Ya, Simpan"}
                </button>
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  disabled={saving}
                  className="w-full min-h-[44px] py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {showNoVipModal && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowNoVipModal(false)}>
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl border border-outline-variant/50 shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined text-4xl text-error mb-4 block">groups</span>
              <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Belum Ada Tamu VIP</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                Reminder hanya dikirim ke tamu bertanda VIP. Tandai minimal satu tamu sebagai VIP sebelum menyimpan jadwal.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/dashboard/${id}/guests`)}
                  className="w-full min-h-[44px] py-3.5 bg-primary text-on-primary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
                >
                  Kelola Daftar Tamu
                </button>
                <button
                  onClick={() => setShowNoVipModal(false)}
                  className="w-full min-h-[44px] py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmFirstModal && (
          <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowConfirmFirstModal(false)}>
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl border border-outline-variant/50 shadow-2xl p-8 text-center" onClick={(e) => e.stopPropagation()}>
              <span className="material-symbols-outlined text-4xl text-secondary mb-4 block">lock</span>
              <h3 className="font-headline-md text-xl font-medium text-primary mb-3">Konfirmasi Undangan Dulu</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-8">
                Undangan digital Anda belum dikonfirmasi. Konfirmasi undangan terlebih dahulu sebelum menyimpan Reminder VIP.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push(`/dashboard/${id}/web-invitation/editor`)}
                  className="w-full min-h-[44px] py-3.5 bg-primary text-on-primary rounded-lg font-label-md text-xs uppercase tracking-widest font-semibold hover:opacity-90 transition-opacity"
                >
                  Konfirmasi Sekarang
                </button>
                <button
                  onClick={() => setShowConfirmFirstModal(false)}
                  className="w-full min-h-[44px] py-3 border border-outline-variant text-on-surface-variant rounded-lg font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
                >
                  Nanti Saja
                </button>
              </div>
            </div>
          </div>
        )}

        {showVipModal && (
          <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setShowVipModal(false)}>
            <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl border border-outline-variant/50 shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
                <div>
                  <h3 className="font-headline-md text-lg font-medium text-primary">Daftar Tamu VIP</h3>
                  <p className="text-[11px] text-on-surface-variant">
                    {vipGuests.length} tamu VIP &bull; Kuota {totalQuota}
                    {vipGuests.length > totalQuota && totalQuota > 0 && (
                      <span className="text-error"> &bull; {vipGuests.length - totalQuota} dikecualikan</span>
                    )}
                  </p>
                </div>
                <button onClick={() => setShowVipModal(false)} className="text-on-surface-variant hover:text-on-surface min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" aria-label="Tutup">
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
              <div className="px-6 py-4 border-b border-outline-variant/20">
                <input
                  type="text"
                  value={vipSearch}
                  onChange={(e) => setVipSearch(e.target.value)}
                  placeholder="Cari nama / no. HP / meja..."
                  className="w-full min-h-[44px] bg-surface rounded-lg border border-outline-variant/50 px-4 py-2.5 text-sm focus:ring-1 focus:ring-secondary focus:border-secondary outline-none"
                />
              </div>
              <div className="max-h-[320px] overflow-y-auto divide-y divide-outline-variant/15">
                {filteredVip.length === 0 && (
                  <p className="py-12 text-center text-sm text-on-surface-variant italic">Tidak ada tamu VIP ditemukan.</p>
                )}
                {filteredVip.map((g) => {
                  const originalIndex = vipGuests.findIndex((x) => x.id === g.id)
                  const isExcluded = totalQuota > 0 && originalIndex >= totalQuota
                  return (
                    <div key={g.id} className={`px-6 py-3 flex items-center gap-3 ${isExcluded ? "bg-red-50/60" : ""}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-on-surface truncate flex items-center gap-1.5">
                          {g.name}
                          <span className="material-symbols-outlined text-[#b8860b] text-[14px]">star</span>
                        </p>
                        <p className="text-[11px] text-on-surface-variant/70">
                          {g.phone_number || "—"}
                          {g.table_number ? ` • Meja ${g.table_number}` : ""}
                        </p>
                      </div>
                      {isExcluded ? (
                        <span className="shrink-0 text-[10px] font-label-md uppercase tracking-wider text-red-600 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full">
                          Dikecualikan
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-label-md uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Termasuk
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
