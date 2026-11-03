import test from "node:test"
import assert from "node:assert/strict"

import {
  classifyObjection,
  ctaFor,
  detectOptOut,
  handoffSummary,
  missingCoreFacts,
  nextQualifyingQuestion,
  nextStage,
  objectionPlan,
  parseBudgetBand,
  parseGuestCount,
  parseObjectiveNeed,
  parseWeddingDate,
  recommendPackage,
  validateLeadFact,
} from "../src/lib/cs/playbook.ts"

const NOW = new Date("2026-11-03T00:00:00Z")

const book = {
  base: {
    essential: 1_500_000,
    signature: 2_500_000,
    prestige: 4_000_000,
    elite: 6_000_000,
    dgb_sistem: 500_000,
    dgb_pro: 900_000,
    dgb_premium: 1_500_000,
    dgb_prestige: 2_500_000,
    gt: 700_000,
  },
}

test("tanggal: 12 Desember 2026", () => {
  const parsed = parseWeddingDate("12 Desember 2026", NOW)
  assert.deepEqual(parsed, { iso: "2026-12-12", approximate: false })
})

test("tanggal: 12/12/2026", () => {
  assert.deepEqual(parseWeddingDate("12/12/2026", NOW), { iso: "2026-12-12", approximate: false })
})

test("tanggal: Desember 2026 ditandai perkiraan", () => {
  assert.deepEqual(parseWeddingDate("rencananya Desember 2026", NOW), {
    iso: "2026-12-01",
    approximate: true,
  })
})

test("tanggal: teks tanpa tanggal", () => {
  assert.equal(parseWeddingDate("belum tahu kak", NOW), null)
})

test("budget: 5 juta masuk 3_6m", () => {
  assert.equal(parseBudgetBand("budget 5 juta"), "3_6m")
})

test("budget: 800rb masuk under_1m", () => {
  assert.equal(parseBudgetBand("800rb aja kak"), "under_1m")
})

test("budget: teks kosong", () => {
  assert.equal(parseBudgetBand("belum ada budget"), null)
})

test("tamu: 300 orang", () => {
  assert.equal(parseGuestCount("sekitar 300 orang"), 300)
})

test("kebutuhan: buku tamu", () => {
  assert.equal(parseObjectiveNeed("butuh buku tamu qr"), "buku_tamu")
})

test("kebutuhan: galeri", () => {
  assert.equal(parseObjectiveNeed("mau galeri foto tamu"), "galeri")
})

test("opt-out terdeteksi", () => {
  assert.equal(detectOptOut("jangan hubungi saya lagi"), true)
  assert.equal(detectOptOut("jangan chat lagi ya"), true)
  assert.equal(detectOptOut("oke kak makasih"), false)
})

test("keberatan: harga, waktu, banding", () => {
  assert.equal(classifyObjection("mahal bgt bisa kurang?"), "price")
  assert.equal(classifyObjection("nanti aku pikir dulu"), "timing")
  assert.equal(classifyObjection("mau bandingkan vendor lain"), "comparison")
})

test("objection plan: harga pertama ditangani, kedua eskalasi", () => {
  const first = objectionPlan("price", 0)
  assert.equal(first.escalate, false)
  assert.equal(first.strategy, "value_then_alternative")
  assert.ok(first.tools.includes("quote_price"))

  const second = objectionPlan("price", 1)
  assert.equal(second.escalate, true)
})

test("objection plan: timing menyimpan follow-up 2 hari", () => {
  const plan = objectionPlan("timing", 0)
  assert.equal(plan.escalate, false)
  assert.equal(plan.followupDays, 2)
})

test("kualifikasi: pertanyaan pertama adalah kebutuhan", () => {
  const next = nextQualifyingQuestion({})
  assert.equal(next?.key, "need")
})

test("kualifikasi: berhenti setelah 2 pertanyaan", () => {
  assert.equal(nextQualifyingQuestion({}, 2), null)
})

