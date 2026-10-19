import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { resolveCoupleName } from "@/lib/coupleName"
import { PACKAGE_LABELS } from "@/lib/packages"

// Activity log for the Clearance console: every action that has been reminded
// or executed (not fresh "pending" rows). Independent of the board's
// eligibility filters so cleared/finished couples still appear. Searchable by
// couple name or WhatsApp number via ?q=.

// Strip characters that break PostgREST `or`/`ilike` filter syntax.
function sanitizeForFilter(q: string): string {
  return q.replace(/[,()*%]/g, " ").trim()
}

export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    const { searchParams } = new URL(req.url)
    const raw = (searchParams.get("q") || "").trim()

    let profileIds: string[] | null = null
    if (raw) {
      const name = sanitizeForFilter(raw)
      const digits = raw.replace(/\D/g, "")
      const parts: string[] = []
      if (name) {
        for (const col of ["bride_name", "groom_name", "bride_full_name", "groom_full_name"]) {
          parts.push(`${col}.ilike.*${name}*`)
        }
      }
      if (digits) {
        // Match stored numbers regardless of formatting: try the raw digits and
        // a 0-prefixed local form normalized to the 62 country code.
        const candidates = new Set<string>([digits])
        if (digits.startsWith("0")) candidates.add("62" + digits.slice(1))
        for (const d of candidates) parts.push(`whatsapp_number.ilike.*${d}*`)
      }
      if (parts.length === 0) return NextResponse.json({ log: [] })

      const { data: profs } = await supabaseAdmin
        .from("wedding_profiles")
        .select("id")
        .or(parts.join(","))
      profileIds = (profs || []).map((p: { id: string }) => p.id)
      if (profileIds.length === 0) return NextResponse.json({ log: [] })
    }

    let query = supabaseAdmin
      .from("clearance_actions")
      .select(
        "id, kind, status, due_at, steps, last_error, reminded_at, executed_at, updated_at, wedding_profiles(bride_name, groom_name, bride_full_name, groom_full_name, slug, package_type, whatsapp_number), employees!clearance_actions_executed_by_fkey(name)"
      )
      .neq("status", "pending")
      .order("updated_at", { ascending: false })
      .limit(200)
    if (profileIds) query = query.in("wedding_profile_id", profileIds)

    const { data: logRows, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const log = (logRows || []).map((a: any) => {
      const wp = Array.isArray(a.wedding_profiles) ? a.wedding_profiles[0] : a.wedding_profiles
      const emp = Array.isArray(a.employees) ? a.employees[0] : a.employees
      const steps = (a.steps || {}) as {
        plan?: { wp_post_id?: number | null; asset_paths?: string[]; photo_paths?: string[] }
      }
      return {
        id: a.id,
        kind: a.kind,
        status: a.status,
        due_at: a.due_at,
        couple: resolveCoupleName(wp || {}),
        slug: wp?.slug || null,
        whatsapp_number: wp?.whatsapp_number || null,
        package_label: PACKAGE_LABELS[wp?.package_type || ""] || wp?.package_type || "-",
        actor: emp?.name || null,
        reminded_at: a.reminded_at,
        executed_at: a.executed_at,
        updated_at: a.updated_at,
        last_error: a.last_error,
        photo_count: steps.plan?.photo_paths?.length || 0,
        asset_count: steps.plan?.asset_paths?.length || 0,
        wp_post_id: steps.plan?.wp_post_id ?? null,
      }
    })

    return NextResponse.json({ log })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
