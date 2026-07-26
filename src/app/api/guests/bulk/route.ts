import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/packages"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wedding_profile_id, rows } = body

    if (!wedding_profile_id || !rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Parameter tidak lengkap" }, { status: 400 })
    }

    const guests = rows.map((r: Record<string, string>) => ({
      wedding_profile_id: wedding_profile_id,
      name: (r.name || "").trim(),
      phone_number: normalizePhone((r.phone_number || r.whatsapp || "").toString()),
      category: (r.category || r.relation || "").toString().trim(),
      table_number: (r.table_number || "").toString().trim(),
    })).filter((r: { name: string }) => r.name)

    if (guests.length === 0) {
      return NextResponse.json({ error: "Tidak ada data tamu untuk diimpor" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from("guests").insert(guests).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ guests: data, count: data.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
