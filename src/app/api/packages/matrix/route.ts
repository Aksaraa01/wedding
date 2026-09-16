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
  { code: "bonus_full_custom", label: "BONUS FULL CUSTOM" },
  { code: "essential", label: "Essential" },
  { code: "signature", label: "Signature" },
  { code: "prestige", label: "Prestige" },
  { code: "elite", label: "Elite" },
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
          let value: string | null = r[`${col.code}_value`]
          let emphasis: string | null = r[`${col.code}_emphasis`]
          if (col.code === "bonus_full_custom" && (value === undefined || value === null) && (r as any).prestige_value !== undefined) {
            if (r.label === "Reminder otomatis ke 100 Customers VIP") {
              value = "—"
              emphasis = "muted"
            } else {
              value = (r as any).prestige_value
              emphasis = (r as any).prestige_emphasis
            }
          }
          if (col.code === "elite" && (value === undefined || value === null) && (r as any).prestige_value !== undefined) {
            value = (r as any).prestige_value
            emphasis = (r as any).prestige_emphasis
          }
          cols[col.code] = mapCell(value || "—", emphasis || "default")
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