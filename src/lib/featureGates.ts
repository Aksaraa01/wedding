import { supabaseAdmin } from "@/lib/supabase"
import { cachedRead } from "@/lib/refCache"
import { matrixColumnForPackage, deriveSelections, type Selections } from "@/lib/packages"

export type GateInfo = {
  included: boolean
  availableIn: string[]
}

export type RowGates = {
  gift_address: GateInfo
  inviting_families: GateInfo
  story: GateInfo
  cinematic_video: GateInfo
}

const GATE_CODES = ["gift_address", "inviting_families", "story", "cinematic_video"] as const
const PACKAGES = [
  "essential",
  "signature",
  "prestige",
  "elite",
  "cetak_undangan_bonus",
  "bonus_full_custom",
  "dgb_sistem",
  "dgb_pro",
  "dgb_premium",
  "dgb_prestige",
  "ceriavite",
] as const

function rowIncluded(value: string | null, emphasis: string | null): boolean {
  return (value ?? "—") !== "—" && (emphasis ?? "") !== "muted"
}

export async function getRowGates(packageType: string): Promise<RowGates> {
  // Gates live in package_features (see 20261116000004): one row per package and
  // gate, so a new package is data, not a new column in package_matrix_rows.
  // ``availableIn`` drives the upsell copy, so it is derived from the same read.
  return cachedRead(`row-gates:${packageType}`, 10 * 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from("package_features")
      .select("package_code, feature_code")
      .in("feature_code", GATE_CODES as unknown as string[])
      .eq("is_included", true)

    if (error || !data || data.length === 0) return fallbackGates(packageType)

    const byFeature: Record<string, string[]> = {}
    for (const row of data as { package_code: string; feature_code: string }[]) {
      ;(byFeature[row.feature_code] ||= []).push(row.package_code)
    }

    const gate = (code: (typeof GATE_CODES)[number]) => {
      const availableIn = byFeature[code] || []
      return { included: availableIn.includes(packageType), availableIn }
    }

    return {
      gift_address: gate("gift_address"),
      inviting_families: gate("inviting_families"),
      story: gate("story"),
      cinematic_video: gate("cinematic_video"),
    }
  })
}

/** Only used when package_features has no gate rows at all (fresh database). */
function fallbackGates(_packageType: string): RowGates {
  const all = [...PACKAGES]
  return {
    gift_address: { included: true, availableIn: all },
    inviting_families: { included: true, availableIn: all },
    story: { included: true, availableIn: all },
    cinematic_video: { included: true, availableIn: all },
  }
}

export async function getFeatureIncluded(packageType: string): Promise<Set<string>> {
  // Static reference data — identical across all couples, cached per package.
  return cachedRead(`feature-included:${packageType}`, 10 * 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from("package_features")
      .select("feature_code")
      .eq("package_code", packageType)
      .eq("is_included", true)

    if (error) return new Set<string>()
    return new Set((data || []).map((d) => d.feature_code))
  })
}

// Feature selections are driven by the `package_features` table (the editable
// source of truth). Falls back to the static matrix only when the table read
// fails/returns nothing, so the app never renders an empty feature set.
// galeriAddon covers both the standalone GT tab and the GT add-on on
// Undangan Digital: either way galeri_foto_tamu is included.
export async function getSelections(packageType: string, undanganFisik: boolean, galeriAddon = false): Promise<Selections> {
  const set = await getFeatureIncluded(packageType)
  if (set.size === 0) {
    const fallback = deriveSelections(packageType, undanganFisik)
    if (galeriAddon) fallback.galeri_foto_tamu = true
    return fallback
  }
  return {
    premium_web: set.has("premium_web"),
    wish_wall: set.has("wish_wall"),
    reservation_automation: set.has("reservation_automation"),
    kolom_direct_transfer: set.has("kolom_direct_transfer"),
    galeri_foto_tamu: set.has("galeri_foto_tamu") || galeriAddon,
    qr_code_book: set.has("qr_code_book"),
    unique_link_generator: set.has("unique_link_generator"),
    wa_blast: set.has("wa_blast"),
    undangan_fisik: undanganFisik,
  }
}

// Photo quota ("Kuota Foto" matrix row): number of photos, or null = Unlimited.
// The editor uses this to cap gallery photos = quota − groom − bride (cover excluded).
export async function getPhotoQuota(packageType: string): Promise<number | null> {
  return cachedRead(`photo-quota:${packageType}`, 10 * 60_000, async () => {
    const { data } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("*")
      .eq("label", "Kuota Foto")
      .maybeSingle()

    if (!data) return null
    const value = (data as Record<string, unknown>)[matrixColumnForPackage(packageType, "value")]
    if (value === null || value === undefined) return null
    const m = String(value).match(/(\d+)/)
    return m ? parseInt(m[1], 10) : null
  })
}

// Photo-by-guest quota ("Photo by Guest" matrix row): how many photos a single
// guest may upload via /welcome. 0 = feature not included in the package.
export async function getGuestPhotoQuota(packageType: string): Promise<number> {
  return cachedRead(`guest-photo-quota:${packageType}`, 10 * 60_000, async () => {
    const { data } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("*")
      .eq("label", "Photo by Guest")
      .maybeSingle()

    if (!data) return 0
    const value = (data as Record<string, unknown>)[matrixColumnForPackage(packageType, "value")]
    if (value === null || value === undefined) return 0
    const m = String(value).match(/(\d+)/)
    return m ? parseInt(m[1], 10) : 0
  })
}
