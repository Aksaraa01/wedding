"use client"

import React, { useState, useEffect, Suspense, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  PACKAGE_CODES,
  PACKAGE_FEATURES,
  WA_TIERS,
  calcTotalBook,
  normalizePhone,
  emptyPriceBook,
  packageDisplayName,
  priceParts,
  type PriceBook,
} from "@/lib/packages"
import GaleriConfigurator, { type GaleriSelection } from "@/components/galeri/GaleriConfigurator"
import ProfileMenu from "@/components/ProfileMenu"
import { packageChangeWaLink } from "@/lib/contact"
import {
  calcVoucherTotals,
  parseVoucherTerms,
  voucherTermsFromRow,
  type VoucherTerms,
} from "@/lib/voucherDiscount"

type MatrixRow = {
  id: string
  label: string
  columns: Record<string, { value: string; class: string }>
}

type MatrixSection = {
  code: string
  label: string
  rows: MatrixRow[]
}

type MatrixCol = {
  code: string
  label: string
}

type CardFeature = {
  icon: string
  text: string
  accent?: boolean
  pt?: boolean
  divider?: boolean
}

type CardDef = {
  code: string
  name: string
  tagline: string
  style: "sage" | "secondary" | "gold" | "elite"
  included?: { icon: string; text: string }
  features: CardFeature[]
  details?: { label: string; items: string[] }
}

const ESSENTIAL_DETAILS = [
  "1 PIC",
  "Greetings / Sapa Tamu",
  "Maps",
  "Countdown",
  "Add to Calendar (Reminder)",
  "Smart Dashboard",
  "Pilihan lagu dan AutoPlay",
  "Subdomain (nama pasangan)",
  "Unlimited Send (Manual)",
  "RSVP",
  "Wedding Wish",
  "Amplop Digital (Rekening Based)",
]

const SIGNATURE_DETAILS = [...ESSENTIAL_DETAILS, "Love Story", "Video Embed", "Alamat Kado", "Turut Mengundang"]

const UNDANGAN_CARDS: CardDef[] = [
  {
    code: "essential",
    name: "Essential",
    tagline: "Fitur dasar untuk undangan digital",
    style: "sage",
    features: [
      { icon: "check", text: "2 Round Revisi" },
      { icon: "check", text: "15 Foto Gallery" },
      { icon: "check", text: "3 Bulan Masa Aktif" },
    ],
    details: { label: "Termasuk Fitur Dasar", items: ESSENTIAL_DETAILS },
  },
  {
    code: "signature",
    name: "Signature",
    tagline: "Pilihan terpopuler",
    style: "secondary",
    features: [
      { icon: "check", text: "3 Round Revisi" },
      { icon: "check", text: "20 Foto Gallery" },
      { icon: "check", text: "6 Bulan Masa Aktif" },
      { icon: "auto_awesome", text: "Love Story, Video Embed, Alamat Kado, Turut Mengundang", accent: true, pt: true },
    ],
    details: { label: "Termasuk Fitur Essential", items: ESSENTIAL_DETAILS },
  },
  {
    code: "prestige",
    name: "Prestige",
    tagline: "Fitur premium lengkap",
    style: "gold",
    features: [
      { icon: "check", text: "5 Round Revisi" },
      { icon: "check", text: "Unlimited Foto Gallery" },
      { icon: "check", text: "1 Tahun Masa Aktif" },
      { icon: "workspace_premium", text: "Custom Logo & Auto-Reminder VIP", accent: true, pt: true },
    ],
    details: { label: "Termasuk Fitur Signature", items: SIGNATURE_DETAILS },
  },
  {
    code: "elite",
    name: "Elite",
    tagline: "Solusi undangan khusus pernikahan Anda",
    style: "elite",
    features: [
      { icon: "workspace_premium", text: "Prioritas Pengerjaan & Konsultan Khusus", accent: true },
      { icon: "check", text: "Masa Aktif 1 Tahun" },
      { icon: "auto_awesome", text: "Full Custom Design sesuai keinginan", accent: true, pt: true },
    ],
    details: { label: "Termasuk Fitur Prestige", items: [...SIGNATURE_DETAILS, "Unlimited Foto Gallery", "Auto-Reminder VIP"] },
  },
]

const DGB_CARDS: CardDef[] = [
  {
    code: "dgb_sistem",
    name: "Sistem",
    tagline: "Sistem dasar buku tamu",
    style: "sage",
    features: [
      { icon: "qr_code_scanner", text: "QR System" },
      { icon: "image", text: "Candid foto dari sisi tamu 2 photo/guest untuk 200 tamu" },
      { icon: "check_circle", text: "Termasuk Semua Fitur Undangan Digital Prestige", divider: true },
    ],
  },
  {
    code: "dgb_pro",
    name: "Pro",
    tagline: "Pilihan terpopuler",
    style: "secondary",
    features: [
      { icon: "devices", text: "2 Devices" },
      { icon: "groups", text: "2 Ushers" },
      { icon: "image", text: "Candid foto dari sisi tamu 2 photo/guest untuk 200 tamu" },
      { icon: "check_circle", text: "Termasuk Semua Fitur Undangan Digital Prestige dan QR Sistem", accent: true, divider: true },
    ],
  },
  {
    code: "dgb_premium",
    name: "Premium",
    tagline: "Fitur buku tamu terlengkap",
    style: "gold",
    features: [
      { icon: "devices", text: "3 Devices" },
      { icon: "groups", text: "3 Ushers" },
      { icon: "image", text: "Candid foto dari sisi tamu 3 photo/guest untuk 200 tamu" },
      { icon: "check_circle", text: "Termasuk Semua Fitur Undangan Digital Prestige dan QR Sistem", divider: true },
    ],
  },
  {
    code: "dgb_prestige",
    name: "Prestige",
    tagline: "Paket buku tamu paling eksklusif",
    style: "gold",
    features: [
      { icon: "devices", text: "4 Devices" },
      { icon: "groups", text: "4 Ushers" },
      { icon: "image", text: "Candid foto dari sisi tamu 4 photo/guest untuk 200 tamu" },
      { icon: "check_circle", text: "Termasuk Semua Fitur Undangan Digital Prestige dan QR Sistem", divider: true },
    ],
  },
]

const STYLES = {
  sage: {
    gradient:
      "bg-[linear-gradient(135deg,rgba(227,235,226,0.4)_0%,rgba(227,235,226,1)_100%)]",
    includedBox: "bg-surface-container-low/50 rounded-xl p-3 mb-4",
    includedIcon: "text-sage-green",
    accent: "text-primary",
    dot: "bg-primary",
    divider: "border-outline-variant/30",
    summaryHover: "hover:text-primary",
    button: "bg-surface-container text-primary border border-outline-variant/30 hover:bg-surface-variant hover:border-outline-variant",
  },
  secondary: {
    gradient: "bg-[linear-gradient(135deg,rgba(255,219,208,0.4)_0%,rgba(255,219,208,1)_100%)]",
    includedBox: "bg-secondary/10 rounded-xl p-3 mb-4",
    includedIcon: "text-secondary",
    accent: "text-secondary",
    dot: "bg-secondary",
    divider: "border-secondary/20",
    summaryHover: "hover:text-secondary",
    button: "bg-surface-container text-primary border border-outline-variant/30 hover:bg-surface-variant hover:border-outline-variant",
  },
  gold: {
    gradient: "bg-[linear-gradient(135deg,rgba(243,238,229,0.4)_0%,rgba(243,238,229,1)_100%)]",
    includedBox: "bg-surface-container-low/50 rounded-xl p-3 mb-4",
    includedIcon: "text-[#d4af37]",
    accent: "text-[#d4af37]",
    dot: "bg-primary",
    divider: "border-outline-variant/30",
    summaryHover: "hover:text-primary",
    button: "bg-surface-container text-primary border border-outline-variant/30 hover:bg-surface-variant hover:border-outline-variant",
  },
  elite: {
    gradient: "bg-[linear-gradient(145deg,rgba(255,253,248,1)_0%,rgba(251,243,224,1)_50%,rgba(247,235,208,1)_100%)]",
    includedBox: "bg-[#d4af37]/10 rounded-xl p-3 mb-4",
    includedIcon: "text-[#b8941f]",
    accent: "text-[#b8941f]",
    dot: "bg-[#d4af37]",
    divider: "border-[#d4af37]/20",
    summaryHover: "hover:text-[#b8941f]",
    button: "bg-[#d4af37] text-white border border-[#b8941f]/30 hover:bg-[#b8941f] shadow-md",
  },
}

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID").replace(/,/g, ".")
}

// Shared voucher modal (registration + edit flows): clear input on open,
// primary Pakai/Tukar CTA, subtle Lepas text-link, no Tutup button (X +
// backdrop close), sans typography, inline validation feedback.
function VoucherModal(props: {
  title: string
  subtitle: React.ReactNode
  input: string
  onInput(v: string): void
  checking: boolean
  busy: boolean
  error: string
  success: string | null
  pakaiLabel: string
  onPakai(): void
  showLepas: boolean
  onLepas(): void
  onClose(): void
}) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={props.onClose}
    >
      <div
        className="bg-surface rounded-2xl p-6 md:p-8 max-w-md w-full border border-outline-variant shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={props.onClose}
          className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
          aria-label="Tutup"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-full shrink-0">
            <span className="material-symbols-outlined">confirmation_number</span>
          </div>
          <h2 className="font-label-md text-label-md uppercase tracking-widest">{props.title}</h2>
        </div>
        <div className="font-body-md text-sm text-on-surface-variant mb-4">{props.subtitle}</div>
        <div className="flex gap-2">
          <input
            value={props.input}
            onChange={(e) => props.onInput(e.target.value.replace(/\s/g, "").toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === " ") e.preventDefault()
            }}
            placeholder="Masukkan kode baru"
            maxLength={64}
            autoComplete="off"
            autoFocus
            className="flex-1 min-w-0 px-4 py-3 bg-surface border border-outline-variant focus:border-primary rounded-xl focus:outline-none font-mono uppercase tracking-widest placeholder:text-on-surface-variant/60 placeholder:normal-case placeholder:tracking-normal placeholder:font-body-md transition-colors"
          />
          <button
            type="button"
            onClick={props.onPakai}
            disabled={props.checking || props.busy || !props.input.replace(/\s/g, "")}
            className="shrink-0 px-6 rounded-xl bg-secondary text-white font-label-md text-[11px] uppercase tracking-widest hover:bg-on-secondary-fixed active:scale-95 transition-all disabled:opacity-50"
          >
            {(props.checking || props.busy) ? "..." : props.pakaiLabel}
          </button>
        </div>
        {props.error && (
          <p className="font-body-md text-sm text-red-500 mt-2">{props.error}</p>
        )}
        {props.success && (
          <p className="font-body-md text-sm text-green-700 mt-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {props.success}
          </p>
        )}
        {props.showLepas && (
          <button
            onClick={props.onLepas}
            disabled={props.busy}
            className="mt-3 mx-auto block text-[11px] uppercase tracking-widest text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
          >
            Lepas voucher
          </button>
        )}
      </div>
    </div>
  )
}

