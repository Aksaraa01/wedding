import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import * as XLSX from "xlsx"
import { autoGenerateGuestLinks } from "@/lib/guest-link"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const weddingProfileId = formData.get("wedding_profile_id") as string | null

    if (!file || !weddingProfileId) {
      return NextResponse.json({ error: "File atau parameter tidak lengkap" }, { status: 400 })
    }

    const buf = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buf, { type: "buffer" })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { header: ["name", "phone_number", "category", "table_number"] })

    const guests = rows
      .slice(1)
      .filter((r) => r.name?.trim())
      .map((r) => ({
        wedding_profile_id: weddingProfileId,
        name: r.name.trim(),
        phone_number: (r.phone_number || "").toString().trim(),
        category: (r.category || "").toString().trim(),
        table_number: (r.table_number || "").toString().trim(),
      }))

    if (guests.length === 0) {
      return NextResponse.json({ error: "Tidak ada data tamu dalam file" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin.from("guests").insert(guests).select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const linksGenerated = await autoGenerateGuestLinks(weddingProfileId, data)

    return NextResponse.json({ guests: data, count: data.length, links_generated: linksGenerated })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
