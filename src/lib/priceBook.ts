import { supabaseAdmin } from "@/lib/supabase"
import { cachedRead } from "@/lib/refCache"
import type { PriceBook } from "@/lib/packages"

// Server-only price source of truth: packages.base_price / price_old and
// product_price_tiers (wa_blast tiers + express_service flat fee).
// Throws when unreadable — callers must surface the error, never silently
// fall back to hardcoded money.
export async function getPriceBook(): Promise<PriceBook> {
  return cachedRead("price-book", 10 * 60_000, async () => {
    const [{ data: pkgs, error: pkgErr }, { data: tiers, error: tierErr }] = await Promise.all([
      supabaseAdmin.from("packages").select("code, base_price, price_old"),
      supabaseAdmin.from("product_price_tiers").select("product_code, min_qty, price"),
    ])
    if (pkgErr) throw new Error(`packages unreadable: ${pkgErr.message}`)
    if (tierErr) throw new Error(`product_price_tiers unreadable: ${tierErr.message}`)

    const base: Record<string, number> = {}
    const old: Record<string, number | null> = {}
    for (const row of (pkgs || []) as { code: string; base_price: unknown; price_old: unknown }[]) {
      base[row.code] = Math.floor(Number(row.base_price) || 0)
      old[row.code] = row.price_old === null || row.price_old === undefined ? null : Math.floor(Number(row.price_old) || 0)
    }

    const waTiers: Record<number, number> = {}
    let express = 0
    for (const row of (tiers || []) as { product_code: string; min_qty: unknown; price: unknown }[]) {
      const price = Math.floor(Number(row.price) || 0)
      if (row.product_code === "wa_blast") {
        waTiers[Math.floor(Number(row.min_qty) || 0)] = price
      } else if (row.product_code === "express_service") {
        express = price
      }
    }
    if (express <= 0) throw new Error("express_service price missing")

    return { base, old, waTiers, express }
  })
}
