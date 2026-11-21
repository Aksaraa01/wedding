import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { parseVip } from "@/lib/packages"
import { sanitizeGuestName } from "@/lib/nameClean"
import { formatInvitedSessionsCell, parseInvitedSessionsCell } from "@/lib/invitedSessions"
import { templateSupportsInvitedSessions } from "@/lib/invitedSessionsServer"

function pickAcaraCell(r: Record<string, unknown>): unknown {
  for (const key of ["acara", "Acara", "ACARA", "sesi", "Sesi", "SESI", "acara_sesi", "Acara (Sesi)"]) {
    if (key in r && r[key] != null && String(r[key]).trim() !== "") return r[key]
  }
  // Try any key that contains "acara" or "sesi"
  for (const [k, v] of Object.entries(r)) {
    if (/acara|sesi/i.test(k) && v != null && String(v).trim() !== "") return v
  }
  // Fallback: if a parsed invited_session_indexes was provided, prefer it
  if (Array.isArray(r.invited_session_indexes)) return null
  return r.acara ?? r.sesi ?? ""
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wedding_profile_id, rows } = body

    if (!wedding_profile_id || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const [{ data: existing }, { data: profile }, acaraSupported] = await Promise.all([
      supabaseAdmin
        .from("guests")
        .select("name, phone_number")
        .eq("wedding_profile_id", wedding_profile_id),
      supabaseAdmin
        .from("wedding_profiles")
        .select("sessions")
        .eq("id", wedding_profile_id)
        .maybeSingle(),
      templateSupportsInvitedSessions(wedding_profile_id),
    ])

    const sessions = Array.isArray(profile?.sessions) ? profile.sessions : []

    const existingSet = new Set<string>()
    if (existing) {
      for (const g of existing) {
        if (g.name) existingSet.add(g.name.toLowerCase())
        if (g.phone_number) existingSet.add(g.phone_number.replace(/\D/g, ""))
      }
    }

    const result = rows.map((r: Record<string, unknown>) => {
      const name = sanitizeGuestName(String(r.name ?? "")).trim()
      const rawWa = sanitizeGuestName(String(r.phone_number || r.whatsapp || "")).trim()
      const digits = rawWa.replace(/\D/g, "").replace(/^0+/, "")
      const normalizedWa = digits ? (digits.startsWith("62") ? `+${digits}` : `+62${digits}`) : ""
      const duplicate =
        (name && existingSet.has(name.toLowerCase())) ||
        (digits && existingSet.has(digits))

      let invited_session_indexes: number[] | null = null
      let acaraLabel = "Semua"
      if (acaraSupported) {
        if (Array.isArray(r.invited_session_indexes)) {
          const idxs = (r.invited_session_indexes as unknown[])
            .map((n) => Number(n))
            .filter((n) => Number.isInteger(n) && n >= 0 && n < (sessions.length || 999))
          const uniq = Array.from(new Set(idxs)).sort((a, b) => a - b)
          invited_session_indexes = uniq.length > 0 && uniq.length < sessions.length ? uniq : null
          acaraLabel = formatInvitedSessionsCell(invited_session_indexes, sessions.length)
        } else {
          const cell = pickAcaraCell(r)
          const parsed = parseInvitedSessionsCell(cell, sessions)
          invited_session_indexes = parsed.indexes
          // If nothing valid was resolved from a non-empty cell, fall back to all (safe).
          acaraLabel = formatInvitedSessionsCell(invited_session_indexes, sessions.length)
        }
      }

      return {
        name,
        phone_number: normalizedWa,
        category: String(r.category || r.relation || "").trim(),
        table_number: String(r.table_number || "").trim(),
        is_vip: parseVip(r.vip as any),
        duplicate,
        invited_session_indexes,
        acara_label: acaraLabel,
      }
    })

    const valid = result.filter((r) => !r.duplicate)
    const duplicates = result.filter((r) => r.duplicate)

    return NextResponse.json({
      rows: result,
      summary: {
        total: result.length,
        valid: valid.length,
        duplicate: duplicates.length,
      },
      sessions: sessions.map((s: any, i: number) => ({ index: i, name: (s?.name || "").toString().trim() || `Acara ${i + 1}` })),
      acara_supported: acaraSupported,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
