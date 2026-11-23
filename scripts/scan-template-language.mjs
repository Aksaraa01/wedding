#!/usr/bin/env node
/**
 * Render every in-house template in both languages and report mixed-language text.
 *
 *   node scripts/scan-template-language.mjs --env-file .env.staging \
 *     --base https://wedding-stg.aksaraa.com --profile <test-profile-id>
 *
 * Report-only by default; `--strict` exits 1 when body text in the wrong language
 * is found. It temporarily changes the test profile's `selected_template_id` and
 * `language`, then restores them.
 *
 * This is the mandatory check in docs/INHOUSE_TEMPLATE_PLAYBOOK.md §8.8: the
 * static grep cannot see which branch actually rendered, so a new template is
 * only "bilingual" after this prints 0 for it in both languages.
 */
import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

const args = process.argv.slice(2)
const arg = (name, fallback = "") => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] ?? fallback : fallback
}
const envFile = arg("--env-file", ".env.staging")
const base = arg("--base", "https://wedding-stg.aksaraa.com").replace(/\/$/, "")
const profileId = arg("--profile", "")
const strict = args.includes("--strict")
const outFile = arg("--json", "")

if (!profileId) {
  console.error("--profile <wedding_profile_id> is required (use a staging test couple)")
  process.exit(2)
}

const env = Object.fromEntries(
  readFileSync(envFile, "utf8")
    .split("\n").filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] }),
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

const EN = /\b(the|your|with|welcome|dear|please|before|after|every|first|lights|prologue|scene|enter|save the date|wishes|gift|love story|add to calendar|until the big day|monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december)\b/i
const ID = /\b(dan|yang|dengan|untuk|kami|anda|nama|tanggal|acara|hadiah|ucapan|undangan|mempelai|tamu|kirim|tulis|salin|lihat|buka|simpan|kasih|doa|cerita|galeri|foto|hari|keluarga|sambutan|pesan|judul|teks|pengantar|keterangan|catatan|hitung|mundur|senin|selasa|rabu|kamis|jumat|sabtu|minggu|januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)\b/i
const SKIP = /(Aksaraa|Instagram|WhatsApp|Boarding Pass|Now Showing|RSVP)/i

const strip = (html) =>
  html
    .replace(/<head[\s\S]*?<\/head>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()

const { data: before } = await db.from("wedding_profiles")
  .select("selected_template_id, language").eq("id", profileId).single()
if (!before) {
  console.error("profile not found:", profileId)
  process.exit(2)
}

const { data: templates, error } = await db.from("web_templates")
  .select("id, code").eq("source_type", "inhouse").order("code")
if (error) {
  console.error(error.message)
  process.exit(1)
}

const report = []
for (const t of templates) {
  const row = { code: t.code, id: 0, en: 0, samples: [] }
  for (const lang of ["id", "en"]) {
    await db.from("wedding_profiles")
      .update({ selected_template_id: t.id, language: lang }).eq("id", profileId)
    const res = await fetch(`${base}/preview/${profileId}`, { headers: { "Cache-Control": "no-cache" } })
    const text = strip(await res.text())
    const bad = lang === "id" ? EN : ID
    const hits = new Set()
    for (const m of text.matchAll(new RegExp(bad.source, "gi"))) {
      const start = Math.max(0, m.index - 40)
      const snippet = text.slice(start, m.index + 70).trim()
      if (snippet && !SKIP.test(snippet)) hits.add(snippet)
    }
    row[lang] = hits.size
    if (hits.size) row.samples.push({ lang, text: [...hits][0] })
  }
  report.push(row)
  console.log(`${t.code.padEnd(28)} id=${row.id} en=${row.en}`)
}

await db.from("wedding_profiles")
  .update({ selected_template_id: before.selected_template_id, language: before.language })
  .eq("id", profileId)

const bad = report.filter((r) => r.id > 0 || r.en > 0)
console.log(`\n${bad.length}/${report.length} templates still mix languages`)
if (outFile) {
  const { writeFileSync } = await import("node:fs")
  writeFileSync(outFile, JSON.stringify(report, null, 1) + "\n")
  console.log("report:", outFile)
}
if (strict && bad.length) process.exit(1)
