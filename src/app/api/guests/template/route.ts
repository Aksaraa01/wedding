import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
  const wb = XLSX.utils.book_new()
  const data = [
    ["Nama Tamu", "No. WhatsApp (nomor saja, tanpa +62/0)", "Kategori", "Meja"],
    ["Contoh: Anindya Pramesti", "81234567890", "Keluarga", "MEJA VIP 01"],
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)

  ws["!cols"] = [
    { wch: 30 },
    { wch: 35 },
    { wch: 20 },
    { wch: 15 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, "Template")
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-import-tamu.xlsx"',
    },
  })
}
