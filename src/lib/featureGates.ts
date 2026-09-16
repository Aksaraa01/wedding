import { supabaseAdmin } from "@/lib/supabase"
import { cachedRead } from "@/lib/refCache"
import { matrixColumnForPackage } from "@/lib/packages"

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
] as const

function rowIncluded(value: string | null, emphasis: string | null): boolean {
  return (value ?? "—") !== "—" && (emphasis ?? "") !== "muted"
}

export async function getRowGates(packageType: string): Promise<RowGates> {
  // Static reference data — identical across all couples, cached per package.
  return cachedRead(`row-gates:${packageType}`, 10 * 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("*")
      .in("code", GATE_CODES as unknown as string[])

    const fallback: RowGates = {
      gift_address: { included: true, availableIn: [...PACKAGES] },
      inviting_families: { included: true, availableIn: [...PACKAGES] },
      story: { included: true, availableIn: [...PACKAGES] },
      cinematic_video: { included: true, availableIn: [...PACKAGES] },
    }

    if (error) return fallback

    const col = (row: Record<string, string | null>, pkg: string, suffix: string) => {
      const v = row[`${pkg}_${suffix}`]
      if (v !== undefined && v !== null) return v
      if (pkg === "bonus_full_custom" || pkg === "elite") return row[`prestige_${suffix}`] ?? row[`signature_${suffix}`]
      return row[`signature_${suffix}`]
    }

    const gates: RowGates = { ...fallback }
    for (const row of (data || []) as Record<string, string | null>[]) {
      const code = row.code
      if (!code || !GATE_CODES.includes(code as typeof GATE_CODES[number])) continue

      const availableIn: string[] = []
      for (const pkg of PACKAGES) {
        const value = col(row, pkg, "value")
        const emphasis = col(row, pkg, "emphasis")
        if (rowIncluded(value, emphasis)) availableIn.push(pkg)
      }
      const included = availableIn.includes(packageType)

      gates[code as keyof RowGates] = { included, availableIn }
    }

    return gates
  })
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
