import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabaseAdmin } from "@/lib/supabase"

function sessionLabel(s: any, i: number) {
  const name = (s?.name || "").toString().trim()
  return name || `Acara ${i + 1}`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")

    let sessions: any[] = []
    if (weddingProfileId) {
      const { data } = await supabaseAdmin
        .from("wedding_profiles")
        .select("sessions")
        .eq("id", weddingProfileId)
        .maybeSingle()
      sessions = Array.isArray(data?.sessions) ? data.sessions : []
    }

    const acaraHeader = "Acara (Sesi)"
    const header = [
      "Nama Tamu",
      "No. WhatsApp (nomor saja, tanpa +62/0)",
      "Kategori",
      "Meja",
      "VIP (isi YA jika VIP)",
      acaraHeader,
    ]

    const mapping = sessions.length > 0
      ? sessions.map((s, i) => `${i + 1} = ${sessionLabel(s, i)}`).join(", ")
      : "1 = Acara 1, 2 = Acara 2"

    const data = [
      header,
      [
        "Contoh: Anindya Pramesti",
        "81234567890",
        "Keluarga",
        "MEJA VIP 01",
        "YA",
        sessions.length > 1 ? "1,2" : "Semua",
      ],
      [
        `Panduan kolom "${acaraHeader}": kosong atau "Semua" = semua acara. Isi nomor urut sesi sesuai editor, pisah koma (contoh: 1 atau 1,2). Urutan saat ini: ${mapping}.`,
        "",
        "",
        "",
        "",
        "",
      ],
    ]

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws["!cols"] = [
      { wch: 30 },
      { wch: 35 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 28 },
    ]
    XLSX.utils.book_append_sheet(wb, ws, "Template")
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="template-import-tamu.xlsx"',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
