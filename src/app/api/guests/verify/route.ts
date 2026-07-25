import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { wedding_profile_id, rows } = body

    if (!wedding_profile_id || !rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Missing wedding_profile_id or rows" }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from("guests")
      .select("name, whatsapp")
      .eq("wedding_profile_id", wedding_profile_id)

    const existingSet = new Set<string>()
    if (existing) {
      for (const g of existing) {
        if (g.name) existingSet.add(g.name.toLowerCase())
        if (g.whatsapp) existingSet.add(g.whatsapp.replace(/\D/g, ""))
      }
    }

    const result = rows.map((r: Record<string, string>) => {
      const name = (r.name || "").trim()
      const rawWa = (r.whatsapp || "").toString().trim()
      const digits = rawWa.replace(/\D/g, "")
      const normalizedWa = digits ? (digits.startsWith("62") ? `+${digits}` : `+62${digits}`) : ""
      const duplicate =
        (name && existingSet.has(name.toLowerCase())) ||
        (digits && existingSet.has(digits))

      return {
        name,
        whatsapp: normalizedWa,
        relation: (r.relation || "").toString().trim(),
        table_number: (r.table_number || "").toString().trim(),
        duplicate,
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
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
