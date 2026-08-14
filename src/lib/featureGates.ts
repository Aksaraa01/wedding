import { supabaseAdmin } from "@/lib/supabase"
import { cachedRead } from "@/lib/refCache"

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
const PACKAGES = ["essential", "signature", "prestige"] as const

function rowIncluded(value: string | null, emphasis: string | null): boolean {
  return (value ?? "—") !== "—" && (emphasis ?? "") !== "muted"
}

export async function getRowGates(packageType: string): Promise<RowGates> {
  // Static reference data — identical across all couples, cached per package.
  return cachedRead(`row-gates:${packageType}`, 10 * 60_000, async () => {
    const { data, error } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("code, essential_value, essential_emphasis, signature_value, signature_emphasis, prestige_value, prestige_emphasis")
      .in("code", GATE_CODES as unknown as string[])

    const fallback: RowGates = {
      gift_address: { included: true, availableIn: [...PACKAGES] },
      inviting_families: { included: true, availableIn: [...PACKAGES] },
      story: { included: true, availableIn: [...PACKAGES] },
      cinematic_video: { included: true, availableIn: [...PACKAGES] },
    }

    if (error) return fallback

    const col = (row: Record<string, string | null>, pkg: string, suffix: string) =>
      row[`${pkg}_${suffix}`] ?? row[`signature_${suffix}`]

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
