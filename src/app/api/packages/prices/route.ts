import { NextResponse } from "next/server"
import { getPriceBook } from "@/lib/priceBook"

// Public price book: every price the customize page displays or charges.
// Source of truth is packages + product_price_tiers (never hardcoded).
export async function GET() {
  try {
    const book = await getPriceBook()
    const res = NextResponse.json(book)
    res.headers.set("Cache-Control", "public, max-age=60")
    return res
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
