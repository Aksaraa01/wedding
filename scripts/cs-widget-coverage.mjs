#!/usr/bin/env node
// Uji cakupan widget: halaman marketing harus punya tombol "Tanya CS", undangan
// tamu + dashboard + halaman auth tidak boleh punya.
//
//   CS_E2E_URL=http://127.0.0.1:3100 node scripts/cs-widget-coverage.mjs

import fs from "node:fs"
import { fileURLToPath } from "node:url"

const BASE = (process.env.CS_E2E_URL || "http://127.0.0.1:3100").replace(/\/$/, "")
const envPath = fileURLToPath(new URL("../.env.local", import.meta.url))
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "")
}

const { signSession } = await import(new URL("../src/lib/sessionToken.ts", import.meta.url).href)

const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const PUBLIC_PAGES = [
  "/hero",
  "/templates",
  "/design",
  "/premium-web-invitation",
  "/fitur/undangan-digital",
  "/artikel",
  "/kalkulator-budget",
  "/virtual-wish-wall",
  "/qr-digital-buku-tamu",
  "/galeri-kenangan-tamu",
  "/reminder-tamu-vip",
]

// Rute non-marketing: widget tidak boleh muncul walau komponen Navigation dipakai.
const PRIVATE_PAGES = ["/register", "/login", "/customize", "/daftar"]

const results = []
function record(name, ok, detail) {
  results.push({ name, ok, detail })
}

async function fetchProfile() {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/wedding_profiles?select=id,slug,groom_name,bride_name,is_published&limit=1`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  )
  const rows = await res.json()
  return rows[0] || null
}

async function main() {
  const profile = await fetchProfile()
  if (!profile) throw new Error("tidak ada profil di staging")

  let cookie = ""
  const token = await signSession({ sub: profile.id, scope: "couple" }, 3600)
  const coupleCookie = `aksaraa_session=${token}`

  for (const page of PUBLIC_PAGES) {
    const res = await fetch(`${BASE}${page}`, { redirect: "manual" })
    const html = await res.text()
    record(
      `publik ${page}`,
      res.status === 200 && html.includes("Buka chat CS"),
      `status ${res.status}`
    )
  }

  for (const page of PRIVATE_PAGES) {
    const res = await fetch(`${BASE}${page}`, { redirect: "manual" })
    const html = await res.text()
    record(
      `privat ${page} TIDAK ada widget`,
      !html.includes("Buka chat CS"),
      `status ${res.status}`
    )
  }

  const invitation = await fetch(`${BASE}/w/${profile.slug}`, { redirect: "manual" })
  const invitationHtml = await invitation.text()
  record(
    `undangan /w/${profile.slug} TIDAK ada widget`,
    !invitationHtml.includes("Buka chat CS"),
    `status ${invitation.status}`
  )

  const dashboard = await fetch(`${BASE}/dashboard/${profile.id}`, {
    headers: { cookie: coupleCookie },
    redirect: "manual",
  })
  const dashboardHtml = await dashboard.text()
  record(
    "dashboard TIDAK ada widget",
    dashboard.status === 200 && !dashboardHtml.includes("Buka chat CS"),
    `status ${dashboard.status}`
  )

  const chat = await fetch(`${BASE}/api/cs/chat`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: coupleCookie },
    body: JSON.stringify({
      text: "status undangan saya gimana?",
      client_message_id: `coverage-${Date.now()}`,
    }),
  })
  const setCookie = chat.headers.get("set-cookie") || ""
  const sessionMatch = setCookie.match(/cs_session=[^;]+/)
  if (sessionMatch) cookie = sessionMatch[0]
  const data = await chat.json().catch(() => ({}))
  const reply = String(data.reply || "")

  record(
    "chat dashboard tidak minta verifikasi ulang",
    chat.status === 200 && !/verifikasi nomor|nomor whatsapp yang kakak pakai/i.test(reply),
    reply.slice(0, 160)
  )
  record(
    "chat dashboard menjawab status",
    /status|pembayaran|publish|tayang|belum|sudah/i.test(reply),
    reply.slice(0, 160)
  )

  let failed = 0
  for (const result of results) {
    if (!result.ok) failed += 1
    console.log(`${result.ok ? "✅" : "❌"} ${result.name} — ${result.detail}`)
  }
  console.log(`${results.length - failed}/${results.length} cek lulus`)

  // bersihkan kontak web uji
  if (cookie) {
    const sid = cookie.replace("cs_session=", "")
    await fetch(`${SUPA_URL}/rest/v1/cs_contacts?wa_jid=eq.${encodeURIComponent(`web:${sid}`)}`, {
      method: "DELETE",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    }).catch(() => {})
  }

  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
