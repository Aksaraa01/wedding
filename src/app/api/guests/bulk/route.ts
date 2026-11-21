import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone, parseVip } from "@/lib/packages"
import { autoGenerateGuestLinks } from "@/lib/guest-link"
import { sanitizeGuestName } from "@/lib/nameClean"
import { parseInvitedSessionsCell } from "@/lib/invitedSessions"

function pickAcaraCell(r: Record<string, unknown>): unknown {
  for (const key of ["acara", "Acara", "ACARA", "sesi", "Sesi", "SESI", "acara_sesi", "Acara (Sesi)"]) {
    if (key in r && r[key] != null && String(r[key]).trim() !== "") return r[key]
  }
  for (const [k, v] of Object.entries(r)) {
    if (/acara|sesi/i.test(k) && v != null && String(v).trim() !== "") return v
  }
  return r.acara ?? r.sesi ?? ""
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wedding_profile_id, rows } = body

    if (!wedding_profile_id || !rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("sessions")
      .eq("id", wedding_profile_id)
      .maybeSingle()
    const sessions = Array.isArray(profile?.sessions) ? profile.sessions : []

    const guests = rows.map((r: Record<string, unknown>) => {
      let invited_session_indexes: number[] | null = null
      if (Array.isArray(r.invited_session_indexes)) {
        const idxs = (r.invited_session_indexes as unknown[])
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 0 && n < (sessions.length || 999))
        const uniq = Array.from(new Set(idxs)).sort((a, b) => a - b)
        invited_session_indexes = uniq.length > 0 && uniq.length < sessions.length ? uniq : null
      } else {
        const cell = pickAcaraCell(r)
        invited_session_indexes = parseInvitedSessionsCell(cell, sessions).indexes
      }

      return {
        wedding_profile_id: wedding_profile_id,
        name: sanitizeGuestName(String(r.name ?? "")).replace(/\s+/g, " ").trim(),
        phone_number: normalizePhone(String(r.phone_number || r.whatsapp || "")),
        category: String(r.category || r.relation || "").trim(),
        table_number: String(r.table_number || "").trim(),
        is_vip: parseVip(r.vip as any),
        invited_session_indexes,
      }
    }).filter((r: { name: string }) => r.name)

    if (guests.length === 0) {
      return NextResponse.json({ error: "Tidak ada data tamu untuk diimpor" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from("guests").insert(guests).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const linksGenerated = await autoGenerateGuestLinks(wedding_profile_id, data)

    return NextResponse.json({ guests: data, count: data.length, links_generated: linksGenerated })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
