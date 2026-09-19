/**
 * Seed Indonesian bank & e-wallet logos into Supabase Storage.
 *
 * Usage: npx tsx scripts/seed-bank-logos.ts
 *
 * The source PNGs (160×160) are extracted from the `idn-finlogos` npm package
 * (dist/png/{slug}@2x.png) — see scripts/fetch-bank-logos.md. Uploaded under
 * `media/seeded/bank-logos/{slug}.png` so the app is not dependent on a CDN.
 */

import { readFile } from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const BUCKET = "media"
const SRC_DIR = "/tmp/banklogos/package/dist/png"

// Stored slug -> source PNG basename. Only diverges where the idn-finlogos file
// is named differently from the slug we store (shopeepay vs shopee-pay).
const SOURCE_FILE: Record<string, string> = {
  shopeepay: "shopee-pay",
}

const SLUGS = [
  "bca", "mandiri", "bni", "bri", "bsi", "btn", "cimb-niaga", "permata",
  "danamon", "ocbc-nisp", "uob", "maybank", "hsbc", "standard-chartered",
  "paninbank", "mega", "muamalat", "jago", "seabank",
  "gopay", "ovo", "dana", "shopeepay", "linkaja",
]

async function main() {
  console.log(`\nSeeding ${SLUGS.length} bank logos ...\n`)
  let ok = 0, fail = 0
  for (const slug of SLUGS) {
    const path = `${SRC_DIR}/${SOURCE_FILE[slug] || slug}@2x.png`
    const storagePath = `seeded/bank-logos/${slug}.png`
    try {
      const buf = await readFile(path)
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
        upsert: true,
        contentType: "image/png",
        // Immutable seeded content: 1y browser + CDN cache for max hit rate.
        cacheControl: "31536000",
      })
      if (error) throw error
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      console.log(`OK ${slug} → ${pub.publicUrl}`)
      ok++
    } catch (err: any) {
      console.log(`FAIL ${slug}: ${String(err.message || err).slice(0, 100)}`)
      fail++
    }
  }
  console.log(`\nDone! ${ok} uploaded, ${fail} failed.\n`)
}

main().catch(console.error)
