import { supabaseAdmin } from "@/lib/supabase"

export type RowGates = {
  gift_address: boolean
  inviting_families: boolean
  story: boolean
}

function rowIncluded(value: string | null, emphasis: string | null): boolean {
  return (value ?? "—") !== "—" && (emphasis ?? "") !== "muted"
}

export async function getRowGates(packageType: string): Promise<RowGates> {
  const { data, error } = await supabaseAdmin
    .from("package_matrix_rows")
    .select("code, essential_value, essential_emphasis, signature_value, signature_emphasis, prestige_value, prestige_emphasis")
    .in("code", ["gift_address", "inviting_families", "story"])

  if (error) {
    return { gift_address: true, inviting_families: true, story: true }
  }

  const col = (row: { [k: string]: string | null }, suffix: string) =>
    row[`${packageType}_${suffix}`] ?? row[`signature_${suffix}`]

  const gates: RowGates = { gift_address: true, inviting_families: true, story: true }
  for (const row of data || []) {
    const value = col(row as any, "value")
    const emphasis = col(row as any, "emphasis")
    const included = rowIncluded(value, emphasis)
    if (row.code === "gift_address") gates.gift_address = included
    else if (row.code === "inviting_families") gates.inviting_families = included
    else if (row.code === "story") gates.story = included
  }
  return gates
}

export async function getFeatureIncluded(packageType: string): Promise<Set<string>> {
  const { data, error } = await supabaseAdmin
    .from("package_features")
    .select("feature_code")
    .eq("package_code", packageType)
    .eq("is_included", true)

  if (error) return new Set()
  return new Set((data || []).map((d) => d.feature_code))
}