test("kualifikasi: tidak menanyakan tanggal atau kota", () => {
  const facts = { need: "undangan", guest_count: 300 }
  assert.deepEqual(missingCoreFacts(facts), [])
  assert.equal(nextQualifyingQuestion({ ...facts, wedding_date: null, city: null }), null)
})

test("rekomendasi: budget kecil → essential", () => {
  const rec = recommendPackage({ budget_band: "under_1m", guest_count: 100 }, book, NOW)
  assert.equal(rec.package_code, "essential")
})

test("rekomendasi: tamu 600 → prestige", () => {
  const rec = recommendPackage({ guest_count: 600, need: "undangan" }, book, NOW)
  assert.equal(rec.package_code, "prestige")
})

test("rekomendasi: tamu 1500 → elite", () => {
  const rec = recommendPackage({ guest_count: 1500, need: "undangan" }, book, NOW)
  assert.equal(rec.package_code, "elite")
})

test("rekomendasi: buku tamu 400 tamu → dgb_pro", () => {
  const rec = recommendPackage({ need: "buku_tamu", guest_count: 400 }, book, NOW)
  assert.equal(rec.package_code, "dgb_pro")
})

test("rekomendasi: galeri → gt", () => {
  const rec = recommendPackage({ need: "galeri" }, book, NOW)
  assert.equal(rec.package_code, "gt")
})

test("rekomendasi: acara < 21 hari → express", () => {
  const rec = recommendPackage({ wedding_date: "2026-11-15", guest_count: 200 }, book, NOW)
  assert.equal(rec.express, true)
})

test("rekomendasi: acara jauh → bukan express", () => {
  const rec = recommendPackage({ wedding_date: "2027-06-01", guest_count: 200 }, book, NOW)
  assert.equal(rec.express, false)
})

test("CTA: template dipilih", () => {
  const cta = ctaFor({ template_interest: "iris" })
  assert.match(cta.url, /register\?template=iris/)
})

test("CTA: tanpa data → halaman template", () => {
  assert.match(ctaFor({}).url, /\/templates$/)
})

test("stage: fakta lengkap → recommending", () => {
  const stage = nextStage("qualifying", {
    missingFacts: 0,
    objectionCount: 0,
    ctaReady: false,
    handoff: false,
  })
  assert.equal(stage, "recommending")
})

test("stage: eskalasi → handoff", () => {
  const stage = nextStage("recommending", {
    missingFacts: 0,
    objectionCount: 1,
    ctaReady: false,
    handoff: true,
  })
  assert.equal(stage, "handoff")
})

test("handoff summary memuat fakta lead", () => {
  const text = handoffSummary({
    facts: {
      wedding_date: "2026-12-12",
      city: "Bandung",
      guest_count: 400,
      budget_band: "3_6m",
      need: "undangan",
      package_interest: "signature",
    },
    reason: "discount",
    name: "Rafi",
    phone: "+6281234567890",
    objectionCount: 2,
    stage: "objection",
  })

  assert.match(text, /Bandung/)
  assert.match(text, /400/)
  assert.match(text, /3_6m/)
  assert.match(text, /signature/)
  assert.match(text, /2x/)
})

test("validasi fakta: kota dan tanggal", () => {
  assert.equal(validateLeadFact("city", "  Jakarta  ").ok, true)
  assert.equal(validateLeadFact("city", "J").ok, false)
  assert.equal(validateLeadFact("wedding_date", "12 Desember 2026", NOW).ok, true)
  assert.equal(validateLeadFact("wedding_date", "besok", NOW).ok, false)
})

test("validasi fakta: jumlah tamu dan budget", () => {
  assert.equal(validateLeadFact("guest_count", "300 orang").ok, true)
  assert.equal(validateLeadFact("guest_count", 0).ok, false)
  assert.equal(validateLeadFact("budget_band", "5 juta").ok, true)
  assert.equal(validateLeadFact("budget_band", "belum ada").ok, false)
})
