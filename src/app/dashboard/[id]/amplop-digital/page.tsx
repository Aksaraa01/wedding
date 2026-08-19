"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import PageTheme from "@/components/PageTheme"
import ProfileMenu from "@/components/ProfileMenu"
import BankSelect from "@/components/dashboard/BankSelect"
import { bankLogoUrl, getBankBySlug, getBankByName } from "@/lib/bankList"

type Account = {
  id: string
  wedding_profile_id: string
  type: "bank" | "ewallet" | "qris"
  provider_name: string
  provider_logo_url: string | null
  account_number: string
  account_name: string
  qris_image_url: string | null
  sort_order: number
}

type Address = {
  id: string
  wedding_profile_id: string
  recipient_name: string
  phone: string
  full_address: string
  city: string | null
  postal_code: string | null
}

type Profile = {
  package_type: string
  bride_name: string
  groom_name: string
}

type PackageGates = {
  gift_address: boolean
}

function showToast(toastFn: (t: { show: boolean; message: string }) => void, msg: string) {
  toastFn({ show: true, message: msg })
  setTimeout(() => toastFn({ show: false, message: "" }), 3000)
}

function AmplopDigitalInner({ id }: { id: string }) {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [packageGates, setPackageGates] = useState<PackageGates>({ gift_address: true })
  const [accounts, setAccounts] = useState<Account[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [activeTab, setActiveTab] = useState("digital")
  const [loading, setLoading] = useState(true)
  const [giftSectionVisible, setGiftSectionVisible] = useState(true)
  const [giftSectionSaving, setGiftSectionSaving] = useState(false)

  const [accountModal, setAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [accProvider, setAccProvider] = useState("")
  const [accNumber, setAccNumber] = useState("")
  const [accOwner, setAccOwner] = useState("")
  const [accSaving, setAccSaving] = useState(false)

  const [addressModal, setAddressModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [addrRecipient, setAddrRecipient] = useState("")
  const [addrPhone, setAddrPhone] = useState("")
  const [addrAddress, setAddrAddress] = useState("")
  const [addrCity, setAddrCity] = useState("")
  const [addrPostal, setAddrPostal] = useState("")
  const [addrSaving, setAddrSaving] = useState(false)

  const [toast, setToast] = useState({ show: false, message: "" })

  const canShowPhysical = packageGates.gift_address

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/${id}`),
      fetch(`/api/gift-accounts?wedding_profile_id=${id}`),
      fetch(`/api/gift-addresses?wedding_profile_id=${id}`),
      fetch(`/api/dashboard/${id}/web-invitation`),
    ])
      .then(([dashRes, accRes, addrRes, wiRes]) =>
        Promise.all([dashRes.json(), accRes.json(), addrRes.json(), wiRes.ok ? wiRes.json() : null])
      )
      .then(([dashData, accData, addrData, wiData]) => {
        setProfile(dashData.profile)
        if (dashData.package_gates) setPackageGates(dashData.package_gates)
        setAccounts(accData.accounts || [])
        setAddresses(addrData.addresses || [])
        if (wiData?.profile?.gift_section_visible !== undefined) setGiftSectionVisible(wiData.profile.gift_section_visible)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  function resetAccountForm(account?: Account | null) {
    if (account) {
      setEditingAccount(account)
      setAccProvider(account.provider_name || "")
      setAccNumber(account.account_number || "")
      setAccOwner(account.account_name || "")
    } else {
      setEditingAccount(null)
      setAccProvider("")
      setAccNumber("")
      setAccOwner("")
    }
  }

  function resetAddressForm(address?: Address | null) {
    if (address) {
      setEditingAddress(address)
      setAddrRecipient(address.recipient_name || "")
      setAddrPhone(address.phone || "")
      setAddrAddress(address.full_address || "")
      setAddrCity(address.city || "")
      setAddrPostal(address.postal_code || "")
    } else {
      setEditingAddress(null)
      setAddrRecipient("")
      setAddrPhone("")
      setAddrAddress("")
      setAddrCity("")
      setAddrPostal("")
    }
  }

  async function handleAccountSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile || !accProvider.trim()) return
    setAccSaving(true)
    try {
      const bank = getBankBySlug(accProvider) || getBankByName(accProvider)
      const type = bank?.type || (editingAccount?.type === "ewallet" ? "ewallet" : "bank")
      const body: Record<string, unknown> = {
        wedding_profile_id: id,
        type,
        provider_name: bank?.name || accProvider,
        provider_logo_url: bank ? bankLogoUrl(bank.slug) : "",
        account_number: accNumber,
        account_name: accOwner,
      }

      let res
      if (editingAccount) {
        res = await fetch(`/api/gift-accounts/${editingAccount.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/gift-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) throw new Error("Gagal menyimpan rekening")
      const data = await res.json()
      const saved = data.account

      if (editingAccount) {
        setAccounts(prev => prev.map(a => a.id === saved.id ? saved : a))
      } else {
        setAccounts(prev => [...prev, saved])
      }

      setAccountModal(false)
      showToast(setToast, editingAccount ? "Rekening berhasil diperbarui!" : "Rekening baru berhasil ditambahkan!")
    } catch (err) {
      showToast(setToast, String(err))
    } finally {
      setAccSaving(false)
    }
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setAddrSaving(true)
    try {
      const body: Record<string, unknown> = {
        wedding_profile_id: id,
        recipient_name: addrRecipient,
        phone: addrPhone,
        full_address: addrAddress,
        city: addrCity || null,
        postal_code: addrPostal || null,
      }

      let res
      if (editingAddress) {
        res = await fetch(`/api/gift-addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch("/api/gift-addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) throw new Error("Gagal menyimpan alamat")
      const data = await res.json()
      const saved = data.address

      if (editingAddress) {
        setAddresses(prev => prev.map(a => a.id === saved.id ? saved : a))
      } else {
        setAddresses(prev => [...prev, saved])
      }

      setAddressModal(false)
      showToast(setToast, editingAddress ? "Alamat berhasil diperbarui!" : "Alamat baru berhasil ditambahkan!")
    } catch (err) {
      showToast(setToast, String(err))
    } finally {
      setAddrSaving(false)
    }
  }

  async function deleteAccount(acc: Account) {
    try {
      const res = await fetch(`/api/gift-accounts/${acc.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus rekening")
      setAccounts(prev => prev.filter(a => a.id !== acc.id))
      showToast(setToast, "Rekening berhasil dihapus!")
    } catch (err) {
      showToast(setToast, String(err))
    }
  }

  async function deleteAddress(addr: Address) {
    try {
      const res = await fetch(`/api/gift-addresses/${addr.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Gagal menghapus alamat")
      setAddresses(prev => prev.filter(a => a.id !== addr.id))
      showToast(setToast, "Alamat berhasil dihapus!")
    } catch (err) {
      showToast(setToast, String(err))
    }
  }

  async function copyText(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(setToast, `${label} tersalin ke clipboard!`)
    } catch {
      showToast(setToast, "Gagal menyalin")
    }
  }

  async function handleToggleGiftSection() {
    const next = !giftSectionVisible
    setGiftSectionSaving(true)
    try {
      const res = await fetch(`/api/dashboard/${id}/web-invitation`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gift_section_visible: next }),
      })
      if (!res.ok) throw new Error("Gagal menyimpan")
      setGiftSectionVisible(next)
      showToast(setToast, next ? "Bagian Hadiah akan ditampilkan di undangan." : "Bagian Hadiah akan disembunyikan di undangan.")
      // Push the change to WordPress (async worker applies on next patch).
      fetch(`/api/wp/patch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile_id: id }),
      }).catch(() => {})
    } catch (err) {
      showToast(setToast, String(err))
    } finally {
      setGiftSectionSaving(false)
    }
  }

  function accountLogo(acc: Account): string {
    if (acc.provider_logo_url) return acc.provider_logo_url
    const bank = getBankByName(acc.provider_name || "")
    return bank ? bankLogoUrl(bank.slug) : ""
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-edge-margin-mobile">
        <p className="font-body-md text-on-surface-variant">Data tidak ditemukan</p>
      </div>
    )
  }

  const coupleName = `${profile.bride_name} & ${profile.groom_name}`

  return (
    <>
      <PageTheme mode="light" />

      <header className="fixed top-0 inset-x-0 lg:left-[var(--dash-sidebar-w)] z-40 bg-brand-cream/90 backdrop-blur-md border-b border-brand-border h-16 flex items-center px-5 sm:px-8 justify-between">
        <span className="text-xs uppercase tracking-[0.2em] font-semibold text-brand-charcoal">Amplop Digital &amp; E-Gift</span>
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-brand-slate font-medium hidden sm:inline">Perubahan Otomatis Disimpan</span>
          <ProfileMenu />
        </div>
      </header>

      <main className="flex-grow pt-24 pb-12 px-5 sm:px-8 max-w-4xl mx-auto w-full">
        <div className="mb-8 text-left">
          <p className="text-xs uppercase tracking-[0.25em] text-brand-terracotta font-semibold mb-1">Fitur Amplop Digital & Gift</p>
          <p className="text-xs sm:text-sm text-brand-slate mt-2 leading-relaxed max-w-2xl">
            Kelola rekening bank, QRIS, dan alamat pengiriman kado fisik yang akan ditampilkan di halaman web undangan Anda.
          </p>
        </div>

        <div className="flex border-b border-brand-border mb-8 gap-3 sm:gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("digital")}
            className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "digital" ? "border-brand-terracotta text-brand-terracotta" : "border-transparent text-brand-slate hover:text-brand-charcoal"}`}
          >
            <span className="material-symbols-outlined text-lg shrink-0">account_balance</span>
            Rekening & E-Wallet
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "digital" ? "bg-brand-terracotta/10 text-brand-terracotta" : "bg-brand-slate/10 text-brand-slate"}`}>{accounts.length}</span>
          </button>

          {canShowPhysical && (
            <button
              onClick={() => setActiveTab("physical")}
              className={`pb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "physical" ? "border-brand-terracotta text-brand-terracotta" : "border-transparent text-brand-slate hover:text-brand-charcoal"}`}
            >
              <span className="material-symbols-outlined text-lg shrink-0">local_shipping</span>
              Alamat Kado Fisik
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "physical" ? "bg-brand-terracotta/10 text-brand-terracotta" : "bg-brand-slate/10 text-brand-slate"}`}>{addresses.length}</span>
            </button>
          )}
        </div>

        {activeTab === "digital" && (
          <div className="space-y-6">
            <div className="bg-white border border-brand-border rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-brand-charcoal" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>Bagian Hadiah di Undangan</h3>
                <p className="text-xs text-brand-slate mt-1">Tampilkan atau sembunyikan seluruh bagian Hadiah (rekening & alamat) di undangan WordPress.</p>
              </div>
              <label className="inline-flex items-center cursor-pointer shrink-0 gap-2">
                <span className="text-[11px] font-medium text-brand-slate">{giftSectionVisible ? "Tampil" : "Tersembunyi"}</span>
                <input type="checkbox" checked={giftSectionVisible} className="sr-only peer" onChange={handleToggleGiftSection} disabled={giftSectionSaving} />
                <div className="relative w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-terracotta disabled:opacity-50" />
              </label>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-brand-slate font-semibold">Daftar Rekening & E-Wallet</p>
              <button
                onClick={() => { resetAccountForm(); setAccountModal(true) }}
                className="inline-flex items-center gap-2 bg-brand-charcoal text-white px-4 py-2.5 rounded-xl text-xs uppercase tracking-[0.12em] font-semibold hover:bg-brand-terracotta transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Tambah Rekening / E-Wallet
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="text-center py-16 bg-white border border-brand-border rounded-2xl">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-brand-slate/40 mb-3">account_balance</span>
                <p className="text-sm text-brand-slate">Belum ada rekening atau QRIS yang ditambahkan.</p>
              </div>
            ) : (
              accounts.map(acc => (
                <div key={acc.id} className="bg-white border border-brand-border rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-[0_10px_30px_-10px_rgba(26,24,23,0.04)] hover:border-brand-terracotta/25 hover:shadow-[0_14px_36px_-10px_rgba(26,24,23,0.08)] transition-all duration-300" style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-brand-cream border border-brand-border flex items-center justify-center shrink-0 overflow-hidden">
                        {acc.type === "qris" ? (
                          <span className="material-symbols-outlined text-brand-slate text-xl sm:text-2xl">qr_code_2</span>
                        ) : accountLogo(acc) ? (
                          <img src={accountLogo(acc)} alt={acc.provider_name || ""} className="w-full h-full object-contain p-1.5" />
                        ) : (
                          <span className={`font-bold text-xs tracking-tighter ${acc.type === "bank" ? "text-blue-800" : "text-green-800"}`}>
                            {(acc.provider_name || "").slice(0, 3).toUpperCase() || (acc.type === "bank" ? "BNK" : "EWL")}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl sm:text-2xl font-semibold text-brand-charcoal" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{acc.provider_name || (acc.type === "qris" ? "QRIS All Payment" : "Rekening Bank")}</h3>
                        {acc.type !== "qris" && acc.account_number && (
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <span className="font-mono text-base tracking-wider text-brand-charcoal font-semibold break-all">{acc.account_number}</span>
                            <button onClick={() => copyText(acc.account_number!, "Nomor rekening")} className="text-brand-terracotta text-xs font-semibold hover:underline inline-flex items-center gap-1 shrink-0">
                              <span className="material-symbols-outlined text-xs">content_copy</span> Salin
                            </button>
                          </div>
                        )}
                        {acc.type === "qris" && acc.qris_image_url && (
                          <p className="text-xs text-brand-slate">Gambar QRIS terpasang & dapat dipindai tamu.</p>
                        )}
                        <p className="text-xs text-brand-slate uppercase tracking-wider font-medium">{acc.account_name ? `a.n ${acc.account_name}` : ""}</p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-brand-border gap-3">
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <button onClick={() => { resetAccountForm(acc); setAccountModal(true) }} className="text-brand-charcoal hover:text-brand-terracotta transition-colors inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                        <span className="text-brand-slate/40">|</span>
                        <button onClick={() => deleteAccount(acc)} className="text-rose-700 hover:text-rose-900 transition-colors inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">delete</span> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "physical" && canShowPhysical && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-brand-slate font-semibold">Alamat Penerimaan Kado Fisik</p>
              <button
                onClick={() => { resetAddressForm(); setAddressModal(true) }}
                className="inline-flex items-center gap-2 bg-brand-charcoal text-white px-4 py-2.5 rounded-xl text-xs uppercase tracking-[0.12em] font-semibold hover:bg-brand-terracotta transition-all active:scale-95 shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Tambah Alamat Pengiriman
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="text-center py-16 bg-white border border-brand-border rounded-2xl">
                <span className="material-symbols-outlined text-3xl sm:text-4xl text-brand-slate/40 mb-3">local_shipping</span>
                <p className="text-sm text-brand-slate">Belum ada alamat pengiriman kado yang ditambahkan.</p>
              </div>
            ) : (
              addresses.map(addr => (
                <div key={addr.id} className="bg-white border border-brand-border rounded-2xl p-6 sm:p-7 relative overflow-hidden shadow-[0_10px_30px_-10px_rgba(26,24,23,0.04)] hover:border-brand-terracotta/25 hover:shadow-[0_14px_36px_-10px_rgba(26,24,23,0.08)] transition-all duration-300" style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-brand-cream border border-brand-border flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-brand-terracotta text-xl sm:text-2xl">home_pin</span>
                      </div>
                      <div className="space-y-1.5 max-w-md">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-xl sm:text-2xl text-brand-charcoal font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{addr.recipient_name || "Penerima Kado"}</h3>
                        </div>
                        <p className="text-xs sm:text-sm text-brand-charcoal leading-relaxed">{addr.full_address}{addr.city ? `, ${addr.city}` : ""}{addr.postal_code ? `, ${addr.postal_code}` : ""}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-slate pt-1">
                          {addr.phone && <><span>Telepon: <strong>{addr.phone}</strong></span></>}
                        </div>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-4 sm:pt-0 border-brand-border gap-3">
                      <div className="flex items-center gap-3 text-xs font-semibold">
                        <button onClick={() => { resetAddressForm(addr); setAddressModal(true) }} className="text-brand-charcoal hover:text-brand-terracotta transition-colors inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">edit</span> Edit
                        </button>
                        <span className="text-brand-slate/40">|</span>
                        <button onClick={() => deleteAddress(addr)} className="text-rose-700 hover:text-rose-900 transition-colors inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">delete</span> Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>



      {accountModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAccountModal(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-terracotta">Amplop Digital</span>
                  <h3 className="text-2xl text-brand-charcoal font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{editingAccount ? "Edit Rekening" : "Tambah Rekening Baru"}</h3>
                </div>
                <button onClick={() => setAccountModal(false)} className="w-8 h-8 rounded-full hover:bg-brand-cream flex items-center justify-center text-brand-slate">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleAccountSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Bank / E-Wallet</label>
                  <BankSelect
                    value={getBankByName(accProvider)?.slug || ""}
                    name={accProvider}
                    onChange={(slug, displayName) => setAccProvider(slug || displayName)}
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Nomor Rekening / HP E-Wallet</label>
                  <input
                    type="text"
                    value={accNumber}
                    onChange={e => setAccNumber(e.target.value)}
                    placeholder="Contoh: 8830123456"
                    className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm font-mono text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-terracotta"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Nama Pemilik Rekening (a.n)</label>
                  <input
                    type="text"
                    value={accOwner}
                    onChange={e => setAccOwner(e.target.value)}
                    placeholder="Sesuai tertera di buku tabungan"
                    className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-terracotta"
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={accSaving || !accProvider.trim()}
                    className="w-full py-4 bg-brand-charcoal text-white rounded-xl font-semibold text-xs uppercase tracking-[0.18em] hover:bg-brand-terracotta transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {accSaving ? "MENYIMPAN..." : (editingAccount ? "Simpan Perubahan" : "Simpan Rekening Baru")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {addressModal && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setAddressModal(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white p-6 sm:p-8 overflow-y-auto shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-brand-border pb-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-brand-terracotta">Kado Fisik</span>
                  <h3 className="text-2xl text-brand-charcoal font-semibold" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>{editingAddress ? "Edit Alamat Pengiriman" : "Tambah Alamat Pengiriman"}</h3>
                </div>
                <button onClick={() => setAddressModal(false)} className="w-8 h-8 rounded-full hover:bg-brand-cream flex items-center justify-center text-brand-slate">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <form onSubmit={handleAddressSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Nama Penerima Paket</label>
                  <input
                    type="text"
                    value={addrRecipient}
                    onChange={e => setAddrRecipient(e.target.value)}
                    placeholder="Contoh: Dimas Anggara"
                    className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-terracotta"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Nomor Telepon / WhatsApp</label>
                  <input
                    type="tel"
                    value={addrPhone}
                    onChange={e => setAddrPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm font-mono text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-terracotta"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Alamat Lengkap</label>
                  <textarea
                    rows={3}
                    value={addrAddress}
                    onChange={e => setAddrAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, RT/RW"
                    className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm text-brand-charcoal placeholder:text-brand-slate/40 resize-none focus:outline-none focus:border-brand-terracotta"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Kota</label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={e => setAddrCity(e.target.value)}
                      placeholder="Jakarta Selatan"
                      className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-terracotta"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-brand-slate font-semibold mb-1">Kode Pos</label>
                    <input
                      type="text"
                      value={addrPostal}
                      onChange={e => setAddrPostal(e.target.value)}
                      placeholder="12110"
                      className="w-full bg-transparent border-b border-brand-border py-2.5 text-sm text-brand-charcoal placeholder:text-brand-slate/40 focus:outline-none focus:border-brand-terracotta"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={addrSaving}
                    className="w-full py-4 bg-brand-charcoal text-white rounded-xl font-semibold text-xs uppercase tracking-[0.18em] hover:bg-brand-terracotta transition-all active:scale-[0.98] shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-base">save</span>
                    {addrSaving ? "MENYIMPAN..." : (editingAddress ? "Simpan Perubahan" : "Simpan Alamat Kado")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div
        className={`fixed top-20 right-4 sm:right-8 z-50 bg-brand-charcoal text-white px-5 py-3 rounded-xl shadow-xl text-xs flex items-center gap-3 transition-all duration-300 ${toast.show ? "translate-y-0 opacity-100" : "translate-y-[-100px] opacity-0"}`}
      >
        <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
        <span className="font-medium">{toast.message}</span>
      </div>
    </>
  )
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return <AmplopDigitalInner id={id} />
}
