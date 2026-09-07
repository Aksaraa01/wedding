import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone, parseVip } from "@/lib/packages"
import { autoGenerateGuestLinks } from "@/lib/guest-link"
import { sanitizeGuestName } from "@/lib/nameClean"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wedding_profile_id, rows } = body

    if (!wedding_profile_id || !rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const guests = rows.map((r: Record<string, string>) => ({
      wedding_profile_id: wedding_profile_id,
      name: sanitizeGuestName(r.name).trim(),
      phone_number: normalizePhone((r.phone_number || r.whatsapp || "").toString()),
      category: (r.category || r.relation || "").toString().trim(),
      table_number: (r.table_number || "").toString().trim(),
      is_vip: parseVip(r.vip),
    })).filter((r: { name: string }) => r.name)

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
