"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import OpsHeader from "@/components/ops/OpsHeader"
import { PACKAGE_CODES, PACKAGE_LABELS } from "@/lib/packages"

type Employee = { id: string; name: string; role: string; phone_number: string }

type VoucherLog = {
  id: string
  action: string
  details: string | null
  changed_by_employee_id: string | null
  changed_by_name: string | null
  created_at: string
}

type Voucher = {
  id: string
  code: string
  title: string
  description: string | null
  discount_type: "amount" | "percent"
  amount: number
  percent: number | null
  max_discount: number | null
  include_wa_blast: boolean
  include_express: boolean
  include_galeri: boolean
  max_uses: number
  used_count: number
  package_eligibility: string[]
  is_active: boolean
  created_at: string
  logs: VoucherLog[]
}

const ACTION_LABELS: Record<string, string> = {
  created: "Dibuat",
  updated: "Diubah",
  activated: "Diaktifkan",
  deactivated: "Dinonaktifkan",
  released: "Dilepas",
  redeemed: "Dipakai",
  redeem_rejected: "Ditolak",
}

const PACKAGE_GROUPS: { label: string; codes: string[] }[] = [
  { label: "Undangan Digital", codes: ["essential", "signature", "prestige", "elite"] },
  { label: "Buku Tamu Digital", codes: ["dgb_sistem", "dgb_pro", "dgb_premium", "dgb_prestige"] },
  { label: "Galeri Tamu", codes: ["gt"] },
  { label: "Bonus", codes: ["cetak_undangan_bonus", "bonus_full_custom"] },
]

const DEFAULT_PKGS = PACKAGE_CODES.filter(
  (c) => c !== "cetak_undangan_bonus" && c !== "bonus_full_custom"
)

function opsHeaders(employee: Employee): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "x-ops-phone": employee.phone_number,
    "x-ops-role": employee.role,
  }
}

