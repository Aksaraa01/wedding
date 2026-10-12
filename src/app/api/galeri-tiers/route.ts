import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Slider tier source of truth (ops-editable via galeri_tiers).
// No hardcoded fallback — a read failure surfaces as 500 so the UI can
// retry instead of pricing from stale constants.
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("galeri_tiers")
      .select("tier, photo_min, photo_max, guest_min, guest_max, price")
      .order("tier")

    if (error) throw new Error(error.message)
    if (!data || data.length === 0) throw new Error("Tier galeri belum dikonfigurasi")

    const tiers: Record<string, { price: number; photoMin: number; photoMax: number; guestMin: number; guestMax: number }> = {}
    for (const row of data as { tier: string; photo_min: number; photo_max: number; guest_min: number; guest_max: number; price: number }[]) {
      tiers[row.tier] = {
        price: Math.floor(Number(row.price) || 0),
        photoMin: row.photo_min,
        photoMax: row.photo_max,
        guestMin: row.guest_min,
        guestMax: row.guest_max,
      }
    }
    const res = NextResponse.json({ tiers })
    res.headers.set("Cache-Control", "public, max-age=60")
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
