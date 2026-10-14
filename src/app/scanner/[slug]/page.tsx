"use client"

import { useState, useEffect, use, useRef, useCallback } from "react"
import NativeQrReader from "@/components/scanner/NativeQrReader"
import SelfieModal from "@/components/scanner/SelfieModal"
import { useVisiblePoll } from "@/lib/useVisiblePoll"
import { resolveCoupleName } from "@/lib/coupleName"
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
  bride_full_name?: string | null
  groom_full_name?: string | null
  display_name?: string
  guest_count: number
  has_pin: boolean
  end_date?: string
  cover_photo?: string | null
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

function formatNama(n: string): string {
  return n.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())
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
  const [addGuestForm, setAddGuestForm] = useState({ name: "", phone: "", guest_count: 1, category: "", table_number: "", is_vip: false })
  const [addGuestSubmitting, setAddGuestSubmitting] = useState(false)
  const [addGuestError, setAddGuestError] = useState("")
  const [addGuestSuccess, setAddGuestSuccess] = useState(false)
  const [selectedGuest, setSelectedGuest] = useState<GuestRecord | null>(null)

  const [selfieGuest, setSelfieGuest] = useState<GuestRecord | null>(null)
  const [scanSuccess, setScanSuccess] = useState<GuestRecord | null>(null)
  const [selfieAfter, setSelfieAfter] = useState<"checkin" | "recovery">("checkin")
  const [selfieGuestIds, setSelfieGuestIds] = useState<Set<string>>(new Set())
  const [selfieDoneToast, setSelfieDoneToast] = useState<string | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  const bufferRef = useRef("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    return () => clearTimeout(successTimerRef.current)
  }, [])

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
      showScanSuccess(g)
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
          is_vip: (data.guest as any).is_vip === true,
        }
        await cacheGuests([serverGuest])
        await markCheckedIn(serverGuest.id, token, operatorName)
        const updated = await getGuestByToken(token)
        const g = updated || serverGuest
        setLogEntries((prev) => [g, ...prev])
        updatePending()
        trySync()
        showScanSuccess(g)
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

  // After a successful QR scan, show a centered success animation first,
  // then land on the ambil-foto-checkin (selfie) step.
  function showScanSuccess(guest: GuestRecord) {
    clearTimeout(successTimerRef.current)
    setScanResult(null)
    setScanSuccess(guest)
    successTimerRef.current = setTimeout(() => {
      setScanSuccess(null)
      openSelfieCheckin(guest)
    }, 1800)
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
    showScanSuccess(fake)
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
            is_vip: (g as any).is_vip === true,
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

  // Offline-sync retry, paused while hidden (pending rows stay safe in
  // IndexedDB and flush on the visibility refetch when the phone wakes).
  useVisiblePoll(trySync, 30000, pendingSync > 0)

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
    setAllGuests((prev) => prev.map((g) => g.id === guestId ? { ...g, souvenir_claimed: true } : g))
    setSelectedGuest((prev) => prev && prev.id === guestId ? { ...prev, souvenir_claimed: true } : prev)
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
          is_vip: addGuestForm.is_vip,
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
          is_vip: (g as any).is_vip === true,
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
      setAddGuestForm({ name: "", phone: "", guest_count: 1, category: "", table_number: "", is_vip: false })
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

  const formatTanggalWIB = (iso: string | null | undefined) => {
    if (!iso) return ""
    const d = new Date(iso)
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} WIB`
  }

  const presentCount = logEntries.filter(g => g.is_checked_in).reduce((sum, g) => sum + paxCount(g), 0)
  const totalGuests = allGuests.reduce((sum, g) => sum + paxCount(g), 0)
  const presentGuestRows = logEntries.filter(g => g.is_checked_in).length
  const totalGuestRows = allGuests.length
  const coupleDisplay = eventInfo
    ? resolveCoupleName(eventInfo)
    : ""

  if (!pinVerified) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-5xl text-[#B34E3F] mb-4">lock</span>
            <h1 className="text-2xl font-semibold text-[#2C2A29] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Scanner Concierge</h1>
            {eventInfo && (
              <p className="text-sm text-[#2C2A29]/70">{coupleDisplay}</p>
            )}
            <p className="text-xs text-[#2C2A29]/60 mt-1">Masukkan PIN untuk mengakses scanner</p>
          </div>

          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 shadow-sm">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="w-full text-center text-[2rem] tracking-[0.3em] font-mono bg-[#FAF7F2] border border-[#E2D9CF] rounded-xl py-4 outline-none focus:ring-2 focus:ring-[#B34E3F] text-[#2C2A29]"
              autoFocus
            />
            {pinError && (
              <p className="text-xs text-red-500 mt-3 text-center">{pinError}</p>
            )}
            <button
              onClick={handleVerifyPin}
              disabled={pinInput.length !== 6}
              className="w-full bg-[#B34E3F] text-white text-[11px] uppercase tracking-widest font-bold py-4 mt-4 rounded-xl hover:bg-[#9E3B2D] disabled:opacity-40 transition-colors"
            >
              Verifikasi PIN
            </button>
          </div>

          <p className="text-xs text-[#2C2A29]/60 text-center mt-6">
            PIN dapat diperoleh dari halaman Live Attendance dashboard
          </p>
        </div>
      </div>
    )
  }

  if (showNameInput) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="material-symbols-outlined text-5xl text-[#B34E3F] mb-4">badge</span>
            <h1 className="text-2xl font-semibold text-[#2C2A29] mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Nama Operator</h1>
            <p className="text-sm text-[#2C2A29]/70">Masukkan nama Anda sebagai operator scanner</p>
          </div>

          <div className="bg-white border border-[#E2D9CF] rounded-2xl p-6 shadow-sm">
            <input
              type="text"
              value={operatorName}
              onChange={(e) => setOperatorName(e.target.value)}
              placeholder="Nama operator"
              className="w-full bg-[#FAF7F2] border border-[#E2D9CF] rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-[#B34E3F] text-sm text-[#2C2A29]"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSetName()}
            />
            <button
              onClick={handleSetName}
              disabled={!operatorName.trim()}
              className="w-full bg-[#B34E3F] text-white text-[11px] uppercase tracking-widest font-bold py-4 mt-4 rounded-xl hover:bg-[#9E3B2D] disabled:opacity-40 transition-colors"
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
      <style>{`@keyframes laserMove{0%{top:0%;opacity:0}10%{opacity:1}90%{opacity:1}100%{top:100%;opacity:0}}.scanner-laser{animation:laserMove 2s infinite linear}@keyframes successPop{0%{transform:scale(0.4);opacity:0}55%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}.scan-success-pop{animation:successPop 0.5s ease-out both}@keyframes successFadeUp{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}.scan-success-fade{animation:successFadeUp 0.4s ease-out 0.15s both}`}</style>
      <div className="font-sans min-h-screen antialiased flex flex-col items-center relative bg-[#FAF7F2] text-[#2C2A29]">
        {eventInfo?.cover_photo ? (
          <>
            <div className="fixed inset-0 bg-[#FAF7F2] pointer-events-none" />
            <img src={eventInfo.cover_photo} alt="" className="fixed inset-0 w-full h-full object-cover md:object-contain object-center pointer-events-none" />
            <div className="fixed inset-0 bg-[#FAF7F2]/30 pointer-events-none" />
          </>
        ) : (
          <>
            <div className="fixed inset-0 bg-[#FAF7F2] pointer-events-none" />
            <div className="fixed bottom-0 left-0 pointer-events-none select-none z-0">
              <img src="/images/flower.png" alt="" className="w-32 sm:w-40 md:w-64 lg:w-80 h-auto object-contain object-bottom block max-w-[45vw]" loading="eager" decoding="async" />
            </div>
            <div className="fixed bottom-0 right-0 pointer-events-none select-none z-0">
              <img src="/images/flower.png" alt="" className="w-32 sm:w-40 md:w-64 lg:w-80 h-auto object-contain object-bottom block max-w-[45vw]" loading="eager" decoding="async" style={{ transform: "scaleX(-1)" }} />
            </div>
          </>
        )}
      <header className="w-full bg-[#FAF7F2]/80 backdrop-blur-md border-b border-[#E2D9CF] sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-xl text-[#B34E3F]">qr_code_scanner</span>
          <div>
            <h1 className="text-base font-semibold tracking-wide text-[#2C2A29]">Aksaraa Concierge</h1>
            <p className="text-[9px] uppercase tracking-widest font-medium text-[#2C2A29]/60">
              Gate 1
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${offline ? "bg-red-500" : pendingSync > 0 ? "bg-yellow-500" : "bg-green-500"}`} />
          <button onClick={() => window.location.reload()} className="p-2 hover:bg-black/5 rounded-full transition-colors text-[#2C2A29]/70">
            <span className="material-symbols-outlined text-lg">sync</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 w-full max-w-md mx-auto px-4 pt-5 pb-24 flex-grow">
        <div className="flex flex-col gap-5 items-center">
        <div className="w-full space-y-5">
        {/* Couple badge — centered */}
        <section className="relative text-center px-4 pt-5 pb-5 bg-white/70 backdrop-blur-sm border border-[#E2D9CF] rounded-3xl shadow-sm overflow-hidden">
          <p className="text-[10px] uppercase tracking-[0.35em] text-[#B34E3F] font-bold">The Wedding of</p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#2C2A29] mt-1 relative" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{coupleDisplay || "Aksaraa"}</h1>
        </section>

        {/* Scanner viewport — centered */}
        <section className="bg-white/85 backdrop-blur-md border border-[#E2D9CF] rounded-3xl p-3 shadow-md space-y-3">
          <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden shadow-inner flex flex-col items-center justify-center border border-[#2C2A29]/10">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,#444_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <NativeQrReader onScan={processScan} isPaused={!!scanResult || selfieOpen || !!scanSuccess} />
            <div className="absolute top-6 left-6 w-10 h-10 border-t-[3px] border-l-[3px] border-[#B34E3F] rounded-tl-lg"></div>
            <div className="absolute top-6 right-6 w-10 h-10 border-t-[3px] border-r-[3px] border-[#B34E3F] rounded-tr-lg"></div>
            <div className="absolute bottom-6 left-6 w-10 h-10 border-b-[3px] border-l-[3px] border-[#B34E3F] rounded-bl-lg"></div>
            <div className="absolute bottom-6 right-6 w-10 h-10 border-b-[3px] border-r-[3px] border-[#B34E3F] rounded-br-lg"></div>
            <div className="scanner-laser absolute left-6 right-6 h-0.5 bg-[#B34E3F] shadow-[0_0_8px_#B34E3F] z-10"></div>
            <div className="text-center z-20 space-y-1.5 px-8 pointer-events-none">
              <span className="material-symbols-outlined text-3xl text-white/80 animate-pulse">photo_camera</span>
              <p className="text-xs font-medium text-white tracking-wide">Posisikan QR Code Tamu di Dalam Kotak</p>
              <p className="text-[10px] text-white/50 italic">Kamera mendeteksi otomatis...</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={simulateSuccess} className="flex-1 bg-white hover:bg-[#FAF7F2] text-[#B34E3F] border border-[#E2D9CF] px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold shadow-sm transition-all active:scale-95">
              Simulasi Sukses
            </button>
            <button onClick={() => setScanResult({ type: "error", message: "QR tidak valid / expired" })} className="flex-1 bg-white hover:bg-[#FAF7F2] text-[#2C2A29] border border-[#E2D9CF] px-3 py-2 rounded-xl text-[10px] uppercase tracking-wider font-bold shadow-sm transition-all active:scale-95">
              Simulasi Gagal
            </button>
          </div>
        </section>

        {/* Quick stats card */}
        <section className="bg-[#FAF7F2] border border-[#E2D9CF] rounded-2xl p-4 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider text-[#2C2A29]/60 font-semibold">Kehadiran Tamu</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#B34E3F]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{presentGuestRows}</span>
                <span className="text-sm text-[#2C2A29]/60">/ {totalGuestRows} Tamu</span>
              </div>
              <p className="text-[10px] text-[#2C2A29]/60">{presentCount} / {totalGuests} pax</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white text-[#B34E3F] border border-[#E2D9CF] rounded-full text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B34E3F] animate-pulse"></span> Live Sync
              </span>
            </div>
          </div>
        </section>
        </div>

        <div className="w-full space-y-3">
        {/* Manual check-in accordion — collapsed by default */}
        <section className="border border-[#E2D9CF] rounded-2xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setManualOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-[10px] uppercase tracking-wider text-[#2C2A29]/60 font-semibold">Alternatif Cek-in Manual</span>
            <span className={`material-symbols-outlined text-xl text-[#B34E3F] transition-transform duration-300 ${manualOpen ? "rotate-180" : ""}`}>expand_more</span>
          </button>
          {manualOpen && (
          <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-end">
            <button
              onClick={() => setShowAddGuest(true)}
              className="text-[10px] font-bold uppercase tracking-widest bg-[#B34E3F] text-white px-3 py-1.5 rounded-lg hover:bg-[#9E3B2D] transition-colors"
            >
              + Tambah Tamu Manual
            </button>
          </div>
          <div className="relative border border-[#E2D9CF] focus-within:border-[#B34E3F] rounded-xl bg-white px-3 py-2 flex items-center transition-colors group">
            <span className="material-symbols-outlined text-[#2C2A29]/50 mr-2 text-xl">badge</span>
            <input
              type="text"
              value={manualQuery}
              onChange={(e) => handleManualSearch(e.target.value)}
              placeholder="Masukkan Nama Tamu atau Kode Unik..."
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#2C2A29] placeholder:italic placeholder:text-[12px] placeholder:text-[#2C2A29]/40"
            />
          </div>
          {manualSearching && (
            <div className="py-2 text-center">
              <span className="w-5 h-5 border-2 border-[#B34E3F] border-t-transparent rounded-full animate-spin inline-block" />
            </div>
          )}
          {manualResults.length > 0 && (
            <div className="divide-y divide-[#E2D9CF]/60 border border-[#E2D9CF] rounded-xl bg-white overflow-hidden">
              {manualResults.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGuest(g)}
                  className="w-full text-left p-3 hover:bg-[#FAF7F2] transition-colors"
                >
                  <h4 className="font-medium text-[#2C2A29] text-xs flex flex-wrap items-center gap-1.5">{g.name}
                    {g.is_vip && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-px bg-white border border-[#C5A059] text-[#8B6F2A] text-[9px] uppercase tracking-wider rounded-full">
                        <span className="material-symbols-outlined text-[10px]">star</span>
                        VIP
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-[#2C2A29]/60 font-mono">
                    {formatTableNumber(g.table_number)} &bull; {paxCount(g)} Pax
                  </p>
                </button>
              ))}
            </div>
          )}
          </div>
          )}
        </section>

        {/* Log accordion — collapsed by default */}
        <section className="border border-[#E2D9CF] rounded-2xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setLogOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left"
          >
            <span className="text-[10px] uppercase tracking-wider text-[#2C2A29]/60 font-semibold">Log Riwayat Masuk</span>
            <span className="flex items-center gap-2">
              <span className="text-[9px] text-[#2C2A29]/50 font-mono">Diperbarui Baru Saja</span>
              <span className={`material-symbols-outlined text-xl text-[#B34E3F] transition-transform duration-300 ${logOpen ? "rotate-180" : ""}`}>expand_more</span>
            </span>
          </button>
          {logOpen && (
          <div className="px-4 pb-4">
          <div id="logContainer" className="divide-y divide-[#E2D9CF]/60 border border-[#E2D9CF] rounded-xl bg-white shadow-sm overflow-hidden">
            {logEntries.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[10px] text-[#2C2A29]/60">Belum ada check-in</p>
              </div>
            ) : (
              logEntries.map((g) => (
                <div key={g.id} className={`p-3 flex items-center justify-between text-xs transition-all hover:bg-[#FAF7F2] ${g.is_checked_in ? "bg-[#ECFDF5]/50" : ""}`}>
                  <div className="space-y-0.5">
                    <h4 className="font-medium text-[#2C2A29]">
                      {g.name}
                      {g.is_vip && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-px ml-1 bg-white border border-[#C5A059] text-[#8B6F2A] text-[9px] uppercase tracking-wider rounded-full align-middle">
                          <span className="material-symbols-outlined text-[10px]">star</span>
                          VIP
                        </span>
                      )}
                      {g.added_manually && <span className="text-[10px] text-amber-600 font-bold font-serif pl-1">[Ditambahkan Manual]</span>}
                      {g.category && <span className="text-[10px] text-[#B34E3F] font-bold font-serif pl-1">{g.category}</span>}
                    </h4>
                    <p className="text-[10px] text-[#2C2A29]/60 font-mono">
                      {formatTableNumber(g.table_number)}{g.table_number ? " • " : ""}{paxCount(g)} Pax • {formatTanggalWIB(g.checkin_timestamp)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {g.is_checked_in && !selfieGuestIds.has(g.id) && (
                      <button
                        onClick={(e) => { e.stopPropagation(); openSelfieRecovery(g) }}
                        title="Ambil foto check-in"
                        className="text-[#B34E3F] hover:text-[#9E3B2D] mr-1"
                      >
                        <span className="material-symbols-outlined text-sm">photo_camera</span>
                      </button>
                    )}
                    {!g.souvenir_claimed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleClaimSouvenir(g.id) }}
                        className="text-[9px] text-[#B34E3F] hover:underline mr-1"
                      >
                        Souvenir
                      </button>
                    )}
                    {g.souvenir_claimed && (
                      <span className="material-symbols-outlined text-sm text-yellow-600">card_giftcard</span>
                    )}
                    <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[12px]">check</span> Masuk
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          </div>
          )}
        </section>
        </div>
        </div>
      </main>

      {scanResult && (
        <div id="statusModal" className="fixed inset-0 z-50 bg-[#2C2A29]/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
          <div className="bg-white border border-[#E2D9CF] w-full max-w-[min(92vw,26rem)] rounded-2xl p-6 shadow-2xl text-center space-y-5 relative max-h-[90dvh] overflow-y-auto flex flex-col justify-center">
            <div className={`absolute inset-x-0 top-0 h-1.5 rounded-t-2xl ${
              scanResult.type === "success" ? "bg-[#059669]" : "bg-[#B34E3F]"
            }`} id="modalStatusBar"></div>
            <div className="space-y-2 pt-2">
              <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                scanResult.type === "success" ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#B34E3F]/10 text-[#B34E3F]"
              }`}>
                <span className="material-symbols-outlined text-2xl">
                  {scanResult.type === "success" ? "check" : "warning"}
                </span>
              </div>
              <h3 className={`text-xl font-bold ${
                scanResult.type === "success" ? "text-[#2C2A29]" : "text-[#B34E3F]"
              }`} style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                {scanResult.type === "success" ? "Check-In Berhasil" :
                 scanResult.type === "already" ? "Sudah Check-In" : "QR Tidak Valid / Expired"}
              </h3>
              <p className="text-xs text-[#2C2A29]/60 tracking-wide font-mono uppercase">
                {scanResult.guest?.qr_token ? `AKSR-${scanResult.guest.qr_token.slice(-6)}` : "KODE TIDAK DIKENALI"}
              </p>
            </div>
            <hr className="border-[#E2D9CF]/60" />
            {scanResult.guest && (
              <div className="grid grid-cols-2 gap-4 text-left text-xs bg-[#FAF7F2] p-4 rounded-xl border border-[#E2D9CF]/60">
                <div>
                  <span className="text-[9px] text-[#2C2A29]/60 uppercase tracking-wider block">Nama Tamu</span>
                  <strong className="text-[#2C2A29] font-medium text-sm flex flex-wrap items-center gap-1.5">{scanResult.guest.name}
                    {scanResult.guest.is_vip && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-[#C5A059] text-[#8B6F2A] font-label-md text-[10px] uppercase tracking-wider rounded-full">
                        <span className="material-symbols-outlined text-[11px]">star</span>
                        VIP
                      </span>
                    )}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#2C2A29]/60 uppercase tracking-wider block">Status Kuota</span>
                  <strong className="text-[#2C2A29] font-medium text-sm">{paxCount(scanResult.guest)} Pax Terdaftar</strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-[#2C2A29]/60 uppercase tracking-wider block">Alokasi Meja</span>
                  <strong className="text-[#B34E3F] text-sm font-bold">
                    {formatTableNumber(scanResult.guest.table_number) || "-"}
                  </strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-[#2C2A29]/60 uppercase tracking-wider block">Kategori</span>
                  <strong className="text-[#2C2A29] font-medium text-sm">{scanResult.guest.category || "Reguler"}</strong>
                </div>
              </div>
            )}
            {scanResult.type === "success" && scanResult.guest && !scanResult.guest.souvenir_claimed && (
              <button
                onClick={() => handleClaimSouvenir(scanResult.guest!.id)}
                className="w-full bg-[#FAF7F2] text-[#B34E3F] border border-[#E2D9CF] py-3 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all hover:bg-white flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">card_giftcard</span>
                Ambil Souvenir
              </button>
            )}
            {scanResult.type !== "error" && scanResult.guest && scanResult.guest.is_checked_in && !selfieGuestIds.has(scanResult.guest.id) && (
              <button
                onClick={() => openSelfieRecovery(scanResult.guest!)}
                className="w-full bg-[#FAF7F2] text-[#B34E3F] border border-[#E2D9CF] py-3 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all hover:bg-white flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">photo_camera</span>
                Ambil Foto Check-in
              </button>
            )}
            <button
              onClick={() => setScanResult(null)}
              className="w-full bg-[#B34E3F] hover:bg-[#9E3B2D] text-white py-3.5 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all"
            >
              Lanjutkan Scan Berikutnya
            </button>
          </div>
        </div>
      )}

      {/* Scan success interstitial — centered overlay before ambil foto check-in */}
      {scanSuccess && (
        <div className="fixed inset-0 z-[90] bg-[#2C2A29]/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl px-8 py-10 w-full max-w-xs text-center space-y-4">
            <div className="scan-success-pop w-20 h-20 rounded-full mx-auto flex items-center justify-center bg-[#ECFDF5] text-[#059669]">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <div className="scan-success-fade space-y-1.5">
              <h3 className="text-xl font-bold text-[#2C2A29]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                Check-In Berhasil
              </h3>
              <p className="text-sm text-[#2C2A29]/80 font-medium truncate">{scanSuccess.name}</p>
              <p className="text-[11px] uppercase tracking-widest text-[#2C2A29]/60 font-semibold flex items-center justify-center gap-2 pt-1">
                <span className="w-3.5 h-3.5 border-2 border-[#B34E3F] border-t-transparent rounded-full animate-spin inline-block" />
                Diarahkan ambil foto check-in…
              </p>
            </div>
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#2C2A29]/95 backdrop-blur-sm text-white px-6 py-3.5 rounded-xl shadow-xl border border-[#E2D9CF]/20 flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-[#E2D9CF] text-xl">check_circle</span>
          <span className="text-[11px] uppercase tracking-wider font-semibold">{selfieDoneToast}</span>
        </div>
      )}

      {/* Guest Detail Modal */}
      {selectedGuest && (
        <div className="fixed inset-0 z-50 bg-[#2C2A29]/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-[#FAF7F2] border border-[#E2D9CF] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90dvh] overflow-y-auto">
            {/* Editorial header */}
            <div className="p-6 border-b border-l-2 border-[#B34E3F]/30 ml-6 mt-6 mb-4">
              <span className="text-[11px] text-[#B34E3F] uppercase tracking-[0.25em] block mb-2 font-semibold">Detail Tamu</span>
              <h2 className="text-3xl text-[#2C2A29] font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>{formatNama(selectedGuest.name)}</h2>
            </div>

            {/* Detail grid */}
            <div className="px-6 pb-2 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-left text-xs bg-white border border-[#E2D9CF] rounded-xl p-5">
                <div className="col-span-2">
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">Nama Tamu</span>
                  <strong className="text-[#2C2A29] font-medium text-sm flex flex-wrap items-center gap-1.5">{formatNama(selectedGuest.name)}
                    {selectedGuest.is_vip && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-white border border-[#C5A059] text-[#8B6F2A] font-label-md text-[10px] uppercase tracking-wider rounded-full">
                        <span className="material-symbols-outlined text-[11px]">star</span>
                        VIP
                      </span>
                    )}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">Alokasi Meja</span>
                  <strong className="text-[#B34E3F] text-sm font-bold">
                    {formatTableNumber(selectedGuest.table_number) || "-"}
                  </strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">Jumlah Pax</span>
                  <strong className="text-[#2C2A29] font-medium text-sm">{paxCount(selectedGuest)} Pax</strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">Kategori</span>
                  <strong className="text-[#2C2A29] font-medium text-sm">{selectedGuest.category || "Reguler"}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">Status</span>
                  {selectedGuest.is_checked_in ? (
                    <span className="inline-flex items-center gap-1 bg-[#ECFDF5] text-[#059669] border border-[#059669]/20 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Sudah Check-in
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-[#F5EFE6] text-[#B34E3F] border border-[#B34E3F]/20 rounded-full px-2 py-0.5 text-[10px] font-bold">
                      Belum Check-in
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">Sumber</span>
                  <strong className={`font-medium text-sm ${selectedGuest.added_manually ? "text-amber-600" : "text-[#2C2A29]"}`}>
                    {selectedGuest.added_manually ? "Ditambahkan Manual" : "Undangan QR"}
                  </strong>
                </div>
                <div className="pt-2">
                  <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold">QR Token</span>
                  <strong className="text-[#2C2A29] font-mono text-[10px]">{selectedGuest.qr_token ? `AKSR-${selectedGuest.qr_token.slice(-6)}` : "-"}</strong>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {/* Aksi Concierge / Event Station */}
              <div className="space-y-2">
                <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block font-semibold text-center">Aksi Concierge / Event Station</span>
                <div className="grid grid-cols-2 gap-2">
                  {selfieGuestIds.has(selectedGuest.id) ? (
                    <span className="flex items-center justify-center gap-1 bg-[#D1FAE5] text-[#047857] border border-[#047857]/20 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider">
                      ✓ Photo Diambil
                    </span>
                  ) : (
                    <button
                      onClick={() => openSelfieRecovery(selectedGuest)}
                      className="flex items-center justify-center gap-1 bg-[#F5EFE6] text-[#B34E3F] border border-[#B34E3F]/40 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider hover:bg-white transition-colors"
                    >
                      📸 Ambil Photo
                    </button>
                  )}
                  {selectedGuest.souvenir_claimed ? (
                    <span className="flex items-center justify-center gap-1 bg-[#D1FAE5] text-[#047857] border border-[#047857]/20 rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider">
                      ✓ Suvenir Diambil
                    </span>
                  ) : (
                    <button
                      onClick={() => handleClaimSouvenir(selectedGuest.id)}
                      className="flex items-center justify-center gap-1 bg-[#B34E3F] text-white rounded-xl py-3 px-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[#9E3B2D] transition-colors"
                    >
                      🎁 Ambil Suvenir
                    </button>
                  )}
                </div>
              </div>
              {!selectedGuest.is_checked_in && (
                <button
                  onClick={handleGuestDetailCheckin}
                  className="w-full bg-[#B34E3F] hover:bg-[#9E3B2D] text-white py-4 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                  Check-in Sekarang
                </button>
              )}
              <button
                onClick={() => setSelectedGuest(null)}
                className="w-full bg-[#EFEAE2] hover:bg-[#E2D9CF] text-[#2C2A29] py-4 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tambah Tamu Manual Modal */}
      {showAddGuest && (
        <div className="fixed inset-0 z-50 bg-[#2C2A29]/40 backdrop-blur-sm flex items-center justify-center p-0">
          <div className="bg-white w-full h-full md:max-w-md md:h-auto md:max-h-[90vh] md:rounded-2xl border border-[#E2D9CF] shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-5 border-b border-[#E2D9CF]/60 shrink-0">
              <button
                onClick={() => { setShowAddGuest(false); setAddGuestError("") }}
                className="inline-flex items-center gap-2 text-[#2C2A29]/70 hover:text-[#B34E3F] transition-colors text-[11px] uppercase tracking-wider font-semibold"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Kembali
              </button>
              <div className="w-2 h-2 rounded-full bg-[#B34E3F]/40 animate-pulse" />
            </header>

            {/* Scrollable form */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">
              <div className="border-l-2 border-[#B34E3F]/30 pl-6 py-1">
                <span className="text-[11px] text-[#B34E3F] uppercase tracking-[0.25em] block mb-2 font-semibold">Manajemen Undangan</span>
                <h2 className="text-3xl text-[#2C2A29] font-medium tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Detail Kehadiran Tamu</h2>
                <p className="text-sm text-[#2C2A29]/70 mt-3 max-w-md leading-relaxed">
                  Silakan masukkan informasi tamu secara manual untuk dicatat ke dalam daftar undangan resmi Aksaraa.
                </p>
              </div>

              {/* Nama Lengkap */}
              <div className="group bg-[#FAF7F2] border border-[#E2D9CF]/60 rounded-xl p-5 hover:border-[#E2D9CF] hover:bg-white transition-all duration-300 focus-within:ring-1 focus-within:ring-[#B34E3F] focus-within:border-[#B34E3F] shadow-sm">
                <label className="text-[10px] text-[#2C2A29]/60 uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                  Nama Lengkap Tamu
                </label>
                <input
                  type="text"
                  value={addGuestForm.name}
                  onChange={(e) => setAddGuestForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Contoh: Bpk. Heru Wijaya"
                  className="w-full bg-transparent border-0 p-0 text-base text-[#2C2A29] placeholder:text-[#2C2A29]/30 focus:ring-0"
                />
              </div>

              {/* Nomor WhatsApp */}
              <div className="group bg-[#FAF7F2] border border-[#E2D9CF]/60 rounded-xl p-5 hover:border-[#E2D9CF] hover:bg-white transition-all duration-300 focus-within:ring-1 focus-within:ring-[#B34E3F] focus-within:border-[#B34E3F] shadow-sm">
                <label className="text-[10px] text-[#2C2A29]/60 uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                  Nomor WhatsApp
                </label>
                <div className="relative flex items-center">
                  <span className="text-base text-[#2C2A29]/70 pr-2 select-none font-medium border-r border-[#E2D9CF] mr-2">+62</span>
                  <input
                    type="tel"
                    value={addGuestForm.phone}
                    onChange={(e) => setAddGuestForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))}
                    placeholder="812 3456 7890"
                    className="w-full bg-transparent border-0 p-0 text-base text-[#2C2A29] placeholder:text-[#2C2A29]/30 focus:ring-0"
                  />
                </div>
              </div>

              {/* Kategori */}
              <div className="group bg-[#FAF7F2] border border-[#E2D9CF]/60 rounded-xl p-5 hover:border-[#E2D9CF] hover:bg-white transition-all duration-300 focus-within:ring-1 focus-within:ring-[#B34E3F] focus-within:border-[#B34E3F] shadow-sm">
                <label className="text-[10px] text-[#2C2A29]/60 uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                  Kategori Undangan
                </label>
                <div className="relative flex items-center">
                  <select
                    value={addGuestForm.category}
                    onChange={(e) => setAddGuestForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full bg-transparent border-0 p-0 text-base text-[#2C2A29] appearance-none cursor-pointer focus:ring-0 pr-8"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Kerabat">Kerabat</option>
                    <option value="Teman">Teman</option>
                    <option value="Kolega">Kolega</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-0 pointer-events-none text-[#2C2A29]/60 text-lg">expand_more</span>
                </div>
              </div>

              {/* Is VIP */}
              <div className="group bg-[#FAF7F2] border border-[#E2D9CF]/60 rounded-xl p-5 hover:border-[#E2D9CF] hover:bg-white transition-all duration-300 shadow-sm">
                <button
                  type="button"
                  onClick={() => setAddGuestForm((p) => ({ ...p, is_vip: !p.is_vip }))}
                  className="w-full flex items-center justify-between gap-3"
                >
                  <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#8B6F2A]">star</span>
                    <span className="text-[10px] text-[#2C2A29]/60 uppercase tracking-wider font-semibold text-left">
                      Tamu VIP
                      <span className="block normal-case tracking-normal font-normal text-[#2C2A29]/50 mt-0.5">Kartu QR desain khusus VIP</span>
                    </span>
                  </span>
                  <span className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${addGuestForm.is_vip ? "bg-secondary" : "bg-outline-variant"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${addGuestForm.is_vip ? "right-0.5" : "left-0.5"}`} />
                  </span>
                </button>
              </div>

              {/* Jumlah Pax + Nomor Meja */}
              <div className="grid grid-cols-2 gap-6">
                <div className="group bg-[#FAF7F2] border border-[#E2D9CF]/60 rounded-xl p-5 hover:border-[#E2D9CF] hover:bg-white transition-all duration-300 focus-within:ring-1 focus-within:ring-[#B34E3F] focus-within:border-[#B34E3F] shadow-sm">
                  <label className="text-[10px] text-[#2C2A29]/60 uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
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
                    className="w-full bg-transparent border-0 p-0 text-base text-[#2C2A29] placeholder:text-[#2C2A29]/30 focus:ring-0"
                  />
                </div>
                <div className="group bg-[#FAF7F2] border border-[#E2D9CF]/60 rounded-xl p-5 hover:border-[#E2D9CF] hover:bg-white transition-all duration-300 focus-within:ring-1 focus-within:ring-[#B34E3F] focus-within:border-[#B34E3F] shadow-sm">
                  <label className="text-[10px] text-[#2C2A29]/60 uppercase tracking-wider block mb-1.5 transition-colors font-semibold">
                    Nomor Meja
                  </label>
                  <input
                    type="text"
                    value={addGuestForm.table_number}
                    onChange={(e) => setAddGuestForm((p) => ({ ...p, table_number: e.target.value }))}
                    placeholder="Contoh: Meja 12 atau VIP 1"
                    className="w-full bg-transparent border-0 p-0 text-base text-[#2C2A29] placeholder:text-[#2C2A29]/30 focus:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* Bottom action */}
            <div className="shrink-0 bg-white/80 backdrop-blur-md px-6 py-6 border-t border-[#E2D9CF]/40">
              {addGuestError && (
                <p className="text-red-500 text-xs text-center mb-3 font-medium">{addGuestError}</p>
              )}
              <button
                onClick={handleAddGuest}
                disabled={addGuestSubmitting}
                className="w-full bg-[#B34E3F] hover:bg-[#9E3B2D] text-white py-4 px-8 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-[0.99] shadow-md disabled:opacity-50"
              >
                <span className="text-[11px] uppercase tracking-widest font-bold">
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
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-[#2C2A29]/95 backdrop-blur-sm text-white px-6 py-3.5 rounded-xl shadow-xl border border-[#E2D9CF]/20 flex items-center gap-3 max-w-sm">
          <span className="material-symbols-outlined text-[#E2D9CF] text-xl">check_circle</span>
          <span className="text-[11px] uppercase tracking-wider font-semibold">Data Tamu Berhasil Disimpan</span>
        </div>
      )}
    </div>
    </>
  )
}