function formatRp(n: number): string {
  return "Rp" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

export default function OpsVoucherPage() {
  const router = useRouter()
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState("")
  const [expanded, setExpanded] = useState<string | null>(null)
  const [activityOpen, setActivityOpen] = useState(false)

  // Generate form (admin only). Collapsed until "Tambah Voucher" is clicked.
  const [formOpen, setFormOpen] = useState(false)
  const [scope, setScope] = useState<"all" | "specific">("specific")
  const [notice, setNotice] = useState("")
  const [code, setCode] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount")
  const [amount, setAmount] = useState("50000")
  const [percent, setPercent] = useState("10")
  const [maxDiscount, setMaxDiscount] = useState("")
  const [includeWaBlast, setIncludeWaBlast] = useState(true)
  const [includeExpress, setIncludeExpress] = useState(true)
  const [includeGaleri, setIncludeGaleri] = useState(true)
  const [cap, setCap] = useState("100")
  const [pkgs, setPkgs] = useState<string[]>([...DEFAULT_PKGS])
  const [generating, setGenerating] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  // List search + filters.
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "exhausted">("all")
  const [quotaFilter, setQuotaFilter] = useState<"all" | "available" | "exhausted">("all")
  const [logSearch, setLogSearch] = useState("")

  useEffect(() => {
    if (typeof window === "undefined") return
    const raw = sessionStorage.getItem("ops_employee")
    if (!raw) {
      router.replace("/ops/login")
      return
    }
    try {
      const emp = JSON.parse(raw)
      if (!["admin", "sales"].includes(emp.role)) {
        router.replace("/ops")
        return
      }
      setEmployee(emp)
    } catch {
      router.replace("/ops/login")
    }
  }, [router])

  const isAdmin = employee?.role === "admin"

  const fetchVouchers = useCallback(async () => {
    if (!employee) return
    setLoading(true)
    const res = await fetch("/api/vouchers", { headers: opsHeaders(employee) })
    const data = await res.json().catch(() => ({}))
    if (res.ok) setVouchers(data.vouchers || [])
    else setError(data.error || "Gagal memuat voucher")
    setLoading(false)
  }, [employee])

  useEffect(() => {
    if (employee) fetchVouchers()
  }, [employee, fetchVouchers])

  const togglePackage = (code: string) => {
    setPkgs((cur) => (cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code]))
  }

  const toggleGroup = (codes: string[]) => {
    setPkgs((cur) => {
      const allOn = codes.every((c) => cur.includes(c))
      return allOn ? cur.filter((c) => !codes.includes(c)) : [...new Set([...cur, ...codes])]
    })
  }

  const resetForm = () => {
    setCode("")
    setTitle("")
    setDescription("")
    setDiscountType("amount")
    setAmount("50000")
    setPercent("10")
    setMaxDiscount("")
    setIncludeWaBlast(true)
    setIncludeExpress(true)
    setIncludeGaleri(true)
    setCap("100")
    setPkgs([...DEFAULT_PKGS])
    setScope("specific")
  }

  const closeForm = () => {
    setFormOpen(false)
    setError("")
  }

  const generate = async () => {
    if (!employee || generating) return
    const cleanCode = code.replace(/\s/g, "").toUpperCase()
    if (!cleanCode) {
      setError("Kode voucher wajib diisi.")
      return
    }
    if (!title.trim()) {
      setError("Judul voucher wajib diisi.")
      return
    }
    if (scope === "specific" && pkgs.length === 0) {
      setError('Pilih minimal satu paket, atau pilih "Semua Paket".')
      return
    }
    const amountNum = parseInt(amount, 10) || 0
    const percentNum = parseInt(percent, 10) || 0
    if (discountType === "amount" && amountNum <= 0) {
      setError("Potongan harus lebih dari 0.")
      return
    }
    if (discountType === "percent" && (percentNum < 1 || percentNum > 100)) {
      setError("Persentase harus antara 1 dan 100.")
      return
    }
    const maxDiscountNum = maxDiscount.trim() ? parseInt(maxDiscount, 10) || 0 : null
    if (discountType === "percent" && maxDiscount.trim() && maxDiscountNum !== null && maxDiscountNum <= 0) {
      setError("Batas potongan harus lebih dari 0.")
      return
    }
    setGenerating(true)
    setError("")
    setNotice("")
    const res = await fetch("/api/vouchers", {
      method: "POST",
      headers: opsHeaders(employee),
      body: JSON.stringify({
        code: cleanCode,
        title: title.trim(),
        description: description.trim() || undefined,
        discount_type: discountType,
        amount: discountType === "amount" ? amountNum : 0,
        percent: discountType === "percent" ? percentNum : null,
        max_discount: discountType === "percent" ? maxDiscountNum : null,
        include_wa_blast: includeWaBlast,
        include_express: includeExpress,
        include_galeri: includeGaleri,
        max_uses: parseInt(cap, 10) || 0,
        package_eligibility: scope === "all" ? [] : pkgs,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok) {
      setNotice(`Voucher${data?.voucher?.code ? ` ${data.voucher.code}` : ""} berhasil dibuat.`)
      resetForm()
      setFormOpen(false)
      fetchVouchers()
    } else {
      setError(data.error || "Gagal membuat voucher")
    }
    setGenerating(false)
  }

  const toggleActive = async (v: Voucher) => {
    if (!employee || toggling) return
    setToggling(v.id)
    const res = await fetch(`/api/vouchers/${v.id}`, {
      method: "PUT",
      headers: opsHeaders(employee),
      body: JSON.stringify({ is_active: !v.is_active }),
    })
    if (res.ok) fetchVouchers()
    setToggling(null)
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(""), 2000)
    })
  }

  // Voucher-page activity: employee actions only (created/updated/activated/
  // deactivated/released) — couple redemptions live in each couple's Riwayat.
  const ADMIN_ACTIONS = ["created", "updated", "activated", "deactivated", "released"]

  const allAdminActivity = useMemo(() => {
    const all: (VoucherLog & { code: string })[] = []
    for (const v of vouchers) {
      for (const l of v.logs || []) {
        if (!ADMIN_ACTIONS.includes(l.action)) continue
        all.push({ ...l, code: v.code })
      }
    }
    return all.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  }, [vouchers])

  const recentActivity = useMemo(() => {
    const q = logSearch.trim().toLowerCase()
    const filtered = q
      ? allAdminActivity.filter(
          (l) =>
            l.code.toLowerCase().includes(q) ||
            (l.changed_by_name || "").toLowerCase().includes(q) ||
            (ACTION_LABELS[l.action] || l.action).toLowerCase().includes(q)
        )
      : allAdminActivity
    return filtered.slice(0, 30)
  }, [allAdminActivity, logSearch])

  const filteredVouchers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return vouchers.filter((v) => {
      if (q && !(v.code.toLowerCase().includes(q) || (v.title || "").toLowerCase().includes(q))) return false
      const exhausted = v.used_count >= v.max_uses
      if (statusFilter === "active" && (!v.is_active || exhausted)) return false
      if (statusFilter === "inactive" && v.is_active) return false
      if (statusFilter === "exhausted" && !exhausted) return false
      if (quotaFilter === "available" && exhausted) return false
      if (quotaFilter === "exhausted" && !exhausted) return false
      return true
    })
  }, [vouchers, search, statusFilter, quotaFilter])

  return (
    <div className="min-h-screen bg-background text-on-surface pb-20">
      <OpsHeader employee={employee || { name: "", role: "" }} activeKey="voucher" />
      <main className="pt-28 px-6 lg:px-10 max-w-7xl mx-auto w-full">
        <section className="mb-8">
          <h2 className="font-headline-xl text-[20px] md:text-[28px] leading-tight mb-2">Voucher Diskon</h2>
          <p className="text-on-surface-variant text-sm opacity-80 max-w-xl leading-relaxed">
             Buat kode voucher manual untuk customer. Satu kode bisa dipakai banyak couple sampai cap tercapai — pemakaian tercatat otomatis.
          </p>
        </section>

        {error && (
          <div className="mb-6 p-4 border border-red-300 bg-red-50 text-sm text-red-700 rounded-xl">{error}</div>
        )}

        {notice && (
          <div className="mb-6 p-4 border border-green-300 bg-green-50 text-sm text-green-800 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            {notice}
          </div>
        )}

        {isAdmin && (
          <section className="mb-10 bg-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
            {!formOpen ? (
              <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-label-md text-label-md uppercase tracking-widest">Voucher Baru</h3>
                  <p className="text-sm text-on-surface-variant mt-1">Buat kode diskon baru untuk customer.</p>
                </div>
                <button
                  onClick={() => {
                    setFormOpen(true)
                    setNotice("")
                    setError("")
                  }}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-6 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary active:scale-95 transition-all shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Tambah Voucher
                </button>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className="font-label-md text-label-md uppercase tracking-widest">Voucher Baru</h3>
                    <p className="text-xs text-on-surface-variant mt-1">
                      Field bertanda <span className="text-red-500">*</span> wajib diisi. Kode tidak boleh mengandung spasi dan tidak dapat diubah setelah dibuat.
                    </p>
                  </div>
                  <button
                    onClick={closeForm}
                    aria-label="Tutup form"
                    className="w-8 h-8 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div className="mb-4">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
                    Kode Voucher <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\s/g, "").toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === " ") e.preventDefault()
                    }}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background font-mono tracking-wide focus:outline-none focus:border-primary"
                    placeholder="cth: PROMO50"
                    maxLength={64}
                    autoCapitalize="characters"
                  />
                </div>
                <div className="mb-4">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
                    Judul <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                    placeholder="cth: Promo Kemerdekaan 50K"
                    maxLength={120}
                  />
                </div>
                <div className="mb-4">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
                    Deskripsi <span className="normal-case opacity-60">(opsional)</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background resize-none focus:outline-none focus:border-primary"
                    placeholder="cth: Untuk 100 pendaftar pertama via Instagram"
                    rows={2}
                    maxLength={500}
                  />
                </div>
                <div className="mb-5">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-2">Jenis Potongan</label>
                  <div className="inline-flex p-0.5 bg-surface-container rounded-full mb-4">
                    <button
                      onClick={() => setDiscountType("amount")}
                      className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest transition-colors ${
                        discountType === "amount" ? "bg-white shadow-sm text-on-surface font-semibold" : "text-on-surface-variant"
                      }`}
                    >
                      Nominal (Rp)
                    </button>
                    <button
                      onClick={() => setDiscountType("percent")}
                      className={`px-4 py-1.5 rounded-full text-[11px] uppercase tracking-widest transition-colors ${
                        discountType === "percent" ? "bg-white shadow-sm text-on-surface font-semibold" : "text-on-surface-variant"
                      }`}
                    >
                      Persen (%)
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {discountType === "amount" ? (
                      <div>
                        <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">Potongan (Rp)</label>
                        <input
                          value={amount}
                          onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                          inputMode="numeric"
                          className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                          placeholder="50000"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">Persentase (%)</label>
                          <input
                            value={percent}
                            onChange={(e) => setPercent(e.target.value.replace(/\D/g, "").slice(0, 3))}
                            inputMode="numeric"
                            className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                            placeholder="10"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
                            Batas Potongan (Rp) <span className="normal-case opacity-60">(opsional)</span>
                          </label>
                          <input
                            value={maxDiscount}
                            onChange={(e) => setMaxDiscount(e.target.value.replace(/\D/g, ""))}
                            inputMode="numeric"
                            className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                            placeholder="Tanpa batas"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">Cap Limit (maks. pemakaian)</label>
                      <input
                        value={cap}
                        onChange={(e) => setCap(e.target.value.replace(/\D/g, ""))}
                        inputMode="numeric"
                        className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:border-primary"
                        placeholder="100"
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-2">Berlaku untuk add-on</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: "WA Blast", value: includeWaBlast, set: setIncludeWaBlast },
                      { label: "Express", value: includeExpress, set: setIncludeExpress },
                      { label: "Galeri Tamu", value: includeGaleri, set: setIncludeGaleri },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => item.set(!item.value)}
                        className={`px-4 py-2 rounded-full border text-[11px] uppercase tracking-widest transition-colors ${
                          item.value ? "border-primary bg-primary/5 text-primary" : "border-outline-variant text-on-surface-variant"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-2">
                    Persen dihitung dari paket + add-on yang dipilih di atas.
                  </p>
                </div>

                <div className="mb-5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="text-[11px] uppercase tracking-widest text-on-surface-variant">Berlaku untuk paket</label>
                    <div className="inline-flex p-0.5 bg-surface-container rounded-full">
                      <button
                        onClick={() => setScope("all")}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-widest transition-colors ${
                          scope === "all" ? "bg-white shadow-sm text-on-surface font-semibold" : "text-on-surface-variant"
                        }`}
                      >
                        Semua Paket
                      </button>
                      <button
                        onClick={() => setScope("specific")}
                        className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-widest transition-colors ${
                          scope === "specific" ? "bg-white shadow-sm text-on-surface font-semibold" : "text-on-surface-variant"
                        }`}
                      >
                        Paket Tertentu
                      </button>
                    </div>
                  </div>
                  {scope === "all" ? (
                    <p className="text-sm text-on-surface-variant bg-surface-container-low rounded-xl px-4 py-3">
                      Voucher berlaku untuk semua paket, termasuk paket yang ditambahkan nanti.
                    </p>
                  ) : (
                    <>
                      <div className="rounded-xl border border-outline-variant overflow-hidden">
                        {PACKAGE_GROUPS.map((group) => {
                          const allOn = group.codes.every((c) => pkgs.includes(c))
                          return (
                            <div key={group.label} className="border-b border-outline-variant/50 last:border-b-0">
                              <div className="flex items-center justify-between px-3.5 py-2 bg-surface-container-low">
                                <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">{group.label}</span>
                                <button
                                  onClick={() => toggleGroup(group.codes)}
                                  className="text-[11px] uppercase tracking-widest text-primary hover:underline"
                                >
                                  {allOn ? "Kosongkan" : "Pilih semua"}
                                </button>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 p-2">
                                {group.codes.map((code) => {
                                  const on = pkgs.includes(code)
                                  return (
                                    <button
                                      key={code}
                                      onClick={() => togglePackage(code)}
                                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                                        on ? "bg-primary/5" : "hover:bg-surface-container-low"
                                      }`}
                                    >
                                      <span
                                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 ${
                                          on ? "bg-primary border-primary text-white" : "border-outline"
                                        }`}
                                      >
                                        {on && <span className="material-symbols-outlined text-[12px]" style={{ fontWeight: 700 }}>check</span>}
                                      </span>
                                      <span className={`truncate ${on ? "text-on-surface" : "text-on-surface-variant"}`}>
                                        {PACKAGE_LABELS[code] || code}
                                      </span>
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-2">
                        {pkgs.length === 0
                          ? "Belum ada paket dipilih — pilih minimal satu, atau gunakan Semua Paket."
                          : `${pkgs.length} paket dipilih.`}
                      </p>
                    </>
                  )}
                </div>

                <div className="mb-5 rounded-xl bg-surface-container-low px-4 py-3 flex items-center gap-2.5 text-sm">
                  <span className="material-symbols-outlined text-primary text-[18px]">confirmation_number</span>
                  <span>
                    <span className="font-semibold text-primary">
                      {discountType === "percent"
                        ? `${parseInt(percent, 10) || 0}%${maxDiscount ? ` (maks ${formatRp(parseInt(maxDiscount, 10) || 0)})` : ""}`
                        : formatRp(parseInt(amount, 10) || 0)}
                    </span>
                    <span className="text-on-surface-variant"> untuk </span>
                    <span className="font-medium">{scope === "all" ? "semua paket" : `${pkgs.length} paket`}</span>
                    <span className="text-on-surface-variant"> • maks </span>
                    <span className="font-medium">{parseInt(cap, 10) || 0}x</span>
                    <span className="text-on-surface-variant"> pemakaian</span>
                  </span>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={closeForm}
                    disabled={generating}
                    className="sm:w-40 py-3 rounded-full border border-outline-variant text-on-surface-variant font-label-md text-[11px] uppercase tracking-widest hover:bg-surface-container transition-colors disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    onClick={generate}
                    disabled={generating || !code.replace(/\s/g, "").trim() || !title.trim() || (scope === "specific" && pkgs.length === 0)}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-primary text-white rounded-full px-8 py-3 font-label-md text-[11px] uppercase tracking-widest hover:bg-secondary active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className={`material-symbols-outlined text-[18px] ${generating ? "animate-spin" : ""}`}>
                      {generating ? "progress_activity" : "confirmation_number"}
                    </span>
                    {generating ? "Membuat..." : "Buat Voucher"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {allAdminActivity.length > 0 && (
          <section className="mb-10">
            <button
              onClick={() => setActivityOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-3 text-left"
            >
              <h3 className="font-label-md text-label-md uppercase tracking-widest">Aktivitas Terakhir</h3>
              <span className="material-symbols-outlined text-on-surface-variant">{activityOpen ? "expand_less" : "expand_more"}</span>
            </button>
            {activityOpen && (
              <div className="mt-4">
                <div className="relative md:w-72 md:ml-auto mb-3">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Cari kode / petugas / aksi…"
                    className="w-full pl-10 pr-8 py-2 rounded-full border border-outline-variant bg-white text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
                  />
                  {logSearch && (
                    <button
                      onClick={() => setLogSearch("")}
                      aria-label="Hapus pencarian log"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  )}
                </div>
                <div className="bg-white border border-outline-variant rounded-xl divide-y divide-outline-variant/40 max-h-72 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <p className="px-4 py-4 text-xs text-on-surface-variant/60 italic">Tidak ada aktivitas yang cocok.</p>
                  ) : recentActivity.map((l) => (
                    <div key={l.id} className="px-4 py-2.5 flex items-center gap-3 text-xs">
                      <span className="font-mono font-semibold shrink-0">{l.code}</span>
                      <span className="shrink-0 px-2 py-0.5 rounded-full bg-surface-container-high font-semibold">
                        {ACTION_LABELS[l.action] || l.action}
                      </span>
                      <span className="text-on-surface-variant truncate flex-1">{l.details || "—"}</span>
                      <span className="text-on-surface font-semibold whitespace-nowrap hidden sm:inline">
                        {l.changed_by_name || "Sistem"}
                      </span>
                      <span className="text-on-surface-variant/60 whitespace-nowrap hidden md:inline">
                        {new Date(l.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        <section className="mb-10">
          <h3 className="font-label-md text-label-md uppercase tracking-widest mb-4">Daftar Voucher ({filteredVouchers.length}/{vouchers.length})</h3>
          <div className="mb-4 bg-white border border-outline-variant rounded-xl p-2 flex flex-col md:flex-row gap-2">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari kode atau judul…"
                className="w-full pl-10 pr-8 py-2 rounded-full border border-outline-variant bg-background text-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Hapus pencarian"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-outline-variant rounded-full px-3 py-2 text-xs bg-background focus:outline-none focus:border-primary"
              >
                <option value="all">Semua status</option>
                <option value="active">Aktif</option>
                <option value="inactive">Nonaktif</option>
                <option value="exhausted">Habis</option>
              </select>
              <select
                value={quotaFilter}
                onChange={(e) => setQuotaFilter(e.target.value as any)}
                className="border border-outline-variant rounded-full px-3 py-2 text-xs bg-background focus:outline-none focus:border-primary"
              >
                <option value="all">Semua kuota</option>
                <option value="available">Tersedia</option>
                <option value="exhausted">Habis</option>
              </select>
            </div>
          </div>
          {loading ? (
            <p className="text-sm text-on-surface-variant">Memuat...</p>
          ) : filteredVouchers.length === 0 ? (
            <div className="text-center py-14 bg-white border border-outline-variant rounded-xl">
              <span className="material-symbols-outlined text-5xl text-outline-variant mb-4">confirmation_number</span>
              <p className="text-sm text-on-surface-variant">{vouchers.length === 0 ? "Belum ada voucher. Buat yang pertama di atas." : "Tidak ada voucher yang cocok dengan filter."}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVouchers.map((v) => {
                const pct = v.max_uses > 0 ? Math.min(100, Math.round((v.used_count / v.max_uses) * 100)) : 0
                const exhausted = v.used_count >= v.max_uses
                return (
                  <article key={v.id} className={`bg-white border rounded-xl p-5 shadow-sm ${v.is_active && !exhausted ? "border-outline-variant" : "border-outline-variant/50 opacity-75"}`}>
                    <h4 className="font-headline-md text-[16px] mb-1">{v.title || v.code}</h4>
                    {v.description && (
                      <p className="text-[13px] text-on-surface-variant mb-2 leading-relaxed">{v.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="font-mono font-bold text-lg tracking-wide">{v.code}</span>
                      <button
                        onClick={() => copyCode(v.code)}
                        className="shrink-0 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest border border-outline-variant rounded-full px-3 py-1.5 hover:border-primary hover:text-primary transition-colors"
                        title="Salin kode untuk customer"
                      >
                        <span className="material-symbols-outlined text-[14px]">{copied === v.code ? "check" : "content_copy"}</span>
                        {copied === v.code ? "Tersalin" : "Salin"}
                      </button>
                    </div>
                    <p className="text-sm mb-2">
                      <span className="font-semibold text-primary">
                        {v.discount_type === "percent"
                          ? `${v.percent || 0}%${v.max_discount ? ` (maks ${formatRp(v.max_discount)})` : ""}`
                          : formatRp(v.amount)}
                      </span>
                      <span className="text-on-surface-variant"> • </span>
                      {v.package_eligibility.length > 0 ? (
                        <span className="text-on-surface-variant text-[13px]">{v.package_eligibility.map((c) => PACKAGE_LABELS[c] || c).join(", ")}</span>
                      ) : (
                        <span className="text-on-surface-variant text-[13px]">Semua paket</span>
                      )}
                    </p>
                    <p className="text-[11px] text-on-surface-variant/80 mb-3">
                      Termasuk: {[
                        v.include_wa_blast !== false ? "WA Blast" : null,
                        v.include_express !== false ? "Express" : null,
                        v.include_galeri !== false ? "Galeri" : null,
                      ].filter(Boolean).join(" • ") || "Paket saja"}
                    </p>
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${exhausted ? "bg-red-400" : "bg-green-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-on-surface-variant whitespace-nowrap">
                        {v.used_count}/{v.max_uses}{exhausted ? " • Habis" : ""}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                        className="text-[11px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                      >
                        {expanded === v.id ? "Tutup riwayat" : `Riwayat (${v.logs.filter((l) => ADMIN_ACTIONS.includes(l.action)).length})`}
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => toggleActive(v)}
                          disabled={toggling === v.id}
                          className={`text-[11px] uppercase tracking-widest rounded-full px-4 py-1.5 border transition-colors ${
                            v.is_active
                              ? "border-outline-variant hover:border-red-400 hover:text-red-500"
                              : "border-green-500 text-green-600 hover:bg-green-50"
                          }`}
                        >
                          {v.is_active ? "Nonaktifkan" : "Aktifkan"}
                        </button>
                      )}
                    </div>
                    {expanded === v.id && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/50 space-y-2 max-h-56 overflow-y-auto">
                        {v.logs.filter((l) => ADMIN_ACTIONS.includes(l.action)).length === 0 && (
                          <p className="text-xs text-on-surface-variant/60 italic">Belum ada aktivitas petugas.</p>
                        )}
                        {v.logs.filter((l) => ADMIN_ACTIONS.includes(l.action)).map((l) => (
                          <div key={l.id} className="flex items-start gap-2 text-xs">
                            <span className="shrink-0 px-2 py-0.5 rounded-full bg-surface-container-high font-semibold">
                              {ACTION_LABELS[l.action] || l.action}
                            </span>
                            <div className="min-w-0">
                              <p className="text-on-surface break-words">{l.details || "—"}</p>
                              <p className="text-on-surface-variant/60">
                                {l.changed_by_name || "Sistem"} •{" "}
                                {new Date(l.created_at).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
