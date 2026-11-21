import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { supabaseAdmin } from "@/lib/supabase"
import { templateSupportsInvitedSessions } from "@/lib/invitedSessionsServer"

function sessionLabel(s: any, i: number) {
  const name = (s?.name || "").toString().trim()
  return name || `Acara ${i + 1}`
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const weddingProfileId = searchParams.get("wedding_profile_id")

    let sessions: any[] = []
    let acaraSupported = false
    if (weddingProfileId) {
      const [{ data }, supported] = await Promise.all([
        supabaseAdmin
          .from("wedding_profiles")
          .select("sessions")
          .eq("id", weddingProfileId)
          .maybeSingle(),
        templateSupportsInvitedSessions(weddingProfileId),
      ])
      sessions = Array.isArray(data?.sessions) ? data.sessions : []
      acaraSupported = supported
    }

    const acaraHeader = "Acara (Sesi)"
    const baseHeader = [
      "Nama Tamu",
      "No. WhatsApp (nomor saja, tanpa +62/0)",
      "Kategori",
      "Meja",
      "VIP (isi YA jika VIP)",
    ]
    const header = acaraSupported ? [...baseHeader, acaraHeader] : baseHeader

    const mapping = sessions.length > 0
      ? sessions.map((s, i) => `${i + 1} = ${sessionLabel(s, i)}`).join(", ")
      : "1 = Acara 1, 2 = Acara 2"

    const exampleRow = acaraSupported
      ? [
          "Contoh: Anindya Pramesti",
          "81234567890",
          "Keluarga",
          "MEJA VIP 01",
          "YA",
          sessions.length > 1 ? "1,2" : "Semua",
        ]
      : [
          "Contoh: Anindya Pramesti",
          "81234567890",
          "Keluarga",
          "MEJA VIP 01",
          "YA",
        ]

    const data: (string | number)[][] = [header, exampleRow]

    if (acaraSupported) {
      data.push([
        `Panduan kolom "${acaraHeader}": kosong atau "Semua" = semua acara. Isi nomor urut sesi sesuai editor, pisah koma (contoh: 1 atau 1,2). Urutan saat ini: ${mapping}.`,
        "",
        "",
        "",
        "",
        "",
      ])
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(data)
    ws["!cols"] = acaraSupported
      ? [
          { wch: 30 },
          { wch: 35 },
          { wch: 20 },
          { wch: 15 },
          { wch: 22 },
          { wch: 28 },
        ]
      : [
          { wch: 30 },
          { wch: 35 },
          { wch: 20 },
          { wch: 15 },
          { wch: 22 },
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
