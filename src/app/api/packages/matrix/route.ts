import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

const EMPHASIS_CLASS: Record<string, string> = {
  default: "",
  primary: "text-primary",
  secondary: "text-secondary",
  gold: "text-[#d4af37]",
  muted: "text-on-surface-variant/30",
}

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
      rows: rows.filter((r) => r.section_code === s.code).map((r) => ({
        label: r.label,
        essential: mapCell(r.essential_value, r.essential_emphasis),
        signature: mapCell(r.signature_value, r.signature_emphasis),
        prestige: mapCell(r.prestige_value, r.prestige_emphasis),
      })),
    }))

    return NextResponse.json({ matrix })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
