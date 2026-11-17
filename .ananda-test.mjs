// Prod verification for the Ceriavite ananda editor (raka test account).
// 1. add an ananda, 2. upload a photo into it, 3. name it — and check the row
// survives the focus/visibility refetch that the photo picker triggers.
// Credentials arrive through the environment and are never printed.

import { chromium } from "playwright-core"

const BASE = "https://wedding.aksaraa.com"
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const PHONE = process.env.RA_PHONE
const PIN = process.env.RA_PIN
const PROFILE_ID = process.env.RA_PROFILE_ID
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const PHOTO = process.env.RA_PHOTO

const log = (step, extra = {}) => console.log(step, JSON.stringify(extra))

async function db() {
  const res = await fetch(
    `${SUPA}/rest/v1/wedding_profiles?select=children,groom_name,groom_full_name&id=eq.${PROFILE_ID}`,
    { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
  )
  return (await res.json())[0]
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const errors = []
try {
  const ctx = await browser.newContext({ viewport: { width: 430, height: 940 } })
  const page = await ctx.newPage()
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)) })

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" })
  await page.fill("#whatsapp", PHONE)
  for (let i = 0; i < 6; i++) await page.locator(`input[aria-label="PIN digit ${i + 1}"]`).fill(PIN[i])
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 60000 }),
    page.locator('button[type="submit"]').click(),
  ])
  log("login ok")

  await page.goto(`${BASE}/dashboard/${PROFILE_ID}/web-invitation`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)
  log("editor url", { url: page.url() })

  const addBtn = page.getByRole("button", { name: /TAMBAH ANANDA/i })
  if (!(await addBtn.count())) {
    const text = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 700)
    log("NO ADD BUTTON", { url: page.url(), text })
    throw new Error("editor did not render the ananda section")
  }

  const cards = () => page.getByText(/^Ananda \d+$/).count()
  const before = await cards()
  await addBtn.first().click()
  await page.waitForTimeout(600)
  const afterAdd = await cards()
  log("add click", { before, afterAdd })

  // Upload a photo into the NEW card's file input (last one in the section).
  const fileInputs = page.locator('input[type="file"]')
  const n = await fileInputs.count()
  await fileInputs.nth(n - 1).setInputFiles(PHOTO)
  await page.waitForTimeout(9000)
  const afterUpload = await cards()
  log("after upload", { fileInputs: n, afterUpload })

  // Name it, so the row is meaningful and saved for sure.
  await page.getByPlaceholder("Nama panggilan ananda").last().fill("Rizky")
  await page.getByPlaceholder("Nama lengkap ananda").last().fill("Rizky Pratama")
  await page.waitForTimeout(4000)
  const afterType = await cards()
  const row = await db()
  log("after typing", {
    afterType,
    children: (row?.children || []).map((c) => ({ n: c.name, f: c.full_name, p: !!c.photo_url })),
    groom_name: row?.groom_name,
  })

  // Re-open the tab (focus refetch) and confirm the rows are still there.
  await page.goto(`${BASE}/dashboard/${PROFILE_ID}/web-invitation`, { waitUntil: "domcontentloaded" })
  await page.waitForTimeout(4000)
  log("after reload", { cards: await cards() })

  await page.screenshot({ path: "editor-after.png" })
} catch (err) {
  log("FAILED", { error: String(err).slice(0, 400) })
} finally {
  await browser.close()
}
console.log("CONSOLE_ERRORS", JSON.stringify(errors.slice(0, 4)))
