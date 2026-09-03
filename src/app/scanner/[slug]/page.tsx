"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import NativeQrReader from "@/components/scanner/NativeQrReader"
import SelfieModal from "@/components/scanner/SelfieModal"
import {
  cacheGuests,
  getGuestByToken,
  markCheckedIn,
  claimSouvenirLocal,
  getPendingCount,
  syncPending,
  type GuestRecord,
} from "@/lib/db"

type EventInfo = {
  wedding_profile_id: string
  bride_name: string
  groom_name: string
  display_name?: string
  guest_count: number
  has_pin: boolean
  end_date?: string
}

type ScanResult = {
  type: "success" | "already" | "error"
  guest?: GuestRecord
  message: string
}

function extractToken(text: string): string | null {
  const clean = text.trim()
  if (/^AKS-[\w-]+$/.test(clean)) return clean
  const match = clean.match(/AKS-[\w-]+/)
  return match ? match[0] : null
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Baru saja"
  if (mins < 60) return `${mins} mnt lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  return `${Math.floor(hours / 24)} hari lalu`
}

function formatTableNumber(t: string | null | undefined): string {
  if (!t) return ""
  const trimmed = t.trim()
  return /^meja\s/i.test(trimmed) ? trimmed : `Meja ${trimmed}`
}

function paxCount(g: { rsvp_pax_count?: number | null; guest_count?: number | null }): number {
  return g.rsvp_pax_count ?? g.guest_count ?? 1
}

export default function ScannerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)

  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
  const [pinVerified, setPinVerified] = useState(false)
  const [pinInput, setPinInput] = useState("")
  const [pinError, setPinError] = useState("")
  const [operatorName, setOperatorName] = useState("")
  const [showNameInput, setShowNameInput] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [logEntries, setLogEntries] = useState<GuestRecord[]>([])
  const [allGuests, setAllGuests] = useState<GuestRecord[]>([])
  const [pendingSync, setPendingSync] = useState(0)
  const [manualQuery, setManualQuery] = useState("")
  const [manualResults, setManualResults] = useState<GuestRecord[]>([])
  const [manualSearching, setManualSearching] = useState(false)
  const [offline, setOffline] = useState(false)

  const [showAddGuest, setShowAddGuest] = useState(false)
  const [addGuestForm, setAddGuestForm] = useState({ name: "", phone: "", guest_count: 1, category: "", table_number: "", notes: "" })
  const [addGuestSubmitting, setAddGuestSubmitting] = useState(false)
  const [addGuestError, setAddGuestError] = useState("")
  const [addGuestSuccess, setAddGuestSuccess] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null)

  const [selfieGuest, setSelfieGuest] = useState<GuestRecord | null>(null)
  const [selfieAfter, setSelfieAfter] = useState<"checkin" | "recovery">("checkin")
  const [selfieGuestIds, setSelfieGuestIds] = useState<Set<string>>(new Set())
  const [selfieDoneToast, setSelfieDoneToast] = useState<string | null>(null)

  const bufferRef = useRef("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const processScan = useCallback(async (rawText: string) => {
    const token = extractToken(rawText)
    if (!token) {
      setScanResult({ type: "error", message: "QR tidak valid" })
      return
    }

    const cached = await getGuestByToken(token)

    if (cached && cached.is_checked_in) {
      if (selfieGuestIds.has(cached.id)) {
        setScanResult({ type: "already", guest: cached, message: `${cached.name} sudah check-in` })
      } else {
        openSelfieRecovery(cached)
      }
      return
    }

    if (cached) {
      await markCheckedIn(cached.id, token, operatorName)
      const updated = await getGuestByToken(token)
      const g = updated || cached
      setLogEntries((prev) => [g, ...prev.filter((x) => x.id !== g.id)])
      updatePending()
      trySync()
      openSelfieCheckin(g)
      return
    }

    try {
      const res = await fetch(`/api/check-in?qr_token=${encodeURIComponent(token)}`)
      if (res.ok) {
        const data = await res.json()
        const serverGuest: GuestRecord = {
          id: data.guest.id,
          wedding_profile_id: eventInfo!.wedding_profile_id,
          name: data.guest.name,
          phone_number: null,
          table_number: null,
          category: null,
          guest_count: data.guest.guest_count || 1,
          rsvp_status: data.guest.rsvp_status || null,
          rsvp_pax_count: data.guest.rsvp_pax_count || null,
          qr_token: token,
          is_checked_in: false,
          checkin_timestamp: null,
          checked_in_by: null,
          souvenir_claimed: false,
          added_manually: data.guest.added_manually || false,
        }
        await cacheGuests([serverGuest])
        await markCheckedIn(serverGuest.id, token, operatorName)
        const updated = await getGuestByToken(token)
        const g = updated || serverGuest
        setLogEntries((prev) => [g, ...prev])
        updatePending()
        trySync()
        openSelfieCheckin(g)
      } else {
        setScanResult({ type: "error", message: "Tamu tidak ditemukan" })
      }
    } catch {
      setScanResult({ type: "error", message: "Gagal terhubung ke server. Periksa koneksi." })
    }
  }, [operatorName, eventInfo, selfieGuestIds, openSelfieCheckin, openSelfieRecovery])

  const trySync = useCallback(async () => {
    if (!eventInfo) return
    const result = await syncPending(eventInfo.wedding_profile_id)
    if (result.offline) {
      setOffline(true)
    } else {
      setOffline(false)
    }
    updatePending()
  }, [eventInfo])

  const updatePending = useCallback(async () => {
    const count = await getPendingCount()
    setPendingSync(count)
  }, [])

  const selfieOpen = selfieGuest !== null

  const selfieGuestRef = useRef<GuestRecord | null>(null)
  useEffect(() => {
    selfieGuestRef.current = selfieGuest
  }, [selfieGuest])

  const selfieAfterRef = useRef<"checkin" | "recovery">("checkin")
  useEffect(() => {
    selfieAfterRef.current = selfieAfter
  }, [selfieAfter])

  function openSelfieCheckin(guest: GuestRecord) {
    selfieGuestRef.current = guest
    selfieAfterRef.current = "checkin"
    setSelfieGuest(guest)
    setSelfieAfter("checkin")
    setScanResult(null)
  }

  function openSelfieRecovery(guest: GuestRecord) {
    selfieGuestRef.current = guest
    selfieAfterRef.current = "recovery"
    setSelfieGuest(guest)
    setSelfieAfter("recovery")
    setScanResult(null)
  }

  const simulateSuccess = () => {
    if (!eventInfo) return
    const fake: GuestRecord = {
      id: `sim-${Date.now()}`,
      wedding_profile_id: eventInfo.wedding_profile_id,
      name: "Bramantyo Agung",
      phone_number: null,
      table_number: "Meja 09",
      category: "Reguler",
      guest_count: 2,
      rsvp_status: "HADIR",
      rsvp_pax_count: null,
      qr_token: `AKS-SIM-${Date.now()}`,
      is_checked_in: true,
      checkin_timestamp: new Date().toISOString(),
      checked_in_by: operatorName,
      souvenir_claimed: false,
      added_manually: false,
    }
    setAllGuests((prev) => (prev.some((x) => x.id === fake.id) ? prev : [fake, ...prev]))
    setLogEntries((prev) => [fake, ...prev])
    openSelfieCheckin(fake)
  }

  const handleSelfieDone = useCallback((uploaded: boolean, _error?: string) => {
    const guest = selfieGuestRef.current
    setSelfieGuest(null)
    selfieGuestRef.current = null
    if (guest) {
      if (uploaded) {
        setSelfieGuestIds((prev) => new Set(prev).add(guest.id))
        setSelfieDoneToast(`Foto check-in ${guest.name} berhasil disimpan`)
        setTimeout(() => setSelfieDoneToast(null), 3000)
      }
      setScanResult({ type: "success", guest, message: `Selamat datang, ${guest.name}!` })
    }
  }, [])

  useEffect(() => {
    fetch(`/api/scanner/${slug}`).then((r) => r.json()).then((data) => {
      if (data.error) return
      setEventInfo(data)
    })
  }, [slug])

  useEffect(() => {
    const verified = sessionStorage.getItem(`scanner_pin_${slug}`)
    if (verified === "true") setPinVerified(true)
  }, [slug])

  useEffect(() => {
    const name = sessionStorage.getItem(`scanner_operator_${slug}`)
    if (name) setOperatorName(name)
    else if (pinVerified) setShowNameInput(true)
  }, [pinVerified, slug])

  useEffect(() => {
    if (!pinVerified || !operatorName) return
    if (!eventInfo) return

    updatePending()

    const initDB = async () => {
      try {
        const res = await fetch(`/api/dashboard/${eventInfo.wedding_profile_id}/qr-guestbook`)
        if (res.ok) {
          const data = await res.json()
          const records: GuestRecord[] = (data.guests || []).map((g: any) => ({
            id: g.id,
            wedding_profile_id: eventInfo.wedding_profile_id,
            name: g.name,
            phone_number: g.phone_number || null,
            table_number: g.table_number || null,
            category: g.category || null,
            guest_count: g.guest_count || 1,
            rsvp_status: g.rsvp_status || null,
            rsvp_pax_count: g.rsvp_pax_count || null,
            qr_token: g.qr_token || null,
            is_checked_in: g.is_checked_in || false,
            checkin_timestamp: g.checkin_timestamp || null,
            checked_in_by: null,
            souvenir_claimed: false,
            added_manually: g.added_manually || false,
          }))
          await cacheGuests(records)
          setAllGuests(records)
          setLogEntries(records.filter((g) => g.is_checked_in).sort((a, b) => {
            if (!a.checkin_timestamp || !b.checkin_timestamp) return 0
            return b.checkin_timestamp.localeCompare(a.checkin_timestamp)
          }))
        }
      try {
        const photoRes = await fetch(`/api/guest-photos?wedding_profile_id=${eventInfo.wedding_profile_id}`)
        if (photoRes.ok) {
          const photoData = await photoRes.json()
          const ids = new Set<string>()
          for (const p of Array.isArray(photoData.photos) ? photoData.photos : []) {
            if (p.source === "selfie" && p.guest_id) ids.add(p.guest_id)
          }
          if (ids.size) setSelfieGuestIds(ids)
        }
      } catch {}
      } catch {
        setOffline(true)
      }
    }
    initDB()
  }, [pinVerified, operatorName, eventInfo])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        const text = bufferRef.current.trim()
        if (text) processScan(text)
        bufferRef.current = ""
        clearTimeout(timerRef.current)
      } else if (e.key.length === 1) {
        bufferRef.current += e.key
        clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => { bufferRef.current = "" }, 100)
      }
    }
    document.addEventListener("keydown", handler)
    return () => {
      document.removeEventListener("keydown", handler)
      clearTimeout(timerRef.current)
    }
  }, [processScan])

  useEffect(() => {
    if (!pendingSync) return
    const interval = setInterval(() => trySync(), 30000)
    return () => clearInterval(interval)
  }, [pendingSync, trySync])

  const handleVerifyPin = async () => {
    setPinError("")
    const res = await fetch(`/api/scanner/${slug}/verify-pin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: pinInput }),
    })
    const data = await res.json()
    if (res.ok && data.valid) {
      sessionStorage.setItem(`scanner_pin_${slug}`, "true")
      setPinVerified(true)
      setShowNameInput(true)
    } else {
      setPinError(data.error || "PIN salah")
    }
  }

  const handleSetName = () => {
    if (!operatorName.trim()) return
    sessionStorage.setItem(`scanner_operator_${slug}`, operatorName.trim())
    setShowNameInput(false)
  }

  const handleClaimSouvenir = async (guestId: string) => {
    await claimSouvenirLocal(guestId)
    try {
      await fetch("/api/check-in", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guest_id: guestId }),
      })
    } catch {}
    setLogEntries((prev) => prev.map((g) => g.id === guestId ? { ...g, souvenir_claimed: true } : g))
    if (scanResult?.guest?.id === guestId) {
      setScanResult({ ...scanResult, guest: { ...scanResult.guest, souvenir_claimed: true } })
    }
    updatePending()
  }

  const handleManualSearch = async (q: string) => {
    setManualQuery(q)
    if (!q.trim() || !eventInfo) {
      setManualResults([])
      return
    }
    setManualSearching(true)
    try {
      const res = await fetch(`/api/check-in/search?q=${encodeURIComponent(q)}&wedding_profile_id=${eventInfo.wedding_profile_id}`)
      if (res.ok) {
        const data = await res.json()
        setManualResults(data.guests || [])
      }
    } finally {
      setManualSearching(false)
    }
  }

  const handleAddGuest = async () => {
    setAddGuestError("")
    const name = addGuestForm.name.trim()
    if (!name) {
      setAddGuestError("Nama tamu wajib diisi")
      return
    }
    if (!eventInfo) return
    setAddGuestSubmitting(true)
    try {
      const digits = addGuestForm.phone.replace(/\D/g, "")
      const phonePayload = digits ? (digits.startsWith("62") ? `+${digits}` : `+62${digits}`) : ""

      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wedding_profile_id: eventInfo.wedding_profile_id,
          name,
          phone_number: phonePayload,
          guest_count: addGuestForm.guest_count,
          category: addGuestForm.category,
          table_number: addGuestForm.table_number,
          added_manually: true,
          checked_in_by: operatorName,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409 && data.duplicate) {
          setAddGuestError("Tamu dengan nama dan nomor yang sama sudah ada")
        } else {
          setAddGuestError(data.error || "Gagal menambah tamu")
        }
        return
      }

      const data = await res.json()
      const g = data.guest
      if (g) {
        const record: GuestRecord = {
          id: g.id,
          wedding_profile_id: eventInfo.wedding_profile_id,
          name: g.name,
          phone_number: g.phone_number || null,
          table_number: g.table_number || null,
          category: g.category || null,
          guest_count: g.guest_count || 1,
          rsvp_status: g.rsvp_status || null,
          rsvp_pax_count: g.rsvp_pax_count || null,
          qr_token: g.qr_token || null,
          is_checked_in: true,
          checkin_timestamp: g.checkin_timestamp || null,
          checked_in_by: operatorName || null,
          souvenir_claimed: false,
          added_manually: true,
        }
        setAllGuests((prev) => (prev.some((x) => x.id === record.id) ? prev : [record, ...prev]))
        setLogEntries((prev) => (prev.some((x) => x.id === record.id) ? prev : [record, ...prev]))
      }

      setAddGuestSuccess(true)
      setAddGuestForm({ name: "", phone: "", guest_count: 1, category: "", table_number: "", notes: "" })
      if (manualQuery.trim()) handleManualSearch(manualQuery)
      if (g) {
        setTimeout(() => {
          setAddGuestSuccess(false)
          setShowAddGuest(false)
          openSelfieCheckin(g)
        }, 1200)
      } else {
        setTimeout(() => {
          setAddGuestSuccess(false)
          setShowAddGuest(false)
        }, 1200)
      }
    } catch {
      setAddGuestError("Gagal terhubung ke server")
    } finally {
      setAddGuestSubmitting(false)
    }
  }

  const handleGuestDetailCheckin = async () => {
    if (!selectedGuest) return
    await handleManualCheckin(selectedGuest)
    setSelectedGuest(null)
  }

  const handleManualCheckin = async (guest: GuestRecord) => {
    if (guest.is_checked_in) {
      if (!selfieGuestIds.has(guest.id)) {
        openSelfieRecovery(guest)
      } else {
        setScanResult({ type: "already", guest, message: `${guest.name} sudah check-in` })
      }
      return
    }
    await cacheGuests([guest])
    await markCheckedIn(guest.id, guest.qr_token || "", operatorName)
    const updated = await getGuestByToken(guest.qr_token || "")
    const g = updated || guest
    setLogEntries((prev) => [g, ...prev])
    setManualQuery("")
    setManualResults([])
    updatePending()
    trySync()
    openSelfieCheckin(g)
  }

  const formatWIB = (iso: string | null | undefined) => {
    if (!iso) return ""
    const d = new Date(iso)
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`
  }

  const presentCount = logEntries.filter(g => g.is_checked_in).reduce((sum, g) => sum + paxCount(g), 0)
  const totalGuests = allGuests.reduce((sum, g) => sum + paxCount(g), 0)
  const presentGuestRows = logEntries.filter(g => g.is_checked_in).length
  const totalGuestRows = allGuests.length
  const coupleDisplay = eventInfo
    ? (eventInfo.display_name || `${eventInfo.bride_name} & ${eventInfo.groom_name}`)
    : ""

  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">lock</span>
            <h1 className="font-headline-md text-headline-md text-primary mb-2">Scanner Concierge</h1>
            {eventInfo && (
              <p className="font-body-md text-on-surface-variant">{coupleDisplay}</p>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Masukkan PIN untuk mengakses scanner</p>
          </div>

          <div className="bg-surface-container-low rounded p-6">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center text-[2rem] tracking-[0.3em] font-mono bg-surface-container-high border-none rounded py-4 outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            {pinError && (
              <p className="font-body-sm text-body-sm text-red-500 mt-3 text-center">{pinError}</p>
            )}
            <button
              onClick={handleVerifyPin}
              disabled={pinInput.length !== 6}
              className="w-full bg-primary text-on-primary font-label-md uppercase tracking-widest py-4 mt-4 hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              Verifikasi PIN
            </button>
          </div>

          <p className="font-body-sm text-body-sm text-on-surface-variant text-center mt-6">
            PIN dapat diperoleh dari halaman Live Attendance dashboard
          </p>
        </div>
      </div>
    )
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-5xl text-primary mb-4">badge</span>
            <h1 className="font-headline-md text-headline-md text-primary mb-2">Nama Operator</h1>
            <p className="font-body-md text-on-surface-variant">Masukkan nama Anda sebagai operator scanner</p>
          </div>

          <div className="bg-surface-container-low rounded p-6">
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Nama operator"
              className="w-full bg-surface-container-high border-none rounded py-3 px-4 outline-none focus:ring-2 focus:ring-primary font-body-md"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            />
            <button
              onClick={handleSetName}
              disabled={!operatorName.trim()}
              className="w-full bg-primary text-on-primary font-label-md uppercase tracking-widest py-4 mt-4 hover:bg-secondary disabled:opacity-40 transition-colors"
            >
              Mulai Scanner
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{`@keyframes laserMove{0%{top:0%;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:100%;opacity:0}}.scanner-laser{animation:laserMove 2s infinite linear}`}</style>
      <div className="font-sans text-on-surface bg-background min-h-screen antialiased flex flex-col items-center">
      <header className="w-full bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/30 sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-xl">qr_code_scanner</span>
          <div>
            <h1 className="font-serif text-base font-semibold text-primary tracking-wide">Aksaraa Concierge</h1>
            <p className="text-[9px] uppercase tracking-widest text-on-surface-variant/70 font-medium">
              Gate 1 &bull; {coupleDisplay}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${offline ? "bg-red-500" : pendingSync > 0 ? "bg-yellow-500" : "bg-green-500"}`} />
          <button onClick={() => window.location.reload()} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-lg">sync</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-md px-4 pt-6 pb-24 flex-grow space-y-6">
        <section className="border border-outline-variant/60 rounded-xl p-4 bg-surface-container-high/30 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 w-24 h-24 border-r border-b border-secondary/10 pointer-events-none rounded-br-xl"></div>
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-semibold">Kehadiran Tamu</span>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-3xl font-bold text-secondary">{presentGuestRows}</span>
                <span className="text-sm text-on-surface-variant/60">/ {totalGuestRows} Tamu</span>
              </div>
              <p className="text-[10px] text-on-surface-variant/60">{presentCount} / {totalGuests} pax</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> Live Sync
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center border-2 border-outline-variant/40">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,#444_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <NativeQrReader onScan={processScan} isPaused={!!scanResult || selfieOpen} />
            <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-surface-container-high rounded-tl-md"></div>
            <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-surface-container-high rounded-tr-md"></div>
            <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-surface-container-high rounded-bl-md"></div>
            <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-l-2 border-surface-container-high rounded-br-md"></div>
            <div className="scanner-laser absolute left-6 right-6 h-0.5 bg-secondary shadow-[0_0_8px_#8d4d39] z-10"></div>
            <div className="text-center z-20 space-y-1.5 px-8 pointer-events-none">
              <span className="material-symbols-outlined text-3xl text-surface-container-high/80 animate-pulse">photo_camera</span>
              <p className="text-xs font-medium text-surface-container-high tracking-wide">Posisikan QR Code Tamu di Dalam Kotak</p>
              <p className="text-[10px] text-surface-container-high/50 italic">Kamera mendeteksi otomatis...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={simulateSuccess} className="flex-1 bg-background/90 hover:bg-surface-container text-primary border border-outline-variant px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-sm transition-all active:scale-95">
              Simulasi Sukses
            </button>
            <button onClick={() => setScanResult({ type: "error", message: "QR tidak valid / expired" })} className="flex-1 bg-background/90 hover:bg-surface-container text-secondary border border-outline-variant px-3 py-2 rounded-lg text-[10px] uppercase tracking-wider font-bold shadow-sm transition-all active:scale-95">
              Simulasi Gagal
            </button>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-semibold">Alternatif Cek-in Manual</span>
            <button
              onClick={() => setShowAddGuest(true)}
              className="text-[10px] font-bold uppercase tracking-widest bg-primary text-surface px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors"
            >
              + Tambah Tamu Manual
            </button>
          </div>
          <div className="relative border border-outline-variant focus-within:border-secondary rounded-xl bg-surface-container-low px-3 py-2 flex items-center transition-colors group">
            <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">badge</span>
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => handleManualSearch(e.target.value)}
              placeholder="Masukkan Nama Tamu atau Kode Unik..."
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-primary placeholder:italic placeholder:text-[12px] placeholder:text-on-surface-variant/40"
            />
          </div>
          {manualSearching && (
            <div className="py-2 text-center">
              <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          )}
          {manualResults.length > 0 && (
            <div className="divide-y divide-outline-variant/30 border border-outline-variant/40 rounded-xl bg-surface-container-low/50 overflow-hidden">
              {manualResults.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuest(g)}
                  className="w-full text-left p-3 hover:bg-surface-container transition-colors"
                >
                  <h4 className="font-medium text-primary text-xs">{g.name}</h4>
                  <p className="text-[10px] text-on-surface-variant/60 font-mono">
                    {formatTableNumber(g.table_number)} &bull; {paxCount(g)} Pax
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant/70 font-semibold">Log Riwayat Masuk</span>
            <span className="text-[9px] text-on-surface-variant/50 font-mono">Diperbarui Baru Saja</span>
          </div>
          <div id="logContainer" className="divide-y divide-outline-variant/30 border border-outline-variant/40 rounded-xl bg-surface-container-low/50 overflow-hidden">
            {logEntries.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[10px] text-on-surface-variant/60">Belum ada check-in</p>
              </div>
            ) : (
              logEntries.map((g) => (
                <div key={g.id} className="p-3 flex items-center justify-between text-xs transition-all hover:bg-surface-container">
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-primary">
                      {g.name}
                      {g.added_manually && <span className="text-[10px] text-amber-600 font-bold font-serif pl-1">[Ditambahkan Manual]</span>}
                      {g.category && <span className="text-[10px] text-secondary font-bold font-serif pl-1">{g.category}</span>}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant/60 font-mono">
                      {formatTableNumber(g.table_number)}{g.table_number ? " • " : ""}{paxCount(g)} Pax • {formatWIB(g.checkin_timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {g.is_checked_in && !selfieGuestIds.has(g.id) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openSelfieRecovery(g) }}
                        title="Ambil foto check-in"
                        className="text-primary hover:text-secondary mr-1"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                      </button>
                    )}
                    {!g.souvenir_claimed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClaimSouvenir(g.id) }}
                        className="text-[9px] text-primary hover:underline mr-1"
                      >
                        Souvenir
                      </button>
                    )}
                    {g.souvenir_claimed && (
                      <span className="material-symbols-outlined text-sm text-yellow-600">card_giftcard</span>
                    )}
                    <span className="material-symbols-outlined text-[#2e7d32] text-lg bg-[#2e7d32]/10 p-1 rounded-full">check</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {scanResult && (
        <div id="statusModal" className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="bg-background border border-outline-variant w-full max-w-[min(92vw,26rem)] rounded-2xl p-6 shadow-2xl text-center space-y-5 relative max-h-[90dvh] overflow-y-auto flex flex-col justify-center">
            <div className={`absolute inset-x-0 top-0 h-1.5 rounded-t-2xl ${
              scanResult.type === "success" ? "bg-[#2e7d32]" : "bg-secondary"
            }`} id="modalStatusBar"></div>
            <div className="space-y-2 pt-2">
              <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                scanResult.type === "success" ? "bg-[#2e7d32]/10 text-[#2e7d32]" : "bg-secondary/10 text-secondary"
              }`}>
                <span className="material-symbols-outlined text-2xl">
                  {scanResult.type === "success" ? "check" : "warning"}
                </span>
              </div>
              <h3 className={`font-serif text-xl font-bold ${
                scanResult.type === "success" ? "text-primary" : "text-secondary"
              }`}>
                {scanResult.type === "success" ? "Check-In Berhasil" :
                 scanResult.type === "already" ? "Sudah Check-In" : "QR Tidak Valid / Expired"}
              </h3>
              <p className="text-xs text-on-surface-variant/70 tracking-wide font-mono uppercase">
                {scanResult.guest?.qr_token ? `AKSR-${scanResult.guest.qr_token.slice(-6)}` : "KODE TIDAK DIKENALI"}
              </p>
            </div>
            <hr className="border-outline-variant/40" />
            {scanResult.guest && (
              <div className="grid grid-cols-2 gap-4 text-left text-xs bg-surface-container/50 p-4 rounded-xl border border-outline-variant/30">
                <div>
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block">Nama Tamu</span>
                  <strong className="text-primary font-medium text-sm">{scanResult.guest.name}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block">Status Kuota</span>
                  <strong className="text-primary font-medium text-sm">{paxCount(scanResult.guest)} Pax Terdaftar</strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block">Alokasi Meja</span>
                  <strong className="text-secondary font-serif text-sm font-bold">
                    {formatTableNumber(scanResult.guest.table_number) || "-"}
                  </strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block">Kategori</span>
                  <strong className="text-primary font-medium text-sm">{scanResult.guest.category || "Reguler"}</strong>
                </div>
              </div>
            )}
            {scanResult.type === "success" && scanResult.guest && !scanResult.guest.souvenir_claimed && (
              <button
                onClick={() => handleClaimSouvenir(scanResult.guest!.id)}
                className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all hover:bg-surface-container-hover flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">card_giftcard</span>
                Ambil Souvenir
              </button>
            )}
            {scanResult.type !== "error" && scanResult.guest && scanResult.guest.is_checked_in && !selfieGuestIds.has(scanResult.guest.id) && (
              <button
                onClick={() => openSelfieRecovery(scanResult.guest!)}
                className="w-full bg-surface-container-high text-primary py-3 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all hover:bg-surface-container-hover flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                Ambil Foto Check-in
              </button>
            )}
            <button
              onClick={() => setScanResult(null)}
              className="w-full bg-primary hover:bg-secondary text-surface py-3.5 rounded-xl font-sans text-[11px] uppercase tracking-widest font-bold transition-all"
            >
              Lanjutkan Scan Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Selfie Modal */}
      <SelfieModal
        open={selfieOpen}
        guestName={selfieGuest?.name || ""}
        coupleName={coupleDisplay}
        endDate={eventInfo?.end_date || ""}
        guestId={selfieGuest?.id || null}
        weddingProfileId={eventInfo?.wedding_profile_id || null}
        onDone={handleSelfieDone}
      />

      {selfieDoneToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-inverse-surface/95 backdrop-blur-sm text-inverse-on-surface px-6 py-3.5 rounded-xl shadow-xl border border-outline-variant/20 flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-secondary-container text-xl">check_circle</span>
          <span className="font-label-md text-[11px] uppercase tracking-wider font-semibold">{selfieDoneToast}</span>
        </div>
      )}

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-background border border-outline-variant w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            {/* Editorial header */}
            <div className="p-6 border-b border-l-2 border-secondary/30 ml-6 mt-6 mb-4">
              <span className="font-label-md text-[11px] text-secondary uppercase tracking-[0.25em] block mb-2 font-semibold">Detail Tamu</span>
              <h2 className="font-headline-lg text-3xl text-primary font-medium tracking-tight">{selectedGuest.name}</h2>
            </div>

            {/* Detail grid */}
            <div className="px-6 pb-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-left text-xs bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5">
                <div className="col-span-2">
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">Nama Tamu</span>
                  <strong className="text-primary font-medium text-sm">{selectedGuest.name}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">Alokasi Meja</span>
                  <strong className="text-secondary font-serif text-sm font-bold">
                    {formatTableNumber(selectedGuest.table_number) || "-"}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">Jumlah Pax</span>
                  <strong className="text-primary font-medium text-sm">{paxCount(selectedGuest)} Pax</strong>
                </div>
                <div>
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">Kategori</span>
                  <strong className="text-primary font-medium text-sm">{selectedGuest.category || "Reguler"}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">Status</span>
                  <strong className={`font-medium text-sm ${selectedGuest.is_checked_in ? "text-[#2e7d32]" : "text-secondary"}`}>
                    {selectedGuest.is_checked_in ? "Sudah Check-in" : "Belum Check-in"}
                  </strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">Sumber</span>
                  <strong className={`font-medium text-sm ${selectedGuest.added_manually ? "text-amber-600" : "text-primary"}`}>
                    {selectedGuest.added_manually ? "Ditambahkan Manual" : "Undangan QR"}
                  </strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-on-surface-variant/60 uppercase tracking-wider block font-semibold">QR Token</span>
                  <strong className="text-primary font-mono text-[10px]">{selectedGuest.qr_token ? `AKSR-${selectedGuest.qr_token.slice(-6)}` : "-"}</strong>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {!selectedGuest.is_checked_in && (
                <button
                  onClick={handleGuestDetailCheckin}
                  className="w-full bg-primary hover:bg-secondary text-on-primary py-4 rounded-xl font-label-md text-[11px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                  Check-in Sekarang
                </button>
              )}
              <button
                onClick={() => setSelectedGuest(null)}
                className="w-full bg-surface-container-high hover:bg-surface-container-highest text-primary py-4 rounded-xl font-label-md text-[11px] uppercase tracking-widest font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Tamu Manual Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-center justify-center p-0">
          <div className="bg-background w-full h-full md:max-w-md md:h-auto md:max-h-[90vh] md:rounded-2xl border border-outline-variant shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/40 shrink-0">
              <button
                onClick={() => { setShowAddGuest(false); setAddGuestError("") }}
                className="inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-label-md text-[11px] uppercase tracking-wider font-semibold"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Kembali
              </button>
              <div className="w-2 h-2 rounded-full bg-secondary/40 animate-pulse" />
            </header>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
              <div className="border-l-2 border-secondary/30 pl-6 py-1">
                <span className="font-label-md text-[11px] text-secondary uppercase tracking-[0.25em] block mb-2 font-semibold">Manajemen Undangan</span>
                <h2 className="font-headline-lg text-3xl text-primary font-medium tracking-tight">Detail Kehadiran Tamu</h2>
                <p className="font-body-md text-sm text-on-surface-variant mt-3 max-w-md leading-relaxed">
                  Silakan masukkan informasi tamu secara manual untuk dicatat ke dalam daftar undangan resmi Aksaraa.
                </p>
              </div>

              {/* Nama Lengkap */}
              <div className="group bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5 hover:border-outline-variant hover:bg-surface-container-lowest transition-all duration-300 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary shadow-sm">
                <label className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                  Nama Lengkap Tamu
                </label>
                <input
                  type="text"
                  value={addGuestForm.name}
                  onChange={(e) => setAddGuestForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Contoh: Bpk. Heru Wijaya"
                  className="w-full bg-transparent border-0 p-0 font-body-lg text-base text-primary placeholder:text-outline-variant/60 focus:ring-0"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div className="group bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5 hover:border-outline-variant hover:bg-surface-container-lowest transition-all duration-300 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary shadow-sm">
                <label className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                  Nomor WhatsApp
                </label>
                <div className="relative flex items-center">
                  <span className="font-body-lg text-base text-on-surface-variant/70 pr-2 select-none font-medium border-r border-outline-variant/40 mr-2">+62</span>
                  <input
                    type="tel"
                    value={addGuestForm.phone}
                    onChange={(e) => setAddGuestForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                    placeholder="812 3456 7890"
                    className="w-full bg-transparent border-0 p-0 font-body-lg text-base text-primary placeholder:text-outline-variant/60 focus:ring-0"
                  />
                </div>
              </div>

              {/* Kategori + Meja + Pax */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5 hover:border-outline-variant hover:bg-surface-container-lowest transition-all duration-300 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary shadow-sm">
                  <label className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                    Kategori Undangan
                  </label>
                  <div className="relative flex items-center">
                    <select
                      value={addGuestForm.category}
                      onChange={(e) => setAddGuestForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full bg-transparent border-0 p-0 font-body-lg text-base text-primary appearance-none cursor-pointer focus:ring-0 pr-8"
                    >
                      <option value="">Pilih Kategori</option>
                      <option value="Keluarga Besar">Keluarga Besar</option>
                      <option value="Tamu VIP">Tamu VIP</option>
                      <option value="Teman">Teman Sekolah/Kuliah</option>
                      <option value="Rekan Kerja">Rekan Kerja</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-0 pointer-events-none text-on-surface-variant/70 text-lg">expand_more</span>
                  </div>
                </div>
                <div className="group bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5 hover:border-outline-variant hover:bg-surface-container-lowest transition-all duration-300 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary shadow-sm">
                  <label className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                    Jumlah Pax
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addGuestForm.guest_count}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "")
                      setAddGuestForm((p) => ({ ...p, guest_count: val ? Math.max(1, Number(val)) : 1 }))
                    }}
                    placeholder="1"
                    className="w-full bg-transparent border-0 p-0 font-body-lg text-base text-primary placeholder:text-outline-variant/60 focus:ring-0"
                  />
                </div>
                <div className="group bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5 hover:border-outline-variant hover:bg-surface-container-lowest transition-all duration-300 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary shadow-sm">
                  <label className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                    Nomor Meja
                  </label>
                  <input
                    type="text"
                    value={addGuestForm.table_number}
                    onChange={(e) => setAddGuestForm((p) => ({ ...p, table_number: e.target.value }))}
                    placeholder="Contoh: Meja 12 atau VIP 1"
                    className="w-full bg-transparent border-0 p-0 font-body-lg text-base text-primary placeholder:text-outline-variant/60 focus:ring-0"
                  />
                </div>
              </div>

              {/* Keterangan Tambahan */}
              <div className="group bg-surface-container-lowest/50 border border-outline-variant/60 rounded-xl p-5 hover:border-outline-variant hover:bg-surface-container-lowest transition-all duration-300 focus-within:ring-1 focus-within:ring-secondary focus-within:border-secondary shadow-sm">
                <label className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                  Keterangan Tambahan
                </label>
                <textarea
                  value={addGuestForm.notes}
                  onChange={(e) => setAddGuestForm((p) => ({ ...p, notes: e.target.value }))}
                  rows={3}
                  placeholder="Contoh: Alergi kacang, membutuhkan akses kursi roda, dsb..."
                  className="w-full bg-transparent border-0 p-0 font-body-md text-sm text-primary placeholder:text-outline-variant/60 resize-none focus:ring-0"
                />
              </div>
            </div>

            {/* Bottom action */}
            <div className="shrink-0 bg-surface/80 backdrop-blur-md px-6 py-6 border-t border-outline-variant/30">
              {addGuestError && (
                <p className="text-error text-xs text-center mb-3 font-medium">{addGuestError}</p>
              )}
              <button
                onClick={handleAddGuest}
                disabled={addGuestSubmitting}
                className="w-full bg-primary hover:bg-secondary text-on-primary py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.99] shadow-md shadow-primary/10 hover:shadow-secondary/20 disabled:opacity-50"
              >
                <span className="font-label-md text-[11px] uppercase tracking-widest font-bold">
                  {addGuestSubmitting ? "Menyimpan..." : "Simpan & Konfirmasi Kehadiran"}
                </span>
                <span className="material-symbols-outlined text-lg transition-transform duration-300 group-hover:translate-x-1">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {addGuestSuccess && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-inverse-surface/95 backdrop-blur-sm text-inverse-on-surface px-6 py-3.5 rounded-xl shadow-xl border border-outline-variant/20 flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-secondary-container text-xl">check_circle</span>
          <span className="font-label-md text-[11px] uppercase tracking-wider font-semibold">Data Tamu Berhasil Disimpan</span>
        </div>
      )}
    </div>
    </>
  )
}