function Inner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get("user") || ""
  const partnerName = searchParams.get("partner") || ""

  const isEdit = searchParams.get("edit") === "true"
  const editProfileId = searchParams.get("profile_id") || ""
  const hasCouple = userName.trim().length > 0 && partnerName.trim().length > 0

  const rawPackage = searchParams.get("package") || ""
  const packageParam = rawPackage && (PACKAGE_CODES as readonly string[]).includes(rawPackage) ? rawPackage : ""
  const initialTab = packageParam
    ? packageParam.startsWith("dgb_")
      ? "dgbook"
      : packageParam === "gt"
        ? "galeri"
        : "undangan"
    : searchParams.get("tab") === "dgbook"
      ? "dgbook"
      : searchParams.get("tab") === "galeri"
        ? "galeri"
        : "undangan"
  const rawWaTier = Number(searchParams.get("wa_tier") || "0")
  const initialWaTier = rawWaTier === 100 || rawWaTier === 200 || rawWaTier === 300 ? rawWaTier : 0
  const initialExpress = searchParams.get("express") === "1"
  const urlGaleriPhotos = Number(searchParams.get("galeri_photos") || "0")
  const urlGaleriGuests = Number(searchParams.get("galeri_guests") || "0")

  const [activeTab, setActiveTab] = useState<"undangan" | "dgbook" | "galeri">(initialTab)
  const [selectedPackage, setSelectedPackage] = useState(
    packageParam || (initialTab === "dgbook" ? "dgb_sistem" : initialTab === "galeri" ? "gt" : "signature")
  )
  const [waBlastTier, setWaBlastTier] = useState<number>(initialWaTier)
  const [expressService, setExpressService] = useState(initialExpress)
  const [undanganFisik, setUndanganFisik] = useState(false)
  // Galeri slider config: standalone GT tab always has one; Undangan tab
  // holds one behind the add-on toggle (preserved when toggled off).
  const [galeriSel, setGaleriSel] = useState<GaleriSelection | null>(null)
  const [galeriAddonOn, setGaleriAddonOn] = useState(false)
  const [galeriAddonSel, setGaleriAddonSel] = useState<GaleriSelection | null>(null)
  const [originalGaleri, setOriginalGaleri] = useState("")
  const [addonsOpen, setAddonsOpen] = useState(false)
  const [galeriPopupOpen, setGaleriPopupOpen] = useState(false)
  const [matrix, setMatrix] = useState<MatrixSection[]>([])
  const [matrixCols, setMatrixCols] = useState<MatrixCol[]>([])
  const [pkgFeatures, setPkgFeatures] = useState<Record<string, string[]>>({})
  // Price book (DB truth). Null until loaded — prices render skeletons and
  // submit stays disabled until every displayed price is real.
  const [book, setBook] = useState<PriceBook | null>(null)
  const [bookError, setBookError] = useState(false)

  const [loaded, setLoaded] = useState(!isEdit)
  const [modalOpen, setModalOpen] = useState(false)
  const footerRef = useRef<HTMLElement | null>(null)
  const [footerH, setFooterH] = useState(0)
  const [matrixOpen, setMatrixOpen] = useState(false)
  const [waNumber, setWaNumber] = useState("")
  const [pin, setPin] = useState("")
  const [showPin, setShowPin] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [originalPackage, setOriginalPackage] = useState<string>("")
  const [originalWaTier, setOriginalWaTier] = useState(0)
  const [originalExpress, setOriginalExpress] = useState(false)
  const [originalFisik, setOriginalFisik] = useState(false)
  const [packageChangeModalOpen, setPackageChangeModalOpen] = useState(false)
  const [deltaInfo, setDeltaInfo] = useState<{ delta: number; newTotal: number; storedTotal: number; newTier?: string | null } | null>(null)
  const [originalGaleriPrice, setOriginalGaleriPrice] = useState(0)
  const [profilePaymentStatus, setProfilePaymentStatus] = useState<"UNPAID" | "PARTIAL_DP" | "FULLY_PAID">("UNPAID")
  const [profileVoucherCode, setProfileVoucherCode] = useState<string | null>(null)

  // Voucher discount (registration flow only — one code per couple).
  const [voucherCode, setVoucherCode] = useState("")
  const [voucherAmount, setVoucherAmount] = useState<number | null>(null)
  const [voucherTerms, setVoucherTerms] = useState<VoucherTerms | null>(null)
  const [voucherFrozen, setVoucherFrozen] = useState(false)
  const [voucherError, setVoucherError] = useState("")
  const [voucherChecking, setVoucherChecking] = useState(false)
  const [voucherModalOpen, setVoucherModalOpen] = useState(false)
  const [voucherModalInput, setVoucherModalInput] = useState("")
  const [voucherModalSuccess, setVoucherModalSuccess] = useState<string | null>(null)
  // Snapshot at open: the title must not flip mid-session when applying
  // changes live profile state (edit applied Pakai while open).
  const [voucherModalHadVoucher, setVoucherModalHadVoucher] = useState(false)

  useEffect(() => {
    fetch("/api/packages/matrix")
      .then((r) => r.json())
      .then((data) => {
        setMatrix(data.matrix || [])
        setMatrixCols(data.columns || [])
        setPkgFeatures(data.features || {})
      })
      .catch(() => {})
    fetch("/api/packages/prices")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("prices unreadable"))))
      .then((data) => {
        if (data && data.base) setBook(data as PriceBook)
        else setBookError(true)
      })
      .catch(() => setBookError(true))
  }, [])

  const fetchProfile = async () => {
    if (!isEdit || !editProfileId) return
    const data = await fetch(`/api/dashboard/${editProfileId}`, { cache: "no-store" }).then((r) => r.json())
    const pkg = data.profile.package_type || "signature"
    setSelectedPackage(pkg)
    setOriginalPackage(pkg)
    setProfilePaymentStatus(data.profile.payment_status || "UNPAID")
    // An explicit tab/package URL param (e.g. upsell deep-links) wins over
    // the profile's current package — otherwise every upsell lands back on
    // the current-package tab.
    const urlTab = searchParams.get("tab")
    if (packageParam || urlTab === "undangan" || urlTab === "dgbook" || urlTab === "galeri") {
      setActiveTab(packageParam
        ? packageParam.startsWith("dgb_") ? "dgbook" : packageParam === "gt" ? "galeri" : "undangan"
        : urlTab as "undangan" | "dgbook" | "galeri")
    } else {
      setActiveTab(pkg.startsWith("dgb_") ? "dgbook" : pkg === "gt" ? "galeri" : "undangan")
    }
    setWaBlastTier(data.profile.wa_blast_tier || 0)
    setOriginalWaTier(data.profile.wa_blast_tier || 0)
    setExpressService(!!data.profile.express_service)
    setOriginalExpress(!!data.profile.express_service)
    setUndanganFisik(!!data.profile.undangan_fisik)
    setOriginalFisik(!!data.profile.undangan_fisik)
    // Galeri prefill (standalone band or Undangan add-on).
    const gp = data.profile
    if (gp.galeri_addon && gp.galeri_photos_per_guest && gp.galeri_guest_count) {
      const sel = {
        photos: gp.galeri_photos_per_guest,
        guests: gp.galeri_guest_count,
        tier: gp.galeri_tier,
        price: gp.galeri_price || 0,
      }
      setGaleriSel(sel)
      setGaleriAddonSel(sel)
      setGaleriAddonOn(pkg !== "gt")
      setOriginalGaleri(JSON.stringify({ on: true, photos: sel.photos, guests: sel.guests }))
      setOriginalGaleriPrice(sel.price || 0)
      if (pkg === "gt") {
        setSelectedPackage("gt")
        setOriginalPackage("gt")
      }
    } else {
      setGaleriAddonOn(false)
      setOriginalGaleri(JSON.stringify({ on: false }))
      setOriginalGaleriPrice(0)
    }
    // Hydrate pending delta top-up (paid Galeri staged but not yet folded)
    // Keep the current slider on the original tier; the sticky bar shows
    // the pending delta via deltaInfo (server-confirmed), so the
    // configurator doesn't need to be overwritten with a price-less stub.
    const addCost = Number((gp as any).additional_cost || 0)
    const addTier = (gp as any).additional_tier as string | null
    if (addCost > 0) {
      const storedTot = Number(gp.total_project_cost || 0)
      setDeltaInfo({ delta: addCost, newTotal: storedTot + addCost, storedTotal: storedTot, newTier: addTier })
    }
    setProfileVoucherCode(data.profile.voucher_code || null)
    if (data.profile.voucher_code) {
      setVoucherCode(data.profile.voucher_code)
      setVoucherAmount(Number(data.profile.voucher_discount) || 0)
      setVoucherTerms(parseVoucherTerms(data.voucher_terms))
      setVoucherFrozen(!!data.voucher_frozen)
    } else {
      setVoucherCode("")
      setVoucherAmount(null)
      setVoucherTerms(null)
      setVoucherFrozen(false)
    }
    setLoaded(true)
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProfileId, isEdit])

  const activeGaleri = activeTab === "galeri" ? galeriSel : activeTab === "undangan" && galeriAddonOn ? galeriAddonSel : activeTab === "dgbook" && galeriAddonOn ? galeriAddonSel : null
  const galeriPrice = activeGaleri?.price || 0
  const isGaleriTab = activeTab === "galeri"
  // Express 24h is not offered on the standalone GT tab.
  const showExpress = activeTab !== "galeri"
  // Standalone GT is a single package code; slider tiers price it.
  const galeriBand = "gt"
  // Package code used for totals, submit, and voucher validation.
  const effectivePackage = isGaleriTab && galeriSel ? galeriBand : selectedPackage
  const parts = book
    ? priceParts(book, effectivePackage, waBlastTier, showExpress && expressService, galeriPrice)
    : { base: 0, waBlast: 0, express: 0, galeri: 0 }
  const total = !book ? 0 : parts.base + parts.waBlast + parts.express + parts.galeri
  const voucherTotals = calcVoucherTotals({
    terms: voucherTerms,
    storedDiscount: voucherAmount,
    frozen: voucherFrozen,
    packageType: effectivePackage,
    parts,
  })
  const discountedTotal = voucherTotals.total
  const appliedVoucherDiscount = voucherTotals.discount
  // Galeri price must be real (DB tiers loaded) before submit is allowed.
  const galeriReady = !activeGaleri || activeGaleri.price > 0

  // The server-staged "sisa bayar" only applies to the exact configuration it
  // was staged for. Any drift (switching package/tab, editing add-ons) hides
  // it, so the sticky bar never quotes a stale selisih for a different
  // selection — e.g. a dgb top-up delta must not linger on the (cheaper)
  // undangan tab.
  const configDirty = useMemo(() => {
    let origSel: { on?: boolean; photos?: number; guests?: number } = {}
    try { origSel = JSON.parse(originalGaleri || "{}") } catch { origSel = {} }
    const curOn = !!activeGaleri
    return (
      effectivePackage !== originalPackage ||
      (waBlastTier || 0) !== (originalWaTier || 0) ||
      (showExpress && !!expressService !== !!originalExpress) ||
      curOn !== !!origSel.on ||
      (curOn && ((activeGaleri!.photos || 0) !== (origSel.photos || 0) || (activeGaleri!.guests || 0) !== (origSel.guests || 0)))
    )
  }, [effectivePackage, originalPackage, waBlastTier, originalWaTier, showExpress, expressService, originalExpress, activeGaleri, originalGaleri])

  // Live selisih for ANY post-payment change (package swap, WA tier, express,
  // galeri top-up) — the sticky bar shows what is still owed before Simpan,
  // using the same price book as the server. Negative = the new selection is
  // cheaper than what was paid (kelebihan bayar).
  const liveDelta = useMemo(() => {
    if (!isEdit || profilePaymentStatus === "UNPAID" || !book) return null
    if (!configDirty) return null
    const origTotal = calcTotalBook(book, originalPackage, originalWaTier, originalExpress, originalGaleriPrice || 0)
    const origDisc = voucherAmount != null ? Math.max(0, origTotal - voucherAmount) : origTotal
    const delta = Math.round(discountedTotal - origDisc)
    if (delta === 0) return null
    return { delta, storedTotal: origDisc, newTotal: discountedTotal, newTier: activeGaleri?.tier ?? null }
  }, [isEdit, profilePaymentStatus, book, configDirty, voucherAmount, originalPackage, originalWaTier, originalExpress, originalGaleriPrice, discountedTotal, activeGaleri])
  const pendingDelta = deltaInfo && !configDirty ? deltaInfo : null

  const handleGtSel = (sel: GaleriSelection) => {
    setGaleriSel(sel)
    setSelectedPackage("gt")
  }

  const applyVoucher = async (code: string, pkg: string): Promise<{ ok: boolean; amount: number }> => {
    const clean = code.replace(/\s/g, "").toUpperCase()
    if (!clean) {
      setVoucherAmount(null)
      setVoucherTerms(null)
      setVoucherError("")
      return { ok: false, amount: 0 }
    }
    setVoucherChecking(true)
    setVoucherError("")
    try {
      const vParts = book
        ? priceParts(book, pkg, waBlastTier, showExpress && expressService, galeriPrice)
        : { base: 0, waBlast: 0, express: 0, galeri: 0 }
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: clean,
          package_type: pkg,
          base: vParts.base,
          wa_blast_price: vParts.waBlast,
          express_price: vParts.express,
          galeri_price: vParts.galeri,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.ok) {
        const amount = Number(data.discount_preview ?? data.amount ?? 0)
        const includes = {
          waBlast: data.include_wa_blast !== false,
          express: data.include_express !== false,
          galeri: data.include_galeri !== false,
        }
        const eligiblePackages = Array.isArray(data.eligible) ? data.eligible : []
        setVoucherCode(clean)
        setVoucherAmount(amount)
        setVoucherTerms(
          data.discount_type === "percent"
            ? { type: "percent", percent: Number(data.percent) || 0, maxDiscount: data.max_discount ?? null, includes, eligiblePackages }
            : { type: "amount", amount, includes, eligiblePackages },
        )
        setVoucherFrozen(false)
        return { ok: true, amount }
      } else {
        setVoucherAmount(null)
        setVoucherTerms(null)
        setVoucherError(data.message || "Kode voucher tidak valid.")
        return { ok: false, amount: 0 }
      }
    } catch {
      setVoucherAmount(null)
      setVoucherTerms(null)
      setVoucherError("Gagal memeriksa voucher. Coba lagi.")
      return { ok: false, amount: 0 }
    } finally {
      setVoucherChecking(false)
    }
  }

  // Re-validate when the package changes — eligibility is per package.
  useEffect(() => {
    if (voucherCode && !isEdit) {
      setVoucherAmount(null)
      setVoucherTerms(null)
      setVoucherError("")
      applyVoucher(voucherCode, selectedPackage)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPackage])

  const switchTab = (tab: "undangan" | "dgbook" | "galeri") => {
    setActiveTab(tab)
    setSelectedPackage(tab === "dgbook" ? "dgb_sistem" : tab === "galeri" ? "gt" : "signature")
    setWaBlastTier(0)
  }

  const showWaTier = (pkgFeatures[selectedPackage] ?? PACKAGE_FEATURES[selectedPackage] ?? []).includes("wa_blast")
  // WA tier options come from the DB book; static quantities only pre-load.
  const waTierOptions = book ? Object.keys(book.waTiers).map(Number).sort((a, b) => a - b) : [...WA_TIERS]
  const activeCards = activeTab === "dgbook" ? DGB_CARDS : UNDANGAN_CARDS
  const matrixVisibleCols = matrixCols.filter((col) => !["cetak_undangan_bonus", "bonus_full_custom"].includes(col.code))
  const matrixUndanganCols = matrixVisibleCols.filter((c) => !c.code.startsWith("dgb_") && !c.code.startsWith("gt_"))
  const matrixDgbCols = matrixVisibleCols.filter((c) => c.code.startsWith("dgb_"))

  const selectPackage = (code: string) => {
    setSelectedPackage(code)
    setWaBlastTier(0)
  }

  const goToRegister = () => {
    const p = new URLSearchParams()
    if (userName) p.set("user", userName)
    if (partnerName) p.set("partner", partnerName)
    const date = searchParams.get("date")
    const guest = searchParams.get("guest")
    if (date) p.set("date", date)
    if (guest) p.set("guest", guest)
    p.set("package", isGaleriTab && galeriSel ? galeriBand : selectedPackage)
    p.set("tab", activeTab)
    if (waBlastTier > 0) p.set("wa_tier", String(waBlastTier))
    if (expressService && !isGaleriTab) p.set("express", "1")
    if (activeGaleri) {
      p.set("galeri_photos", String(activeGaleri.photos))
      p.set("galeri_guests", String(activeGaleri.guests))
    }
    router.push(`/register?${p}`)
  }

  const handleSubmit = async () => {
    if (!userName.trim() || !partnerName.trim()) {
      setSubmitError("Data pengantin tidak lengkap. Silakan ulangi dari halaman pendaftaran.")
      return
    }
    if (!book || !galeriReady) {
      setSubmitError("Harga belum termuat. Tunggu sebentar lalu coba lagi.")
      return
    }
    const cleaned = waNumber.replace(/\D/g, "").replace(/^0+/, "")
    const cleanPin = (pin || "").replace(/\D/g, "")
    if (!cleaned || cleanPin.length !== 6) return

    setSubmitting(true)
    setSubmitError("")

    const phone = normalizePhone(cleaned)

    const phoneCheck = await fetch(`/api/check-phone?q=${encodeURIComponent(phone)}`)
    const phoneResult = await phoneCheck.json()
    if (phoneResult.exists) {
      setSubmitError("Nomor WhatsApp sudah terdaftar. Gunakan nomor lain.")
      setSubmitting(false)
      return
    }

    const coupleCheck = await fetch(
      `/api/check-couple?name1=${encodeURIComponent(userName.trim())}&name2=${encodeURIComponent(partnerName.trim())}`
    )
    const coupleResult = await coupleCheck.json()
    if (coupleResult.exists) {
      setSubmitError("Nama pasangan sudah terdaftar. Hubungi konsultan jika ini pasangan Anda.")
      setSubmitting(false)
      return
    }

    try {
      const rawDate = searchParams.get("date")
      const endOfYear = `${new Date().getFullYear()}-12-31`
      const weddingDate = rawDate && rawDate !== "tentative" ? rawDate : endOfYear
      const guestCount = Number(searchParams.get("guest") || "300")

      const res = await fetch("/api/submit-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bride_name: userName.trim(),
          groom_name: partnerName.trim(),
          estimated_wedding_date: weddingDate,
          estimated_guest_count: guestCount,
          whatsapp_number: phone,
          pin: cleanPin,
          package_type: effectivePackage,
          wa_blast_tier: waBlastTier,
          express_service: isGaleriTab ? false : expressService,
          undangan_fisik: undanganFisik,
          voucher_code: voucherAmount != null ? voucherCode.trim().toUpperCase() : undefined,
          ...(activeGaleri ? { galeri: { photos_per_guest: activeGaleri.photos, guest_count: activeGaleri.guests } } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        const pid = data.wedding_profile_id || data.profile_id || ""
        const donePackage = isGaleriTab && galeriSel ? galeriBand : selectedPackage
        // Galeri standalone lands directly on the event setup page.
        router.push(pid ? (donePackage === "gt" ? `/dashboard/${pid}/galeri-kenangan` : `/dashboard/${pid}`) : "/login")
      } else {
        setSubmitError(data.error || "Terjadi kesalahan. Silakan coba lagi.")
      }
    } catch {
      setSubmitError("Gagal terhubung ke server.")
    } finally {
      setSubmitting(false)
    }
  }

  // Sticky-footer voucher entry: registration always; edit only while UNPAID.
  const showVoucherEntry = !isEdit || profilePaymentStatus === "UNPAID"

  const openVoucherModal = () => {
    setVoucherModalInput("")
    setVoucherError("")
    setVoucherModalSuccess(null)
    setVoucherModalHadVoucher(!!profileVoucherCode)
    setVoucherModalOpen(true)
  }

  const modalPakai = async () => {
    const clean = voucherModalInput.replace(/\s/g, "").toUpperCase()
    if (!clean || submitting || voucherChecking) return
    if (!isEdit) {
      const r = await applyVoucher(clean, effectivePackage)
      if (r.ok) {
        setVoucherModalSuccess(`Kode ${clean} valid — potongan ${formatRp(r.amount)}.`)
        setVoucherModalOpen(false)
      }
      return
    }
    setSubmitting(true)
    setVoucherError("")
    setVoucherModalSuccess(null)
    try {
      // Edit mode validates against the PENDING package (tab switch not yet
      // saved): the server falls back to the stored package when the body
      // omits it, which wrongly rejects a voucher that covers the new tab
      // (e.g. gt-only voucher while switching signature → galeri).
      const pendingPackage = { package_type: effectivePackage }
      const res = await fetch(`/api/customize/${editProfileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          profileVoucherCode ? { voucher_code: clean, replace_voucher: true, ...pendingPackage } : { voucher_code: clean, ...pendingPackage }
        ),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Voucher tidak dapat digunakan.")
      setProfileVoucherCode(clean)
      setVoucherModalSuccess(`Voucher ${clean} diterapkan.`)
      setVoucherModalOpen(false)
      fetchProfile()
    } catch (err: any) {
      setVoucherError(err?.message || "Voucher tidak dapat digunakan.")
    } finally {
      setSubmitting(false)
    }
  }

  const modalLepas = async () => {
    if (submitting) return
    setSubmitting(true)
    setVoucherError("")
    setVoucherModalSuccess(null)
    try {
      const res = await fetch(`/api/customize/${editProfileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ release_voucher: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Gagal melepas voucher")
      setProfileVoucherCode(null)
      setVoucherAmount(null)
      setVoucherTerms(null)
      setVoucherFrozen(false)
      setVoucherModalInput("")
      setVoucherModalOpen(false)
      fetchProfile()
    } catch (err: any) {
      setVoucherError(err?.message || "Gagal melepas voucher")
    } finally {
      setSubmitting(false)
    }
  }
  const handleSave = async () => {
    const newVoucher = !profileVoucherCode && voucherAmount != null ? voucherCode.trim().toUpperCase() : undefined
    if (!book || !galeriReady) {
      setSubmitError("Harga belum termuat. Tunggu sebentar lalu coba lagi.")
      return
    }
    const galeriPayload =
      activeTab === "galeri"
        ? galeriSel
          ? { photos_per_guest: galeriSel.photos, guest_count: galeriSel.guests }
          : null
        : activeTab === "undangan"
          ? galeriAddonOn && galeriAddonSel
            ? { photos_per_guest: galeriAddonSel.photos, guest_count: galeriAddonSel.guests }
            : null
          : activeTab === "dgbook"
            ? galeriAddonOn && galeriAddonSel
              ? { photos_per_guest: galeriAddonSel.photos, guest_count: galeriAddonSel.guests }
              : null
            : undefined
    const galeriSnapshot = JSON.stringify(
      galeriPayload ? { on: true, photos: galeriPayload.photos_per_guest, guests: galeriPayload.guest_count } : { on: false }
    )
    const hasChanged =
      selectedPackage !== originalPackage ||
      waBlastTier !== originalWaTier ||
      expressService !== originalExpress ||
      undanganFisik !== originalFisik ||
      galeriSnapshot !== originalGaleri ||
      !!newVoucher
    if (isEdit && hasChanged && profilePaymentStatus !== "UNPAID") {
      // Galeri-only top-up after payment is staged as delta (sisa bayar) instead of hard 403.
      const isGaleriOnlyDelta =
        selectedPackage === originalPackage &&
        waBlastTier === originalWaTier &&
        expressService === originalExpress &&
        undanganFisik === originalFisik &&
        !newVoucher &&
        galeriPayload != null &&
        galeriPayload.photos_per_guest > 0 &&
        originalGaleri !== galeriSnapshot
      if (isGaleriOnlyDelta && (originalPackage === "gt" || originalPackage.startsWith("dgb_") || (() => { try { return JSON.parse(originalGaleri || "{}")?.on } catch { return false } })())) {
        setSubmitting(true)
        setSubmitError("")
        try {
          const res = await fetch(`/api/customize/${editProfileId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ galeri: galeriPayload }),
          })
          const data = await res.json().catch(() => ({}))
          if (res.ok && data.requires_deltapay) {
            // Staged top-up: surface the server-confirmed selisih in the SAME
            // consultant popup as a package change (one popup, one flow).
            setDeltaInfo({ delta: data.delta, newTotal: data.newTotal, storedTotal: data.storedTotal, newTier: data.newTier })
            setPackageChangeModalOpen(true)
            return
          }
          if (!res.ok) {
            setSubmitError(data.error || "Gagal menyimpan.")
            return
          }
        } catch {
          setSubmitError("Gagal terhubung ke server.")
          return
        } finally {
          setSubmitting(false)
        }
        // Fall through to generic consultant modal if staging did not handle it
      }
      setPackageChangeModalOpen(true)
      return
    }

    setSubmitting(true)
    setSubmitError("")
    try {
      const res = await fetch(`/api/customize/${editProfileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_type: isGaleriTab && galeriSel ? galeriBand : selectedPackage,
          wa_blast_tier: waBlastTier,
          express_service: isGaleriTab ? false : expressService,
          undangan_fisik: undanganFisik,
          ...(galeriPayload !== undefined ? { galeri: galeriPayload } : {}),
          ...(newVoucher ? { voucher_code: newVoucher } : {}),
        }),
      })
      if (res.ok) {
        if (newVoucher) setProfileVoucherCode(newVoucher)
        // Saved: always route to the dashboard. The voucher popup is
        // button-only (＋ Voucher / Ganti) — no post-save upsell.
        router.push(`/dashboard/${editProfileId}`)
      } else {
        const err = await res.json()
        setSubmitError(err.error || "Gagal menyimpan.")
      }
    } catch {
      setSubmitError("Gagal terhubung ke server.")
    } finally {
      setSubmitting(false)
    }
  }

  // Track the fixed footer's real height (it grows with the voucher chip /
  // selisih row and differs per breakpoint) so <main> always clears it.
  useEffect(() => {
    const el = footerRef.current
    if (!el) return
    const measure = () => setFooterH(el.offsetHeight)
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    measure()
    return () => ro.disconnect()
  }, [loaded])

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-on-surface font-body-md antialiased selection:bg-secondary-container selection:text-on-secondary-container overflow-x-hidden relative">
      {/* Background decorative elements */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sage-green/50 blur-[120px]" />
      </div>

      <header className="fixed top-0 w-full bg-[rgba(253,249,240,0.6)] backdrop-blur-[20px] border-b border-outline-variant/30 h-20 z-50 transition-all duration-300 ease-in-out">
        <div className="max-w-[1200px] mx-auto px-edge-margin-mobile md:px-edge-margin-desktop h-full flex justify-between items-center">
          <button
            onClick={() => {
              if (isEdit) {
                router.push(`/dashboard/${editProfileId}`)
              } else if (hasCouple) {
                const p = new URLSearchParams({
                  step: "2",
                  user: userName,
                  partner: partnerName,
                  date: searchParams.get("date") || "tentative",
                  guest: searchParams.get("guest") || "300",
                })
                router.push(`/register?${p}`)
              } else {
                router.push("/hero")
              }
            }}
            className="flex items-center gap-2 group text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            <span className="font-label-md text-label-md uppercase tracking-widest hidden md:inline">Kembali</span>
          </button>
          <div className="font-headline-md text-headline-md tracking-tighter text-primary font-bold">AKSARAA</div>
          <ProfileMenu />
        </div>
      </header>

      <main
        className="pt-20 pb-32 px-edge-margin-mobile md:px-edge-margin-desktop max-w-[1280px] xl:max-w-[1320px] mx-auto"
        style={footerH > 0 ? { paddingBottom: footerH + 32 } : undefined}
      >
        {/* Header Section */}
        <section className="text-center mb-8 max-w-2xl mx-auto">
          <h2 className="font-headline-lg text-[22px] md:text-headline-lg lg:text-headline-xl mb-2 text-primary tracking-tight">
            Pilih Paket
          </h2>
          <p className="text-sm md:font-body-lg md:text-body-lg text-on-surface-variant font-light">
            Temukan paket terbaik yang sesuai dengan kebutuhan pernikahan impian Anda
          </p>
        </section>

        {/* Segmented Toggle */}
        <div className="sticky top-24 z-40 py-2 mb-8 flex justify-center">
          <div className="inline-flex rounded-full bg-surface-container-low/80 backdrop-blur-md p-1.5 shadow-sm border border-outline-variant/20">
            {(["undangan", "dgbook", "galeri"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => switchTab(tab)}
                className={`px-6 md:px-8 py-2.5 rounded-full font-label-md text-label-md uppercase tracking-widest transition-all duration-300 ${
                  activeTab === tab
                    ? "bg-white text-primary shadow-md"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {tab === "undangan" ? "Undangan Digital" : tab === "dgbook" ? "Buku Tamu Digital" : "Galeri Tamu"}
              </button>
            ))}
          </div>
        </div>

        {/* Package cards (Undangan / Buku Tamu) or slider configurator (Galeri) */}
        {activeTab === "galeri" ? (
          <>
            <GaleriConfigurator
              initialPhotos={galeriSel?.photos || urlGaleriPhotos || 5}
              initialGuests={galeriSel?.guests || urlGaleriGuests || 100}
              onChange={handleGtSel}
            />
          </>
        ) : (
        <div
          className={`grid grid-cols-1 gap-4 md:gap-6 ${
            activeTab === "undangan" ? "lg:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4"
          }`}
        >
          {activeCards.map((pkg) => {
            const isActive = selectedPackage === pkg.code
            const isDgb = activeTab === "dgbook"
            const st = STYLES[pkg.style]
            const popular = pkg.style === "secondary"
            const isElite = pkg.code === "elite"
            const oldPrice = book?.old[pkg.code] ?? null
            const price = book?.base[pkg.code]

            return (
              <div
                key={pkg.code}
                onClick={() => selectPackage(pkg.code)}
                className={`flex flex-col rounded-3xl bg-surface-container-lowest p-6 card-shadow transition-transform duration-500 hover:-translate-y-2 border relative overflow-hidden group cursor-pointer ${
                  isActive
                    ? "border-2 border-secondary scale-[1.02] z-10 shadow-xl shadow-secondary/20"
                    : isElite
                      ? "border-2 border-[#d4af37]/40 shadow-lg shadow-[#d4af37]/20 z-10 lg:scale-[1.05] xl:scale-[1.07]"
                      : popular
                        ? "border-2 border-secondary/30 lg:-mt-4 lg:mb-4 lg:shadow-xl shadow-lg shadow-secondary/20 z-10"
                        : "border border-outline-variant/20"
                }`}
              >
                <div className={`absolute inset-0 ${st.gradient} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
                {popular && <div className="absolute top-0 right-0 w-32 h-32 bg-pattern opacity-20" />}
                <div className="relative z-10 flex flex-col h-full">
                  {popular ? (
                    <div className="flex flex-col h-full">
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="font-headline-md text-headline-md text-primary">{pkg.name}</h3>
                        <span className="material-symbols-outlined text-secondary">stars</span>
                      </div>
                      <p className="text-on-surface-variant text-sm mb-2 font-medium">{pkg.tagline}</p>
                      <div className="mt-4 mb-4">
                        <div className="text-on-surface-variant line-through text-sm mb-1 font-medium whitespace-nowrap">
                          {oldPrice != null ? formatRp(oldPrice) : ""}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-headline-lg text-3xl text-primary font-semibold whitespace-nowrap">{price == null ? <span className="inline-block h-8 w-32 bg-surface-container-high rounded animate-pulse align-middle" /> : formatRp(price)}</span>
                        </div>
                      </div>
                      {pkg.included && (
                        <div className={`${st.includedBox}`}>
                          <div className="flex items-center gap-3 text-sm font-medium">
                            <span className={`material-symbols-outlined ${st.includedIcon}`}>{pkg.included.icon}</span>
                            <span>{pkg.included.text}</span>
                          </div>
                        </div>
                      )}
                      <ul className={`space-y-3 mb-4 ${pkg.details ? "" : "flex-grow"}`}>
                        {pkg.features.map((f) => (
                          <li
                            key={f.text}
                            className={`flex items-start gap-4 ${f.pt ? "pt-2" : ""} ${
                              f.divider ? `pt-3 border-t ${st.divider} mt-3` : ""
                            }`}
                          >
                            <span className={`material-symbols-outlined text-[20px] ${f.accent ? st.accent : "text-primary"}`}>
                              {f.icon}
                            </span>
                            <span className={`font-body-md text-body-md text-on-surface-variant ${f.divider ? "text-sm font-medium" : ""}`}>
                              {f.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {pkg.details && (
                        <details open={isElite} className={`group/details border-t ${st.divider} pt-4 mt-4 flex-grow`}>
                          <summary className={`flex justify-between items-center cursor-pointer font-label-md text-sm font-semibold uppercase tracking-wider text-on-surface-variant ${st.summaryHover} transition-colors list-none`}>
                            <span>{pkg.details.label}</span>
                            <span className="material-symbols-outlined text-sm transition-transform group-open/details:rotate-180">
                              expand_more
                            </span>
                          </summary>
                          <div className="mt-3 pl-2">
                            <ul className="space-y-2 font-body-md text-sm text-on-surface-variant/80">
                              {pkg.details.items.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                  <span className={`w-1 h-1 rounded-full ${st.dot} mt-2.5 shrink-0`} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6 flex-grow">
                      {isElite ? (
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-headline-md text-headline-md text-primary font-bold">{pkg.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider text-[#7a5813] bg-[#f5e5be] border border-[#d4af37]/40">masterpiece</span>
                          <span className="material-symbols-outlined text-[20px] text-[#b89035]">workspace_premium</span>
                        </div>
                      ) : (
                        <h3 className="font-headline-md text-headline-md mb-2 text-primary">{pkg.name}</h3>
                      )}
                      <p className="text-on-surface-variant text-sm mb-2 font-medium">{pkg.tagline}</p>
                      <div className="mt-4 mb-4">
                        <div className="text-on-surface-variant line-through text-sm mb-1 font-medium whitespace-nowrap">
                          {oldPrice != null ? formatRp(oldPrice) : ""}
                        </div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-headline-lg text-3xl text-primary font-semibold whitespace-nowrap">{price == null ? <span className="inline-block h-8 w-32 bg-surface-container-high rounded animate-pulse align-middle" /> : formatRp(price)}</span>
                        </div>
                      </div>
                      {pkg.included && (
                        <div className={`${st.includedBox}`}>
                          <div className="flex items-center gap-3 text-sm font-medium">
                            <span className={`material-symbols-outlined ${st.includedIcon}`}>{pkg.included.icon}</span>
                            <span>{pkg.included.text}</span>
                          </div>
                        </div>
                      )}
                      <ul className="space-y-3 mb-4">
                        {pkg.features.map((f) => (
                          <li
                            key={f.text}
                            className={`flex items-start gap-4 ${f.pt ? "pt-2" : ""} ${
                              f.divider ? `pt-3 border-t ${st.divider} mt-3` : ""
                            }`}
                          >
                            <span className={`material-symbols-outlined text-[20px] ${f.accent ? st.accent : "text-primary"}`}>
                              {f.icon}
                            </span>
                            <span className={`font-body-md text-body-md text-on-surface-variant ${f.divider ? "text-sm font-medium" : ""}`}>
                              {f.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      {pkg.details && (
                        <details className={`group/details border-t ${st.divider} pt-4 mt-4`}>
                          <summary className={`flex justify-between items-center cursor-pointer font-label-md text-sm font-semibold uppercase tracking-wider text-on-surface-variant ${st.summaryHover} transition-colors list-none`}>
                            <span>{pkg.details.label}</span>
                            <span className="material-symbols-outlined text-sm transition-transform group-open/details:rotate-180">
                              expand_more
                            </span>
                          </summary>
                          <div className="mt-3 pl-2">
                            <ul className="space-y-2 font-body-md text-sm text-on-surface-variant/80">
                              {pkg.details.items.map((item) => (
                                <li key={item} className="flex items-start gap-3">
                                  <span className={`w-1 h-1 rounded-full ${st.dot} mt-2.5 shrink-0`} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </details>
                      )}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      selectPackage(pkg.code)
                    }}
                    className={`w-full py-3 rounded-xl font-label-md text-sm font-semibold tracking-wider transition-all duration-300 ${
                      popular ? "mt-6" : ""
                    } ${
                      isActive
                        ? "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary/90"
                        : `${st.button}`
                    }`}
                  >
                    {isActive ? (
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm">check</span>
                        <span>Paket Terpilih</span>
                      </div>
                    ) : (
                      "Pilih Paket Ini"
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        )}

        {activeTab !== "galeri" && (
        <div className="text-center mb-14 mt-12">
          <button onClick={() => setMatrixOpen(true)} className="inline-flex items-center gap-2 font-label-md text-label-md uppercase tracking-widest text-secondary border-b border-secondary/40 pb-1 hover:border-secondary transition-colors">
            <span className="material-symbols-outlined text-[18px]">grid_view</span>
            Lihat Detail Komparasi Fitur
          </button>
        </div>
        )}

        {showWaTier && (
          <div className="hidden md:block">
          <section className="mb-6">
            <div className={`border p-6 md:p-8 bg-white transition-colors ${waBlastTier > 0 ? "border-secondary" : "border-outline-variant/30"}`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-headline-md text-xl md:text-2xl mb-1">Tambah Kapasitas Reminder Tamu VIP</h4>
                  <p className="font-body-md text-[13px] text-on-surface-variant">Reminder otomatis ke 100 Tamu VIP sudah termasuk. Tambah kapasitas undangan sesuai kebutuhan (bertambah di atas 100 tamu).</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={waBlastTier > 0}
                    onChange={() => setWaBlastTier(waBlastTier > 0 ? 0 : 100)}
                  />
                  <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                </label>
              </div>
              {waBlastTier > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {waTierOptions.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setWaBlastTier(tier)}
                      className={`flex-1 min-w-[100px] p-4 border text-center transition-all ${
                        waBlastTier === tier
                          ? "border-secondary bg-secondary-fixed/30"
                          : "border-outline-variant hover:border-secondary"
                      }`}
                    >
                      <span className="font-headline-md text-lg block">+{tier}</span>
                      <span className="font-label-md text-[10px] uppercase tracking-wider text-on-surface-variant">Tamu</span>
                      <span className="font-body-md text-[13px] text-on-surface-variant block mt-1">{book ? formatRp(book.waTiers[tier] ?? 0) : "•••"}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
          </div>
        )}

        {showExpress && (
        <div className="hidden md:block">
        <section className="mb-6">
          <div className={`border p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 bg-white transition-colors ${expressService ? "border-secondary" : "border-outline-variant/30"}`}>
            <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined scale-110 md:scale-125">bolt</span>
              </div>
              <div>
                <h4 className="font-headline-md text-xl md:text-2xl mb-1">Yakin Esok Selesai (24 Hours)</h4>
                <p className="font-body-md text-[14px] md:text-body-md text-on-surface-variant">Percepat produksi dari standar 4-6 hari menjadi hanya 24 jam saja.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-end">
              <div className="text-left md:text-right">
                <span className="font-label-md text-secondary block uppercase tracking-tighter text-[10px] md:text-label-md">Layanan Kilat</span>
                <span className="font-headline-md text-xl md:text-2xl">{book ? formatRp(book.express) : "•••"}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={expressService}
                  onChange={() => setExpressService(!expressService)}
                />
                <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
              </label>
            </div>
          </div>
        </section>
        </div>
        )}

        {activeTab === "undangan" && (
          <section className="mb-6">
            <div className={`border p-6 md:p-8 bg-white rounded-3xl transition-colors ${galeriAddonOn ? "border-secondary" : "border-outline-variant/30"}`}>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined scale-110 md:scale-125">photo_library</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline-md text-xl md:text-2xl mb-1">Tambah Galeri Tamu</h4>
                  <p className="font-body-md text-[13px] md:text-body-md text-on-surface-variant">
                    Candid foto dari sisi tamu.
                    {galeriAddonOn && galeriAddonSel ? ` ${galeriAddonSel.tier} — ${formatRp(galeriAddonSel.price)}.` : " Aktifkan untuk konfigurasi."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={galeriAddonOn}
                    disabled={isEdit && originalPackage === "gt" && profilePaymentStatus !== "UNPAID"}
                    onChange={() => {
                      if (isEdit && originalPackage === "gt" && profilePaymentStatus !== "UNPAID") return
                      const next = !galeriAddonOn
                      setGaleriAddonOn(next)
                      if (next) setGaleriPopupOpen(true)
                    }}
                  />
                  <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary peer-disabled:opacity-50" />
                </label>
              </div>
              {isEdit && originalPackage === "gt" && profilePaymentStatus !== "UNPAID" && galeriAddonOn && (
                <p className="mt-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">Paket Galeri Tamu yang sudah dibayar otomatis terbawa — tidak dapat dimatikan. Ubah kuota jika perlu.</p>
              )}
              {galeriAddonOn && (
                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    {galeriAddonSel ? `${galeriAddonSel.photos} foto/tamu • ${galeriAddonSel.guests} tamu • ${galeriAddonSel.tier} — ${formatRp(galeriAddonSel.price)}` : "Menyiapkan harga..."}
                  </p>
                  <button
                    onClick={() => setGaleriPopupOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-white font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Ubah
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
        {/* Buku Tamu Digital: same first-class galeri toggle as Undangan. */}
        {activeTab === "dgbook" && isEdit && originalPackage.startsWith("dgb_") && (
          <section className="mb-6">
            <div className={`border p-6 md:p-8 bg-white rounded-3xl transition-colors ${galeriAddonOn ? "border-secondary" : "border-outline-variant/30"}`}>
              <div className="flex items-center gap-4 md:gap-6">
                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined scale-110 md:scale-125">photo_library</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-headline-md text-xl md:text-2xl mb-1">Tambah Kuota Galeri</h4>
                  <p className="font-body-md text-[13px] md:text-body-md text-on-surface-variant">
                    Candid foto dari sisi tamu.
                    {galeriAddonOn && galeriAddonSel ? ` ${galeriAddonSel.tier} — ${formatRp(galeriAddonSel.price)}.` : " Aktifkan untuk konfigurasi."}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={galeriAddonOn}
                    onChange={() => {
                      const next = !galeriAddonOn
                      setGaleriAddonOn(next)
                      if (next) setGaleriPopupOpen(true)
                      else setGaleriAddonSel(null)
                    }}
                  />
                  <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary peer-disabled:opacity-50" />
                </label>
              </div>
              {galeriAddonOn && (
                <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
                  <p className="font-body-md text-[13px] text-on-surface-variant">
                    {galeriAddonSel ? `${galeriAddonSel.photos} foto/tamu • ${galeriAddonSel.guests} tamu • ${galeriAddonSel.tier} — ${formatRp(galeriAddonSel.price)}` : "Menyiapkan harga..."}
                  </p>
                  <button
                    onClick={() => setGaleriPopupOpen(true)}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary text-white font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">tune</span>
                    Ubah
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Galeri slider popup (Undangan add-on) */}
        {galeriPopupOpen && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setGaleriPopupOpen(false)} />
            <div className="relative bg-[#f0f4f8] rounded-3xl max-w-3xl w-full max-h-[88dvh] overflow-y-auto p-4 md:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="font-headline-md text-lg text-primary">Galeri Tamu</h3>
                <button onClick={() => setGaleriPopupOpen(false)} aria-label="Tutup" className="text-on-surface-variant hover:text-primary">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <GaleriConfigurator
                initialPhotos={galeriAddonSel?.photos || urlGaleriPhotos || 5}
                initialGuests={galeriAddonSel?.guests || urlGaleriGuests || 100}
                onChange={setGaleriAddonSel}
                action={
                  <button
                    onClick={() => setGaleriPopupOpen(false)}
                    className="shrink-0 h-[52px] px-6 sm:px-8 rounded-full bg-primary text-white font-label-md text-[11px] sm:text-label-md uppercase tracking-[0.15em] hover:bg-secondary transition-colors whitespace-nowrap"
                  >
                    Terapkan
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* Clearance is applied dynamically to <main> from the footer height. */}
      </main>

      {/* Floating add-ons pill — RSVP-dock style. The Galeri tab has no
          add-ons, so the pill stays hidden there. */}
      {activeTab !== "galeri" && (
        <button
          onClick={() => setAddonsOpen(true)}
          aria-label="Add-on layanan"
          title="Add-On Layanan"
          className="fixed right-4 top-1/2 -translate-y-1/2 z-[80] flex items-center gap-2 h-12 pl-4 pr-3 rounded-full bg-[#B88A2D] text-white shadow-xl hover:bg-[#C9A227] active:scale-95 transition-all"
        >
          <span className="font-label-md text-[10px] uppercase tracking-widest whitespace-nowrap">Add-On</span>
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          {(waBlastTier > 0 || (showExpress && expressService) || ((activeTab === "undangan" || activeTab === "dgbook") && galeriAddonOn)) && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-[#B88A2D]" />
          )}
        </button>
      )}
      {addonsOpen && (
        <div className="fixed inset-0 z-[200]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAddonsOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-[#f0f4f8] rounded-t-3xl p-5 pb-8 md:inset-x-auto md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:w-[min(32rem,calc(100vw-3rem))] md:rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-headline-md text-lg text-primary">Add-On Layanan</h3>
              <button onClick={() => setAddonsOpen(false)} aria-label="Tutup" className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {showWaTier && (
                <div className={`border p-4 bg-white ${waBlastTier > 0 ? "border-secondary" : "border-outline-variant/30"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-headline-md text-base mb-0.5">Reminder Tamu VIP</h4>
                      <p className="text-xs text-on-surface-variant">+100 tamu termasuk, tambah sesuai kebutuhan.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={waBlastTier > 0}
                        onChange={() => setWaBlastTier(waBlastTier > 0 ? 0 : 100)}
                      />
                      <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                    </label>
                  </div>
                  {waBlastTier > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {waTierOptions.map((tier) => (
                        <button
                          key={tier}
                          onClick={() => setWaBlastTier(tier)}
                          className={`flex-1 min-w-[80px] p-3 border text-center transition-all ${
                            waBlastTier === tier
                              ? "border-secondary bg-secondary-fixed/30"
                              : "border-outline-variant hover:border-secondary"
                          }`}
                        >
                          <span className="font-headline-md text-base block">+{tier}</span>
                          <span className="text-[12px] text-on-surface-variant block mt-0.5">{book ? formatRp(book.waTiers[tier] ?? 0) : "•••"}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {showExpress && (
              <div className={`border p-4 bg-white ${expressService ? "border-secondary" : "border-outline-variant/30"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-secondary text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-headline-md text-base">Yakin Esok Selesai</h4>
                    <p className="text-xs text-on-surface-variant">{book ? formatRp(book.express) : "•••"} • 24 jam</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={expressService}
                      onChange={() => setExpressService(!expressService)}
                    />
                    <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                  </label>
                </div>
              </div>
              )}
              {activeTab === "undangan" && (
              <div className={`border p-4 bg-white ${galeriAddonOn ? "border-secondary" : "border-outline-variant/30"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined">photo_library</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-headline-md text-base">Galeri Tamu</h4>
                    <p className="text-xs text-on-surface-variant">
                      {galeriAddonOn && galeriAddonSel ? `${galeriAddonSel.tier} • ${formatRp(galeriAddonSel.price)}` : "Candid foto dari sisi tamu"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={galeriAddonOn}
                      onChange={() => {
                        const next = !galeriAddonOn
                        setGaleriAddonOn(next)
                        if (next) {
                          setAddonsOpen(false)
                          setGaleriPopupOpen(true)
                        }
                      }}
                    />
                    <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                  </label>
                </div>
                {galeriAddonOn && (
                  <button onClick={() => { setAddonsOpen(false); setGaleriPopupOpen(true) }} className="mt-2 w-full py-2 rounded-full bg-white border border-outline-variant text-primary font-label-md text-[11px] uppercase tracking-widest hover:bg-surface-container-low">Ubah konfigurasi</button>
                )}
              </div>
              )}
              {/* Buku Tamu Digital top-up: same toggle pattern as Undangan Digital. */}
              {activeTab === "dgbook" && isEdit && originalPackage.startsWith("dgb_") && (
                <div className={`border p-4 bg-white ${galeriAddonOn ? "border-secondary" : "border-outline-variant/30"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined">photo_library</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline-md text-base">Tambah Kuota Galeri</h4>
                      <p className="text-xs text-on-surface-variant">
                        {galeriAddonOn && galeriAddonSel ? `${galeriAddonSel.tier} • ${formatRp(galeriAddonSel.price)}` : "Candid foto dari sisi tamu"}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={galeriAddonOn}
                        onChange={() => {
                          const next = !galeriAddonOn
                          setGaleriAddonOn(next)
                          if (next) {
                            setAddonsOpen(false)
                            setGaleriPopupOpen(true)
                          } else {
                            setGaleriAddonSel(null)
                          }
                        }}
                      />
                      <div className="w-14 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-secondary" />
                    </label>
                  </div>
                  {galeriAddonOn && (
                    <button onClick={() => { setAddonsOpen(false); setGaleriPopupOpen(true) }} className="mt-2 w-full py-2 rounded-full bg-white border border-outline-variant text-primary font-label-md text-[11px] uppercase tracking-widest hover:bg-surface-container-low">Ubah konfigurasi</button>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mt-4 mb-3">
              <span className="font-label-md text-xs uppercase tracking-widest text-on-surface-variant">Estimasi Total</span>
              <span className="font-headline-md text-xl text-secondary">{!book ? "•••" : formatRp(voucherAmount != null ? discountedTotal : total)}</span>
            </div>
            <button
              onClick={() => setAddonsOpen(false)}
              className="w-full py-4 bg-primary text-white rounded-xl font-label-md uppercase tracking-[0.2em] active:scale-[0.98] transition-transform"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}

      <footer ref={footerRef} className={`fixed bottom-0 left-0 w-full bg-[rgba(253,249,240,0.92)] backdrop-blur-md border-t border-outline-variant px-4 md:px-edge-margin-desktop py-4 md:py-6 z-[90] ${packageChangeModalOpen || voucherModalOpen ? "hidden" : ""}`}>
        <div className="max-w-[1200px] mx-auto flex flex-col items-stretch gap-3 sm:flex-row sm:items-center justify-between md:gap-6">
          <div className="flex flex-col items-start min-w-0 flex-1 gap-1.5">
            <span className="font-label-md text-[10px] uppercase text-on-surface-variant tracking-widest">Estimasi Total</span>
            <span className="font-headline-md text-[15px] md:text-[22px] leading-tight truncate max-w-full">{packageDisplayName(isGaleriTab && galeriSel ? galeriBand : selectedPackage)}{!isGaleriTab && activeGaleri ? " + Galeri Tamu" : ""}</span>
            <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
              {!book ? (
                <span className="inline-block h-8 w-40 bg-surface-container-high rounded animate-pulse" />
              ) : voucherAmount != null || profileVoucherCode ? (
                <>
                  <span className="font-body-md text-sm text-on-surface-variant line-through">{formatRp(total)}</span>
                  <span className="font-headline-md text-[22px] md:text-[30px] leading-none text-secondary">{formatRp(discountedTotal)}</span>
                </>
              ) : (
                <span className="font-headline-md text-[22px] md:text-[30px] leading-none text-secondary">{formatRp(total)}</span>
              )}
            </div>
            {bookError && (
              <p className="font-body-md text-sm text-red-500 mt-1">
                Gagal memuat harga. Periksa koneksi lalu muat ulang halaman.
                <button onClick={() => window.location.reload()} className="underline underline-offset-2 ml-1">Muat ulang</button>
              </p>
            )}
            {(voucherAmount != null || profileVoucherCode) && (
              <span className="inline-flex items-center gap-1.5 mt-0.5 px-2.5 py-1 bg-green-50 border border-green-300 text-green-800 font-label-md text-[10px] uppercase tracking-widest rounded-full w-fit">
                <span className="material-symbols-outlined text-[12px]">confirmation_number</span>
                {profileVoucherCode || voucherCode.replace(/\s/g, "").toUpperCase()} − {formatRp(appliedVoucherDiscount)}
                <span className="text-green-800/40">•</span>
                <button
                  onClick={() => {
                    setVoucherError("")
                    setVoucherModalOpen(true)
                  }}
                  className="underline underline-offset-2 decoration-green-800/40 hover:text-green-900 transition-colors"
                >
                  Ganti
                </button>
                <span className="text-green-800/40">•</span>
                <button
                  onClick={() => {
                    if (!isEdit) {
                      setVoucherCode("")
                      setVoucherAmount(null)
                      setVoucherTerms(null)
                      setVoucherFrozen(false)
                      setVoucherError("")
                      return
                    }
                    if (profilePaymentStatus !== "UNPAID") return
                    if (!confirm("Lepas voucher? Potongan harga akan hilang.")) return
                    modalLepas()
                  }}
                  className="underline underline-offset-2 decoration-green-800/40 hover:text-red-500 transition-colors"
                >
                  Hapus
                </button>
              </span>
            )}
            {(pendingDelta || liveDelta) && (() => {
              const d = liveDelta || pendingDelta!
              const isDown = d.delta < 0
              return (
                <div className="mt-2 w-full rounded-xl bg-amber-50 border border-amber-300 px-3 py-2 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                  <span className="text-amber-900">Telah dibayar <span className="font-bold">{formatRp(d.storedTotal)}</span></span>
                  <span className="hidden sm:inline text-amber-700">•</span>
                  {isDown ? (
                    <span className="text-amber-900">Nilai baru lebih rendah <span className="font-bold">{formatRp(Math.abs(d.delta))}</span></span>
                  ) : (
                    <span className="text-amber-900">Sisa bayar <span className="font-bold text-primary">{formatRp(d.delta)}</span> {d.newTier ? `• ${d.newTier}` : ""}</span>
                  )}
                </div>
              )
            })()}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 sm:items-center w-full sm:w-auto">
            {showVoucherEntry && voucherAmount == null && !profileVoucherCode && (
              <button
                onClick={() => {
                  setVoucherError("")
                  setVoucherModalOpen(true)
                }}
                className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 md:py-4 rounded-full md:rounded-none border border-secondary text-secondary font-label-md text-[11px] md:text-label-md uppercase tracking-[0.2em] hover:bg-secondary hover:text-white active:scale-95 transition-all whitespace-nowrap w-full sm:w-auto"
              >
                <span className="material-symbols-outlined text-[16px]">confirmation_number</span>
                ＋ Voucher
              </button>
            )}
          {isEdit ? (
            <button
              onClick={handleSave}
              disabled={submitting || !book || !galeriReady}
              className={`shrink-0 px-6 md:px-12 py-4 bg-primary text-white font-label-md text-[11px] md:text-label-md uppercase tracking-[0.2em] transition-all hover:bg-secondary rounded-full md:rounded-none ${submitting || !book || !galeriReady ? "opacity-50" : ""} w-full sm:w-auto`}
            >
              {submitting ? "Menyimpan..." : !book ? "Memuat harga..." : !galeriReady ? "Menyiapkan galeri..." : "Simpan"}
            </button>
          ) : (
            <button
              onClick={() => {
                if (!book || !galeriReady) return
                if (hasCouple) {
                  setWaNumber(""); setPin(""); setSubmitError(""); setModalOpen(true)
                } else {
                  goToRegister()
                }
              }}
              disabled={!book || !galeriReady}
              className={`shrink-0 px-6 md:px-12 py-4 bg-primary text-white font-label-md text-[11px] md:text-label-md uppercase tracking-[0.2em] hover:bg-secondary transition-all rounded-full md:rounded-none w-full sm:w-auto ${!book || !galeriReady ? "opacity-50" : ""}`}
            >
              {!book ? "Memuat harga..." : !galeriReady ? "Menyiapkan galeri..." : "Lanjut"}
            </button>
          )}
          </div>
        </div>
      </footer>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl p-8 md:p-10 max-w-lg w-full border border-outline-variant/40 shadow-2xl relative max-h-[92dvh] overflow-y-auto">
            <button
              onClick={() => { setModalOpen(false); setPin(""); setWaNumber(""); setSubmitError("") }}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-secondary-container/20 text-secondary flex items-center justify-center rounded-full mx-auto mb-5">
                <span className="material-symbols-outlined scale-150">mail</span>
              </div>
              <h2 className="font-headline-md text-headline-md mb-2">Buat Akun</h2>
              <p className="font-body-md text-sm text-on-surface-variant">Selesaikan pendaftaran Anda dengan nomor WhatsApp dan buat PIN untuk masuk ke dasbor.</p>
            </div>
            <div className="space-y-5">
              <div>
                <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Nomor WhatsApp Aktif</label>
                <div className="flex border border-outline-variant/30 focus-within:border-primary rounded-xl overflow-hidden transition-colors">
                  <span className="px-4 py-3.5 bg-surface-container-highest font-body-md border-r border-outline-variant/30">+62</span>
                  <input
                    className="w-full px-4 py-3.5 bg-transparent focus:outline-none text-lg font-headline-md placeholder:text-outline-variant"
                    placeholder="812 XXXX XXXX"
                    type="tel"
                    value={waNumber}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "")
                      setWaNumber(digits)
                      setSubmitError("")
                    }}
                  />
                </div>
              </div>
              <div>
                <label className="font-label-md text-[10px] uppercase text-on-surface-variant block mb-2 tracking-widest">Buat PIN (6 digit)</label>
                <div className="flex items-center border border-outline-variant/30 focus-within:border-primary rounded-xl overflow-hidden transition-colors">
                  <input
                    className="w-full px-4 py-3.5 bg-transparent focus:outline-none text-lg font-headline-md tracking-[0.3em] placeholder:text-outline-variant"
                    placeholder="••••••"
                    type={showPin ? "text" : "password"}
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 6)
                      setPin(digits)
                      setSubmitError("")
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(v => !v)}
                    className="px-3 text-on-surface-variant hover:text-primary"
                    aria-label={showPin ? "Sembunyikan PIN" : "Tampilkan PIN"}
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPin ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>
              {submitError && (
                <p className="font-body-md text-sm text-red-400">{submitError}</p>
              )}
              <button
                onClick={handleSubmit}
                disabled={!waNumber || pin.length !== 6 || submitting}
                className={`w-full py-4 rounded-xl bg-secondary text-white font-label-md uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all hover:bg-on-secondary-fixed ${
                  !waNumber || pin.length !== 6 || submitting ? "opacity-50" : ""
                }`}
              >
                <span>{submitting ? "Mendaftar..." : "Daftar"}</span>
                <span className="material-symbols-outlined">arrow_right_alt</span>
              </button>
              <div className="rounded-xl bg-surface-container-low p-3.5 text-center">
                <p className="font-label-md text-[11px] text-on-surface-variant leading-relaxed">
                  Nomor WhatsApp &amp; PIN akan digunakan untuk login ke dasbor Anda.
                </p>
              </div>
              <p className="text-[10px] text-center uppercase tracking-tighter text-on-surface-variant">Tanpa biaya pendaftaran. Pembayaran dilakukan setelah draft pertama disetujui.</p>
            </div>
          </div>
        </div>
      )}

      {packageChangeModalOpen && (() => {
        const parseGaleri = (s: string) => {
          try {
            const o = JSON.parse(s || "{}")
            return o?.on ? { on: true as const, photos: Number(o.photos) || 0, guests: Number(o.guests) || 0 } : { on: false as const }
          } catch {
            return { on: false as const }
          }
        }
        const curGaleriPayload =
          activeTab === "galeri"
            ? galeriSel
              ? { photos_per_guest: galeriSel.photos, guest_count: galeriSel.guests }
              : null
            : activeTab === "undangan" || activeTab === "dgbook"
              ? galeriAddonOn && galeriAddonSel
                ? { photos_per_guest: galeriAddonSel.photos, guest_count: galeriAddonSel.guests }
                : null
              : undefined
        const curGaleriSnapshot = JSON.stringify(
          curGaleriPayload ? { on: true, photos: curGaleriPayload.photos_per_guest, guests: curGaleriPayload.guest_count } : { on: false }
        )
        const oldSel = { package: originalPackage, waBlastTier: originalWaTier, express: originalExpress, fisik: originalFisik, galeri: parseGaleri(originalGaleri) }
        // Server-staged top-up (deltaInfo) is authoritative when present; the
        // client estimate (liveDelta) covers package/add-on changes.
        const shownDelta = deltaInfo ?? liveDelta
        const newSel = { package: selectedPackage, waBlastTier, express: expressService, fisik: undanganFisik, galeri: parseGaleri(curGaleriSnapshot), delta: shownDelta?.delta ?? null }
        const summary: string[] = []
        if (selectedPackage !== originalPackage) {
          summary.push(`Paket: ${packageDisplayName(originalPackage)} → ${packageDisplayName(selectedPackage)}`)
        }
        if (waBlastTier !== originalWaTier) summary.push(`WA Blast: ${originalWaTier || "—"} → ${waBlastTier || "—"}`)
        if (expressService !== originalExpress) summary.push(`Express: ${originalExpress ? "Ya" : "Tidak"} → ${expressService ? "Ya" : "Tidak"}`)
        if (undanganFisik !== originalFisik) summary.push(`Fisik: ${originalFisik ? "Ya" : "Tidak"} → ${undanganFisik ? "Ya" : "Tidak"}`)
        if (curGaleriSnapshot !== originalGaleri) {
          const g = parseGaleri(curGaleriSnapshot)
          summary.push(g.on ? `Galeri: ${g.photos} foto × ${g.guests} tamu` : "Galeri: dimatikan")
        }
        if (shownDelta) {
          summary.push(shownDelta.delta > 0 ? `Selisih bayar: ${formatRp(shownDelta.delta)}` : `Nilai baru lebih rendah ${formatRp(Math.abs(shownDelta.delta))}`)
        }
        return (
        <div className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">swap_horiz</span>
              </div>
              <h3 className="font-headline-md text-lg font-medium text-primary">Perubahan dari yang Dibayar</h3>
              <p className="text-sm text-on-surface-variant">
                Pilihan Anda berbeda dari paket yang sudah dibayar. Perubahan paket maupun add-on memerlukan konfirmasi dan bantuan konsultan.
              </p>
              {summary.length > 0 && (
                <div className="w-full rounded-xl bg-surface-container-low border border-outline-variant/40 px-4 py-3 text-left space-y-1">
                  {summary.map((line) => (
                    <p key={line} className="text-[13px] text-on-surface">• {line}</p>
                  ))}
                </div>
              )}
              <button
                onClick={() => window.open(packageChangeWaLink(oldSel, newSel), "_blank")}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                <span className="material-symbols-outlined text-[16px] mr-2">chat</span>
                Kontak Konsultan
              </button>
              <button
                onClick={() => setPackageChangeModalOpen(false)}
                className="w-full border border-outline-variant text-on-surface-variant py-3 rounded-xl font-label-md text-xs uppercase tracking-widest hover:bg-surface-container transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
        )
      })()}

      {voucherModalOpen && (
        <VoucherModal
          title={voucherModalHadVoucher ? "Ganti Voucher" : "Pakai Voucher"}
          subtitle={
            voucherModalHadVoucher ? (
              <>Masukkan kode baru di bawah. Voucher aktif tetap berlaku sampai kode baru diterapkan.</>
            ) : (
              "Masukkan kode dari konsultan untuk potongan harga paket."
            )
          }
          input={voucherModalInput}
          onInput={(v) => {
            setVoucherModalInput(v)
            setVoucherError("")
            setVoucherModalSuccess(null)
          }}
          checking={voucherChecking}
          busy={submitting}
          error={voucherError}
          success={voucherModalSuccess}
          pakaiLabel={voucherModalHadVoucher ? "Tukar" : "Pakai"}
          onPakai={modalPakai}
          showLepas={isEdit && voucherModalHadVoucher && profilePaymentStatus === "UNPAID"}
          onLepas={modalLepas}
          onClose={() => {
            setVoucherModalOpen(false)
            setVoucherError("")
            setVoucherModalSuccess(null)
          }}
        />
      )}

      {matrixOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-start justify-center p-4 py-10 overflow-y-auto"
          onClick={() => setMatrixOpen(false)}
        >
          <div
            className="bg-[#f0f4f8] w-full max-w-5xl border border-outline relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-[#f0f4f8] border-b border-outline-variant px-6 py-5 flex items-center justify-between z-10">
              <h3 className="font-headline-md text-headline-md text-primary">Detail Komparasi Fitur</h3>
              <button onClick={() => setMatrixOpen(false)} className="text-on-surface-variant hover:text-primary">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="overflow-x-auto max-h-[70vh]">
              <table className="w-full text-left min-w-[900px] text-sm">
                <thead className="sticky top-[61px] z-10 bg-[#f0f4f8]">
                  <tr className="font-label-md text-[10px] uppercase tracking-[0.18em] border-b border-outline-variant/40 text-on-surface-variant">
                    <th className="py-2 px-4 font-semibold text-left" rowSpan={2}>
                      FITUR
                    </th>
                    {matrixUndanganCols.length > 0 && (
                      <th colSpan={matrixUndanganCols.length} className="py-2 px-3 text-center font-semibold border-l border-outline-variant/20">
                        Undangan Digital
                      </th>
                    )}
                    {matrixDgbCols.length > 0 && (
                      <th colSpan={matrixDgbCols.length} className="py-2 px-3 text-center font-semibold border-l border-outline-variant/30 bg-secondary/5">
                        Buku Tamu Digital
                      </th>
                    )}
                  </tr>
                  <tr className="font-label-md text-label-md uppercase tracking-widest border-b border-outline-variant">
                    {matrixVisibleCols.map((col) => (
                      <th
                        key={col.code}
                        className={`py-3 px-3 text-center font-semibold border-l border-outline-variant/10 first:border-l-0 ${selectedPackage === col.code ? "text-secondary" : ""} ${col.code.startsWith("dgb_") || col.code.startsWith("gt_") ? "bg-secondary/5" : ""}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((section) => (
                    <React.Fragment key={section.code}>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-lowest">
                        <td className="py-3 px-4 font-label-md text-[10px] text-on-surface-variant tracking-widest uppercase" colSpan={matrixVisibleCols.length + 1}>
                          {section.label}
                        </td>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.id} className="border-b border-outline-variant/20">
                          <td className="py-3.5 px-4">{row.label}</td>
                          {matrixVisibleCols.map((col) => {
                            const cell = row.columns[col.code]
                            return (
                              <td key={col.code} className={`py-3.5 px-3 text-center ${cell?.class || ""} ${selectedPackage === col.code ? "font-semibold" : ""}`}>
                                {cell?.value || "—"}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CustomizePage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  )
}