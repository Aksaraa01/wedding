"use client"

import { useEffect, useMemo, useState } from "react"
import {
  GALERI_GUEST_MAX,
  GALERI_GUEST_MIN,
  GALERI_PHOTO_MAX,
  GALERI_PHOTO_MIN,
  matchGaleriTier,
  type GaleriTierRow,
} from "@/lib/packages"

export type GaleriSelection = {
  photos: number
  guests: number
  tier: string
  price: number
}

type Props = {
  initialPhotos?: number
  initialGuests?: number
  onChange: (sel: GaleriSelection) => void
}

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', serif" }
const SANS: React.CSSProperties = { fontFamily: "'Plus Jakarta Sans', sans-serif" }

function formatRp(n: number): string {
  return "Rp " + n.toLocaleString("id-ID").replace(/,/g, ".")
}

// Shared Galeri Tamu slider configurator (mock: Paket Galeri Tamu
// Interaktif). Used by the standalone GT tab and the Undangan add-on.
// Tier + price always derive from the same matrix as the server.
export default function GaleriConfigurator({ initialPhotos = 5, initialGuests = 100, onChange }: Props) {
  // Slider ranges derive from the DB matrix once loaded (union of bounds);
  // the GALERI_* constants are only the pre-load fallback.
  const [tierRows, setTierRows] = useState<GaleriTierRow[] | null>(null)
  const [tiersError, setTiersError] = useState(false)
  const bounds = useMemo(() => {
    if (!tierRows || tierRows.length === 0) return null
    return {
      photoMin: Math.max(1, Math.min(...tierRows.map((r) => r.photoMin))),
      photoMax: Math.max(1, Math.max(...tierRows.map((r) => r.photoMax))),
      guestMin: Math.max(1, Math.min(...tierRows.map((r) => r.guestMin))),
      guestMax: Math.max(1, Math.max(...tierRows.map((r) => r.guestMax))),
    }
  }, [tierRows])
  const pMin = bounds?.photoMin ?? GALERI_PHOTO_MIN
  const pMax = bounds?.photoMax ?? GALERI_PHOTO_MAX
  const gMin = bounds?.guestMin ?? GALERI_GUEST_MIN
  const gMax = bounds?.guestMax ?? GALERI_GUEST_MAX
  const clampPhotos = (n: number) => Math.min(pMax, Math.max(pMin, Math.floor(n) || pMin))
  const clampGuests = (n: number) => Math.min(gMax, Math.max(gMin, Math.floor(n) || gMin))

  const [photos, setPhotos] = useState(() => clampPhotos(initialPhotos))
  const [guests, setGuests] = useState(() => clampGuests(initialGuests))
  // Re-clamp into the DB range once the matrix arrives (stored configs from
  // older matrices stay valid).
  useEffect(() => {
    if (!bounds) return
    setPhotos((p) => Math.min(bounds.photoMax, Math.max(bounds.photoMin, Math.floor(p) || bounds.photoMin)))
    setGuests((g) => Math.min(bounds.guestMax, Math.max(bounds.guestMin, Math.floor(g) || bounds.guestMin)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds])

  useEffect(() => {
    fetch("/api/galeri-tiers")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("tiers unreadable"))))
      .then((d) => {
        const t = d?.tiers
        if (t && typeof t === "object") {
          const rows: GaleriTierRow[] = Object.entries(t).map(([tier, v]) => {
            const r = v as { price?: unknown; photoMin?: unknown; photoMax?: unknown; guestMin?: unknown; guestMax?: unknown }
            return {
              tier,
              photoMin: Math.floor(Number(r.photoMin)),
              photoMax: Math.floor(Number(r.photoMax)),
              guestMin: Math.floor(Number(r.guestMin)),
              guestMax: Math.floor(Number(r.guestMax)),
              price: Math.floor(Number(r.price) || 0),
            }
          })
          if (rows.length > 0 && rows.every((r) => r.tier && Number.isFinite(r.price))) {
            setTierRows(rows)
            return
          }
        }
        setTiersError(true)
      })
      .catch(() => setTiersError(true))
  }, [])

  // Tier resolves by matching the sliders against the DB bounds — renames,
  // new rows, and reshaped bands need no code changes. Unmatched = no price.
  const matched = useMemo(
    () => (tierRows ? matchGaleriTier(tierRows, photos, guests) : null),
    [tierRows, photos, guests]
  )
  const price = matched ? matched.price : 0

  useEffect(() => {
    if (!tierRows || !matched || matched.price <= 0) return
    onChange({ photos, guests, tier: matched.tier, price: matched.price })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos, guests, matched, tierRows])

  return (
    <div className="bg-white rounded-[2rem] border border-outline-variant/30 shadow-xl p-5 md:p-8" style={SANS}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
        <div>
          <h3 className="text-[26px] md:text-[32px] font-semibold mt-1" style={{ ...SERIF, color: "#4f1519" }}>
            Paket Galeri Tamu
          </h3>
          <p className="text-[13px] md:text-sm text-[#444841] mt-1 max-w-xl">
            Sesuaikan kuota foto dan tamu undangan untuk menghitung estimasi paket serta cetak QR otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
        <div className="flex flex-col gap-5">
          <div className="rounded-[1.5rem] bg-[#f5f3ee] border border-outline-variant/20 p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1b1c19] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">photo_library</span>
                Jumlah Foto per Tamu
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[20px] font-semibold" style={{ ...SERIF, color: "#4f1519" }}>{photos} Foto</span>
                <span className="text-[10px] uppercase tracking-wider bg-white border border-outline-variant/40 rounded-full px-2.5 py-0.5 text-[#444841]">
                  {matched ? `${matched.photoMin}–${matched.photoMax} Foto` : "…"}
                </span>
              </p>
            </div>
            <input
              type="range"
              min={pMin}
              max={pMax}
              step={1}
              value={photos}
              onChange={(e) => setPhotos(clampPhotos(Number(e.target.value)))}
              className="w-full mt-4 accent-[#4f1519]"
              aria-label="Jumlah foto per tamu"
            />
            <div className="flex justify-between text-[11px] text-[#444841] mt-1">
              <span>Min: {pMin} Foto</span>
              <span>Maks: {pMax} Foto</span>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-[#f5f3ee] border border-outline-variant/20 p-5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1b1c19] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">group</span>
                Jumlah Tamu Undangan
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[20px] font-semibold" style={{ ...SERIF, color: "#4f1519" }}>{guests} Tamu</span>
                <span className="text-[10px] uppercase tracking-wider bg-[#d7e7d1] border border-[#bbcbb6] rounded-full px-2.5 py-0.5 text-[#3c4b3a]">
                  {matched ? `${matched.guestMin}–${matched.guestMax} Tamu` : "…"}
                </span>
              </p>
            </div>
            <input
              type="range"
              min={gMin}
              max={gMax}
              step={1}
              value={guests}
              onChange={(e) => setGuests(clampGuests(Number(e.target.value)))}
              className="w-full mt-4 accent-[#4f1519]"
              aria-label="Jumlah tamu undangan"
            />
            <div className="flex justify-between text-[11px] text-[#444841] mt-1">
              <span>{gMin} Tamu</span>
              <span>{gMax} Tamu</span>
            </div>
          </div>

          {tiersError && (
            <div className="rounded-full bg-red-50 border border-red-200 px-4 py-2.5 text-[12px] text-red-600">
              Gagal memuat matriks tarif — periksa koneksi lalu geser ulang slider.
            </div>
          )}
        </div>

        <div className="rounded-[1.5rem] bg-[#f5f3ee] border border-outline-variant/20 p-5 flex flex-col">
          <p className="text-[12px] uppercase tracking-[0.15em] font-semibold text-[#1b1c19] flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Fasilitas &amp; Fitur Termasuk
          </p>
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-[1.25rem] p-4 flex items-start gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#f5f3ee] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]" style={{ color: "#6b2b2d" }}>qr_code_2</span>
              </div>
              <div>
                <p className="font-semibold text-[15px] text-[#1b1c19]">QR Code Dinamis</p>
                <p className="text-[12px] text-[#444841] leading-relaxed mt-0.5">
                  Kartu / Label QR Tamu siap cetak &amp; dipersonalisasi sesuai kuota.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[1.25rem] p-4 flex items-start gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#d7e7d1] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-[#3c4b3a]">cloud_done</span>
              </div>
              <div>
                <p className="font-semibold text-[15px] text-[#1b1c19]">Masa Aktif Foto 7 Hari</p>
                <p className="text-[12px] text-[#444841] leading-relaxed mt-0.5">
                  Akses galeri &amp; penyimpanan cloud terenkripsi tetap aktif selama 7 hari penuh pasca acara.
                </p>
              </div>
            </div>
            <div className="bg-white rounded-[1.25rem] p-4 flex items-start gap-3 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#ffddba] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-[#5f401a]">menu_book</span>
              </div>
              <div>
                <p className="font-semibold text-[15px] text-[#1b1c19]">Unduh Buku Tamu (Guestbook PDF)</p>
                <p className="text-[12px] text-[#444841] leading-relaxed mt-0.5">
                  Kompilasi pesan ucapan dan foto dalam album resolusi tinggi siap cetak.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-outline-variant/20">
            <div className="min-h-16 rounded-full text-white flex flex-col items-center justify-center gap-0.5 shadow-md py-2 px-4" style={{ backgroundColor: "#4f1519" }}>
              <span className="text-[28px] md:text-[32px] font-semibold tracking-tight leading-none" style={SERIF}>
                {tierRows ? (matched && matched.price > 0 ? formatRp(matched.price) : "—") : "•••"}
              </span>
              <span className="text-[11px] font-normal text-white/80">
                {!tierRows ? "Memuat harga..." : matched && matched.price > 0 ? matched.tier : "Kombinasi belum tersedia"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
