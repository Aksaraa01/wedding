import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { PACKAGE_LABELS } from "@/lib/packages"

const EMPHASIS_CLASS: Record<string, string> = {
  default: "",
  primary: "text-primary",
  secondary: "text-secondary",
  gold: "text-[#d4af37]",
  muted: "text-on-surface-variant/30",
}

// Display order matches the pricing CSV / PDF (BONUS first, then Undangan
// Digital packages, then Buku Tamu Digital package).
const COLUMNS = [
  { code: "cetak_undangan_bonus", label: "BONUS" },
  { code: "essential", label: "Essential" },
  { code: "signature", label: "Signature" },
  { code: "prestige", label: "Prestige" },
  { code: "dgb_sistem", label: "Sistem" },
  { code: "dgb_pro", label: "Pro" },
  { code: "dgb_premium", label: "Premium" },
  { code: "dgb_prestige", label: "Prestige" },
] as const

function mapCell(value: string, emphasis: string) {
  return { value, class: EMPHASIS_CLASS[emphasis] || "" }
}

export async function GET() {
  try {
    const { data: sections, error: secError } = await supabaseAdmin
      .from("package_matrix_sections")
      .select("*")
      .order("sort_order")

    if (secError) {
      return NextResponse.json({ error: secError.message }, { status: 500 })
    }

    const { data: rows, error: rowError } = await supabaseAdmin
      .from("package_matrix_rows")
      .select("*")
      .order("sort_order")

    if (rowError) {
      return NextResponse.json({ error: rowError.message }, { status: 500 })
    }

    const matrix = sections.map((s) => ({
      code: s.code,
      label: s.label,
      rows: rows.filter((r) => r.section_code === s.code).map((r) => {
        const cols: Record<string, { value: string; class: string }> = {}
        for (const col of COLUMNS) {
          cols[col.code] = mapCell(r[`${col.code}_value`] || "—", r[`${col.code}_emphasis`] || "default")
        }
        return {
          id: r.id,
          code: r.code || undefined,
          label: r.label,
          columns: cols,
        }
      }),
    }))

    return NextResponse.json({ matrix, columns: COLUMNS.map((c) => ({ code: c.code, label: PACKAGE_LABELS[c.code] || c.label })) })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}