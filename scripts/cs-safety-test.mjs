import test from "node:test"
import assert from "node:assert/strict"

import { BOUNDARIES, classify, countUnknownStrikes, decide, detectPaymentClaim, detectSentiment, wantsAllTemplates } from "../src/lib/cs/policy.ts"
import { CS_WHATSAPP, csWhatsAppUrl, paymentContactReply, templateGalleryReply } from "../src/lib/cs/contact.ts"
import {
  SECTION_SPECS,
  mapSectionFromText,
  matchTemplateByName,
  POPULAR_QUOTES,
  isUncertainAnswer,
  isSkip,
  looksLikeQuestion,
  validateFlowAnswer,
  validateSessionField,
} from "../src/lib/cs/onboardingSpec.ts"
import {
  CODE_TTL_MS,
  MAX_CODE_ATTEMPTS,
  canAccessProfile,
  canRequestCode,
  checkVerification,
  generateCode,
  maskPhone,
  normalizeWhatsApp,
  samePhone,
  toJid,
} from "../src/lib/cs/identity.ts"
import { validateReply } from "../src/lib/cs/guard.ts"
import { escalationReply } from "../src/lib/cs/replies.ts"
import { csWidgetEnabledOn } from "../src/lib/cs/widgetRoutes.ts"
import {
  citationLine,
  htmlToChunks,
  isCitationRelevant,
  retrieveKnowledge,
  stripHtml,
  stripMoney,
  tokenize,
} from "../src/lib/cs/knowledge.ts"
import { CS_KNOWLEDGE } from "../src/data/csKnowledge.ts"
import { isPlaceholderTemplate, matchesTemplateCategory } from "../src/lib/cs/templateFilter.ts"
import { sanitizeReply } from "../src/lib/cs/text.ts"
import { isCustomerFeature, isSellablePackage } from "../src/lib/cs/catalog.ts"
import { POLICIES, formatPolicies, resolvePolicies } from "../src/lib/cs/policies.ts"
import { ctaFor, detectPackageInterest, extractVoucherCode } from "../src/lib/cs/playbook.ts"
import {
  applyAnswer,
  buildPatch,
  nextQuestion,
  requiresConfirmation,
  validateField,
} from "../src/lib/cs/profileFields.ts"

const NOW = new Date("2026-11-03T10:00:00+07:00")
const ctx = {
  verified: false,
  hasProfile: false,
  published: false,
  strikeCount: 0,
  sentiment: "neutral",
}

// ---------- policy: klasifikasi intent ----------

test("classify: pertanyaan paket", () => {
  assert.equal(classify("halo kak, paket yg paling worth it yg mana ya? budget 5jt"), "recommendation")
})

test("classify: nego masuk discount", () => {
  assert.equal(classify("mahal bgt ya kak, bisa kurang ga?"), "discount")
})

test("classify: keluhan keterlambatan", () => {
  assert.equal(classify("knp undangan aku blm jadi? udh 2 minggu dari DP"), "complaint")
})

test("classify: refund", () => {
  assert.equal(classify("saya mau refund aja"), "refund")
})

test("classify: ubah tanggal", () => {
  assert.equal(classify("bisa ganti tanggal acara ga?"), "reschedule")
})

test("classify: minta manusia", () => {
  assert.equal(classify("minta cs manusia dong"), "human_request")
})

test("classify: di luar topik", () => {
  assert.equal(classify("menurut kamu presiden kita siapa"), "out_of_scope")
})

test("classify: isi data", () => {
  assert.equal(classify("saya mau bantu isi data mempelai"), "data_collection")
})

test("classify: status", () => {
  assert.equal(classify("status pesanan saya sudah sampai mana?"), "status")
})

test("classify: teknis", () => {
  assert.equal(classify("link undangan ga bisa dibuka di android"), "technical")
})

test("paket: 'aku mau signature' terdeteksi", () => {
  assert.equal(detectPackageInterest("aku mau signature kak"), "signature")
  assert.equal(detectPackageInterest("mau buku tamu prestige"), "dgb_prestige")
  assert.equal(detectPackageInterest("ambil galeri tamu"), "gt")
})

test("classify: pertanyaan undangan cetak", () => {
  assert.equal(classify("ada undangan cetak ga?"), "print_question")
})

test("classify: pilih paket → select_package", () => {
  assert.equal(classify("aku mau signature kak"), "select_package")
})

test("decide: pilih paket → cta", () => {
  const d = decide("select_package", ctx)
  assert.equal(d.action, "playbook")
  assert.equal(d.step, "cta")
})

test("cta: paket terpilih memberi link register paket itu", () => {
  const cta = ctaFor({ package_interest: "signature" })
  assert.match(cta.url, /register\?package=signature/)
})

test("guard: meminta kode voucher ditolak", () => {
  const r = validateReply({ reply: "Kalau Kakak punya kode voucher, kirim saja ke sini ya." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "bureaucratic_phrase"))
})

test("voucher: kode diekstrak dari pesan", () => {
  assert.equal(extractVoucherCode("voucher CTK01 masih berlaku?"), "CTK01")
  assert.equal(extractVoucherCode("harganya Rp299.000 ya"), null)
})

test("decide: klien kirim kode → eskalasi voucher", () => {
  const d = decide("voucher", { ...ctx, voucherCode: "CTK01" })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "voucher")
  assert.equal(d.priority, "normal")
})

test("guard: kode yang dikirim klien wajib disebut", () => {
  const missing = validateReply({
    reply: "Voucher itu masih aktif, potongan Rp 50.000.",
    evidence: [{ amount: 50000 }],
    expectedVoucherCode: "CTK01",
  })
  assert.equal(missing.ok, false)
  assert.ok(missing.violations.some((v) => v.code === "missing_voucher_code"))

  const ok = validateReply({
    reply: "CTK01 masih aktif, potongan Rp 50.000.",
    evidence: [{ amount: 50000 }],
    expectedVoucherCode: "CTK01",
  })
  assert.equal(ok.ok, true, JSON.stringify(ok.violations))
})

test("classify: tanya voucher masuk voucher", () => {
  assert.equal(classify("ada voucher ga kak?"), "voucher")
  assert.equal(classify("promo apa saja yang aktif?"), "voucher")
})

test("classify: minta diskon tetap discount", () => {
  assert.equal(classify("bisa diskon ga kak?"), "discount")
})

test("decide: pertanyaan voucher tanpa kode juga dieskalasi", () => {
  const d = decide("voucher", ctx)
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "voucher")
})

test("guard: balasan voucher lolos guard", () => {
  const r = validateReply({ reply: escalationReply("voucher") })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("batas: voucher tidak diputuskan agent", () => {
  assert.ok(BOUNDARIES.some((rule) => /voucher/i.test(rule)))
})

test("guard: klaim data sudah diganti ditolak", () => {
  for (const reply of [
    "Oke Kak, nama mempelainya sudah aku ganti ya.",
    "Sudah diganti Kak, cek undangannya.",
    "Data undangan telah diperbarui.",
  ]) {
    const r = validateReply({ reply })
    assert.equal(r.ok, false, reply)
    assert.ok(r.violations.some((v) => v.code === "action_claim"), reply)
  }
})

test("guard: pertanyaan tentang perubahan tidak ikut ditolak", () => {
  const r = validateReply({ reply: "Tanggalnya mau diubah jadi kapan, Kak?" })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("classify: permintaan ubah data masuk data_change", () => {
  assert.equal(classify("mau ganti nama mempelai"), "data_change")
  assert.equal(classify("koreksi nama saya salah"), "data_change")
  assert.equal(classify("ganti tanggal akad"), "reschedule")
  assert.equal(classify("ganti template dong"), "template")
})

test("decide: ubah data butuh verifikasi dulu", () => {
  const d = decide("data_change", ctx)
  assert.equal(d.action, "verify")
})

test("decide: ubah data setelah terverifikasi jadi tiket tim", () => {
  const d = decide("data_change", { ...ctx, verified: true, hasProfile: true })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "data_change")
})

test("decide: permintaan data dari web anonim langsung ke tim", () => {
  for (const intent of ["data_change", "status", "data_collection"]) {
    const d = decide(intent, { ...ctx, channel: "web" })
    assert.equal(d.action, "escalate", intent)
    assert.equal(d.reason, "no_profile", intent)
  }
})

test("decide: permintaan data dari WhatsApp minta PIN dulu", () => {
  for (const intent of ["data_change", "status", "data_collection"]) {
    const d = decide(intent, { ...ctx, channel: "wa" })
    assert.equal(d.action, "verify", intent)
  }
})

// ---------- pembayaran ----------

test("payment: cara bayar dijawab nomor tim + link WhatsApp", () => {
  const d = decide("payment", ctx)
  assert.equal(d.action, "contact")
  assert.match(d.message, new RegExp(CS_WHATSAPP))
  assert.match(d.message, /wa\.me/)
})

test("payment: klaim sudah bayar tetap jadi tiket", () => {
  const d = decide("payment", { ...ctx, paidClaim: true })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "payment")
})

test("payment: deteksi klaim bayar", () => {
  assert.equal(detectPaymentClaim("cara bayar gimana kak?"), false)
  assert.equal(detectPaymentClaim("sudah transfer kak"), true)
  assert.equal(detectPaymentClaim("ini bukti transfernya"), true)
  assert.equal(detectPaymentClaim("minta invoice dong"), true)
})

test("template: 'semua template' dijawab galeri, bukan link acak", () => {
  const d = decide("template", { ...ctx, wantsAllTemplates: true })
  assert.equal(d.action, "contact")
  assert.match(d.message, /wedding\.aksaraa\.com\/templates/)
  assert.doesNotMatch(d.message, /\/preview\//)

  const kids = decide("template", { ...ctx, wantsAllTemplates: true, kidsTopic: true })
  assert.equal(kids.action, "contact")
  assert.match(kids.message, /ceriavite\.aksaraa\.com/)
})

test("template: frasa 'semua/daftar/apa saja' terdeteksi", () => {
  for (const text of [
    "Semua template nya bisa dilihat dimana?",
    "semua template",
    "minta daftar template dong",
    "ada template apa saja?",
    "template apa aja yang ada",
    "lihat semua desain",
  ]) {
    assert.equal(wantsAllTemplates(text), true, text)
    assert.equal(classify(text), "template", text)
  }
  for (const text of [
    "template Sandhya masih ada?",
    "ganti template saya",
    "desain ini bagus",
    "berapa harga template premium",
  ]) {
    assert.equal(wantsAllTemplates(text), false, text)
  }
})

test("template: permintaan spesifik tetap lewat tool", () => {
  const d = decide("template", { ...ctx, wantsAllTemplates: false })
  assert.equal(d.action, "tool")
  assert.equal(d.tool, "list_templates")
})

test("guard: jawaban galeri lolos guard", () => {
  for (const reply of [templateGalleryReply(false), templateGalleryReply(true)]) {
    const r = validateReply({ reply })
    assert.equal(r.ok, true, JSON.stringify(r.violations))
  }
})

test("guard: nomor dan link tim CS diizinkan", () => {
  const r = validateReply({ reply: paymentContactReply() })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
  const link = validateReply({ reply: `Chat ke ${csWhatsAppUrl("halo")}` })
  assert.equal(link.ok, true, JSON.stringify(link.violations))
})

test("guard: nomor asing tetap ditolak", () => {
  const r = validateReply({ reply: "Hubungi 081234567890 ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "pii_phone"))
})

// ---------- penerapan draft ke DB ----------

test("patch draft: field terlarang ditolak, inviting_families di-stringify", () => {
  const result = buildPatch({
    groom_full_name: "Rafi Pratama",
    inviting_families: ["Keluarga A", "Keluarga B"],
    payment_status: "paid",
    estimated_wedding_date: "2026-12-12",
    random_key: "x",
  })

  assert.equal(result.ok, false)
  assert.deepEqual(result.rejected.sort(), ["estimated_wedding_date", "payment_status", "random_key"])
  assert.equal(result.patch.groom_full_name, "Rafi Pratama")
  assert.equal(typeof result.patch.inviting_families, "string")
  assert.equal(JSON.parse(result.patch.inviting_families).length, 2)
})

test("classify: estimasi waktu pengerjaan", () => {
  assert.equal(classify("berapa lama pengerjaannya?"), "timeline")
})

test("decide: estimasi waktu dijawab langsung", () => {
  const d = decide("timeline", ctx)
  assert.equal(d.action, "answer")
})

test("classify: minta berhenti dihubungi", () => {
  assert.equal(classify("jangan chat saya lagi ya"), "opt_out")
})

test("classify: nanti dulu", () => {
  assert.equal(classify("nanti aku diskusi dulu ya kak"), "timing")
})

test("classify: mau daftar", () => {
  assert.equal(classify("mau daftar gimana caranya"), "cta_register")
})

test("classify: bandingkan vendor", () => {
  assert.equal(classify("mau bandingkan sama vendor lain"), "comparison")
})

// ---------- policy: keputusan ----------

test("decide: discount pertama ditangani, bukan langsung eskalasi", () => {
  const d = decide("discount", ctx)
  assert.equal(d.action, "playbook")
  assert.equal(d.step, "objection")
  assert.equal(d.strategy, "price")
})

test("decide: discount kedua dieskalasi", () => {
  const d = decide("discount", { ...ctx, objectionCount: 1 })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "discount")
})

test("decide: komplain eskalasi prioritas tinggi", () => {
  const d = decide("complaint", { ...ctx, sentiment: "angry" })
  assert.equal(d.action, "escalate")
  assert.equal(d.priority, "high")
})

test("decide: harga lewat tool quote", () => {
  const d = decide("price", ctx)
  assert.equal(d.action, "tool")
  assert.equal(d.tool, "quote")
})

test("decide: isi data tanpa verifikasi minta verifikasi", () => {
  const d = decide("data_collection", ctx)
  assert.equal(d.action, "verify")
})

test("decide: isi data terverifikasi tapi tanpa profil eskalasi", () => {
  const d = decide("data_collection", { ...ctx, verified: true, hasProfile: false })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "no_profile")
})

test("decide: status terverifikasi pakai tool", () => {
  const d = decide("status", { ...ctx, verified: true, hasProfile: true })
  assert.equal(d.action, "tool")
  assert.equal(d.tool, "profile_status")
})

test("decide: out of scope ditolak", () => {
  assert.equal(decide("out_of_scope", ctx).action, "refuse")
})

test("decide: dua kali tidak paham eskalasi", () => {
  const d = decide("unknown", { ...ctx, strikeCount: 2 })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "low_confidence")
})

test("decide: minta berhenti → opt_out", () => {
  assert.equal(decide("opt_out", ctx).action, "opt_out")
})

test("decide: mau daftar → playbook cta", () => {
  const d = decide("cta_register", ctx)
  assert.equal(d.action, "playbook")
  assert.equal(d.step, "cta")
})

test("decide: sapaan tidak memicu formulir", () => {
  const d = decide("unknown", { ...ctx, missingFacts: 2, leadStage: "new" })
  assert.equal(d.action, "answer")
})

test("decide: minta rekomendasi paket → kualifikasi satu hal", () => {
  const d = decide("recommendation", ctx)
  assert.equal(d.action, "playbook")
  assert.equal(d.step, "qualify")
})

test("decide: sapaan tanpa kebutuhan kualifikasi → jawab", () => {
  const d = decide("unknown", { ...ctx, missingFacts: 3, leadStage: "recommending" })
  assert.equal(d.action, "answer")
})

test("boundaries menyebut larangan uang dan tanggal", () => {
  const all = BOUNDARIES.join(" ").toLowerCase()
  assert.ok(all.includes("harga"))
  assert.ok(all.includes("tanggal"))
  assert.ok(all.includes("verifikasi"))
})

// ---------- identity ----------

test("normalizeWhatsApp: 08xx menjadi +62xx", () => {
  assert.equal(normalizeWhatsApp("0812-3456-7890"), "+6281234567890")
})

test("normalizeWhatsApp: +62 dan 62 sama", () => {
  assert.equal(normalizeWhatsApp("+62 812 3456 7890"), "+6281234567890")
  assert.equal(normalizeWhatsApp("6281234567890"), "+6281234567890")
})

test("normalizeWhatsApp: kosong tetap kosong", () => {
  assert.equal(normalizeWhatsApp("abc"), "")
})

test("samePhone toleran format", () => {
  assert.equal(samePhone("+62 812-3456-7890", "081234567890"), true)
  assert.equal(samePhone("081234567890", "081234567891"), false)
})

test("toJid untuk Baileys", () => {
  assert.equal(toJid("081234567890"), "6281234567890@s.whatsapp.net")
})

test("maskPhone menyembunyikan tengah", () => {
  const masked = maskPhone("+6281234567890")
  assert.ok(masked.startsWith("+62812"))
  assert.ok(masked.endsWith("890"))
  assert.ok(masked.includes("*"))
})

test("kode 6 digit", () => {
  assert.match(generateCode(() => 0.5), /^\d{6}$/)
})

test("canRequestCode: nomor belum terdaftar", () => {
  const r = canRequestCode({ registeredPhone: null, claimedPhone: "081234567890", attempts: 0 })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "not_registered")
})

test("canRequestCode: nomor tidak cocok", () => {
  const r = canRequestCode({
    registeredPhone: "+628111111111",
    claimedPhone: "081234567890",
    attempts: 0,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "phone_mismatch")
})

test("canRequestCode: cocok", () => {
  const r = canRequestCode({
    registeredPhone: "+6281234567890",
    claimedPhone: "0812-3456-7890",
    attempts: 0,
  })
  assert.equal(r.ok, true)
})

test("checkVerification: kode kedaluwarsa", () => {
  const now = 1_000_000_000
  const r = checkVerification({
    registeredPhone: "+6281234567890",
    claimedPhone: "081234567890",
    codeIssuedAt: now - CODE_TTL_MS - 1,
    attempts: 0,
    now,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "expired")
})

test("checkVerification: percobaan habis", () => {
  const now = 1_000_000_000
  const r = checkVerification({
    registeredPhone: "+6281234567890",
    claimedPhone: "081234567890",
    codeIssuedAt: now,
    attempts: MAX_CODE_ATTEMPTS,
    now,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "too_many_attempts")
})

test("canAccessProfile: sesi masih berlaku", () => {
  const now = 1_000_000_000
  const r = canAccessProfile({
    registeredPhone: "+6281234567890",
    senderPhone: "081234567890",
    verifiedAt: now - 60_000,
    now,
  })
  assert.equal(r.ok, true)
})

test("canAccessProfile: sesi kedaluwarsa", () => {
  const now = 1_000_000_000
  const r = canAccessProfile({
    registeredPhone: "+6281234567890",
    senderPhone: "081234567890",
    verifiedAt: now - 25 * 60 * 60_000,
    now,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "expired")
})

test("canAccessProfile: nomor pengirim beda", () => {
  const now = 1_000_000_000
  const r = canAccessProfile({
    registeredPhone: "+6281234567890",
    senderPhone: "081200000000",
    verifiedAt: now,
    now,
  })
  assert.equal(r.ok, false)
  assert.equal(r.reason, "phone_mismatch")
})

// ---------- guard ----------

const priceEvidence = [{ name: "quote", data: { Signature: 2_500_000, Prestige: 4_000_000 } }]

test("guard: harga yang ada di tool lolos", () => {
  const r = validateReply({
    reply: "Signature Rp 2.500.000 ya Kak, atau Prestige Rp 4.000.000.",
    evidence: priceEvidence,
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: harga karangan ditolak", () => {
  const r = validateReply({ reply: "Prestige cuma Rp 3.000.000 Kak.", evidence: priceEvidence })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "ungrounded_price"))
})

test("guard: harga tanpa tool ditolak", () => {
  const r = validateReply({ reply: "Harganya 2,5 juta ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "ungrounded_price"))
})

test("guard: 'selesai dalam hitungan menit' bukan deadline", () => {
  const r = validateReply({
    reply: "Kalau data diisi sendiri, undangan bisa selesai dalam hitungan menit setelah data lengkap.",
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: 'belum bisa dijamin' bukan klaim jaminan", () => {
  const r = validateReply({
    reply: "Kuotanya belum bisa dijamin sampai registrasi berhasil, Kak.",
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: 'dijamin selesai' tetap ditolak", () => {
  const r = validateReply({ reply: "Dijamin selesai besok ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "guarantee_claim"))
})

test("guard: klaim nett tanpa bukti ditolak", () => {
  const r = validateReply({ reply: "Harga kami sudah nett ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "policy_claim"))
})

test("guard: klaim nett dengan bukti lolos", () => {
  const r = validateReply({
    reply: "Harga kami sudah nett ya Kak.",
    evidence: [{ name: "pricing_policy", data: { nett: true } }],
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: klaim 1 link 2 orang tanpa bukti ditolak", () => {
  const r = validateReply({ reply: "Bisa Kak, satu link bisa untuk dua orang." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "capability_claim"))
})

test("guard: klaim 1 link 2 orang dengan bukti lolos", () => {
  const r = validateReply({
    reply: "Bisa Kak, satu link bisa untuk dua orang.",
    evidence: [{ name: "guest_link", data: { multi_guest_link: true } }],
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: nomor HP orang lain ditolak", () => {
  const r = validateReply({
    reply: "Nomor tamunya 081234567890 ya Kak.",
    verifiedPhone: "+628999999999",
  })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "pii_phone"))
})

test("guard: nomor sendiri boleh", () => {
  const r = validateReply({
    reply: "Nomor terdaftar Kakak 081234567890 ya.",
    verifiedPhone: "+6281234567890",
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: domain asing ditolak", () => {
  const r = validateReply({ reply: "Cek di https://aksaraa-invitation.com ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "bad_link"))
})

test("guard: domain resmi lolos", () => {
  const r = validateReply({ reply: "Lihat di https://wedding.aksaraa.com/templates ya Kak." })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: 3 link dalam satu paragraf ditolak", () => {
  const r = validateReply({
    reply:
      "Ada Minang https://wedding.aksaraa.com/templates/minang-royal/preview, Melayu https://wedding.aksaraa.com/templates/adat-melayu/preview, dan Jawa https://wedding.aksaraa.com/templates/adat-jawa/preview.",
  })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "list_not_formatted"))
})

test("guard: 3 link sebagai daftar poin lolos", () => {
  const r = validateReply({
    reply:
      "Ada 3, Kak:\n• Minang Royal — https://wedding.aksaraa.com/templates/minang-royal/preview\n• Adat Melayu — https://wedding.aksaraa.com/templates/adat-melayu/preview\n• Adat Jawa — https://wedding.aksaraa.com/templates/adat-jawa/preview",
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: kode voucher tidak boleh disebut tanpa diminta", () => {
  const r = validateReply({
    reply: "Ada AKSARAA-RACEOGL7 untuk semua paket.",
    expectNoVoucherCodes: true,
  })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "voucher_code_leak"))
})

test("guard: narasi potongan tanpa kode lolos", () => {
  const r = validateReply({
    reply:
      "Saat ini ada potongan Rp 50.000 untuk semua paket, dan 10% untuk paket Signature. Bisa dipilih saat registrasi.",
    evidence: [{ discount: 50000 }],
    expectNoVoucherCodes: true,
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: kode boleh kalau klien yang mengirim", () => {
  const r = validateReply({
    reply: "CTK01 masih berlaku, potongan Rp 50.000.",
    evidence: [{ amount: 50000 }],
    expectNoVoucherCodes: false,
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: 'Sistem' sebagai nama paket boleh, 'sistem' internal ditolak", () => {
  const ok = validateReply({ reply: "Voucher berlaku untuk paket Buku Tamu Sistem dan Pro." })
  assert.equal(ok.ok, true, JSON.stringify(ok.violations))

  const bad = validateReply({ reply: "Aku cek dulu ke sistem ya Kak." })
  assert.equal(bad.ok, false)
  assert.ok(bad.violations.some((v) => v.code === "bureaucratic_phrase"))
})

test("guard: istilah internal ditolak", () => {
  const r = validateReply({ reply: "Aku ambil dari database dulu ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "internal_leak"))
})

test("guard: 'Rp 2.500.000 Kak' tidak dianggap miliaran", () => {
  const r = validateReply({
    reply: "Harganya Rp 2.500.000 Kak.",
    evidence: priceEvidence,
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: '299k' tetap dibaca 299 ribu", () => {
  const r = validateReply({
    reply: "Harganya 299k ya Kak.",
    evidence: [{ name: "quote", data: { total: 299000 } }],
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: konteks harga tanpa nominal ditolak", () => {
  const r = validateReply({
    reply: "Oke, harga paket Signature sudah aku cek ya Kak.",
    evidence: priceEvidence,
    expectPrice: true,
  })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "missing_price"))
})

test("guard: konteks harga dengan nominal lolos", () => {
  const r = validateReply({
    reply: "Paket Signature Rp 2.500.000 ya Kak.",
    evidence: priceEvidence,
    expectPrice: true,
  })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: frasa administrasi ditolak", () => {
  const r = validateReply({ reply: "Baik, sudah saya catat ya Kak." })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "bureaucratic_phrase"))
})

test("guard: 'aku catat ya' lebih manusiawi dan lolos", () => {
  const r = validateReply({ reply: "Oke, aku catat ya Kak. Bener kan?" })
  assert.equal(r.ok, true, JSON.stringify(r.violations))
})

test("guard: lebih dari satu pertanyaan ditolak", () => {
  const r = validateReply({
    reply: "Harga Signature Rp 2.500.000. Tanggalnya kapan? Tamunya berapa?",
    evidence: priceEvidence,
  })
  assert.equal(r.ok, false)
  assert.ok(r.violations.some((v) => v.code === "too_many_questions"))
})

test("guard: balasan kepanjangan hanya warning", () => {
  const long = Array.from({ length: 120 }, () => "kata").join(" ")
  const r = validateReply({ reply: long })
  assert.equal(r.ok, true)
  assert.ok(r.violations.some((v) => v.code === "too_long" && v.severity === "warn"))
})

test("guard: balasan kosong ditolak", () => {
  assert.equal(validateReply({ reply: "   " }).ok, false)
})

// ---------- profile fields ----------

test("field: display_name valid", () => {
  const r = validateField("display_name", "Rafi & Novi")
  assert.equal(r.ok, true)
})

test("field: display_name terlalu pendek", () => {
  const r = validateField("display_name", "A")
  assert.equal(r.ok, false)
})

test("field: guest count di luar batas", () => {
  assert.equal(validateField("estimated_guest_count", 0).ok, false)
  assert.equal(validateField("estimated_guest_count", 6000).ok, false)
  assert.equal(validateField("estimated_guest_count", "350").ok, true)
})

test("field: instagram membuang @", () => {
  const r = validateField("groom_instagram", "@rafi.wedding")
  assert.equal(r.ok, true)
  if (r.ok) assert.equal(r.value, "rafi.wedding")
})

test("field: instagram tidak valid", () => {
  assert.equal(validateField("groom_instagram", "rafi saputra!").ok, false)
})

test("field: sesi acara valid", () => {
  const r = validateField(
    "sessions",
    [
      {
        name: "Akad",
        date: "2026-12-12",
        time: "08:00",
        venue: "Masjid Al Azhar",
        address: "Jl. Sisingamangaraja, Jakarta Selatan",
        maps_url: "https://maps.google.com/?q=masjid",
      },
    ],
    NOW
  )
  assert.equal(r.ok, true, r.ok ? "" : r.message)
})

test("field: sesi acara di masa lalu ditolak", () => {
  const r = validateField(
    "sessions",
    [{ name: "Akad", date: "2025-01-01", time: "08:00", venue: "Masjid", address: "Jl. Contoh No. 1" }],
    NOW
  )
  assert.equal(r.ok, false)
})

test("field: jam acara salah format", () => {
  const r = validateField(
    "sessions",
    [{ name: "Akad", date: "2026-12-12", time: "8 pagi", venue: "Masjid", address: "Jl. Contoh No. 1" }],
    NOW
  )
  assert.equal(r.ok, false)
})

test("field: link maps bukan google ditolak", () => {
  const r = validateField(
    "sessions",
    [
      {
        name: "Akad",
        date: "2026-12-12",
        time: "08:00",
        venue: "Masjid",
        address: "Jl. Contoh No. 1",
        maps_url: "https://evil.example.com/maps",
      },
    ],
    NOW
  )
  assert.equal(r.ok, false)
})

test("field: paket tidak boleh ditulis bot", () => {
  const r = validateField("package_type", "elite")
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.code, "forbidden_field")
})

test("field: tanggal undangan tidak boleh ditulis bot", () => {
  const r = validateField("estimated_wedding_date", "2026-12-12")
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.code, "forbidden_field")
})

test("field: status pembayaran tidak boleh ditulis bot", () => {
  assert.equal(validateField("payment_status", "FULLY_PAID").ok, false)
})

test("draft: applyAnswer menggabungkan", () => {
  const r = applyAnswer({}, "display_name", "Rafi & Novi", NOW)
  assert.equal(r.ok, true)
  if (!r.ok) return
  const draft = r.value
  assert.equal(draft.display_name, "Rafi & Novi")
})

test("draft: nextQuestion melewati field yang sudah ada", () => {
  const next = nextQuestion({ display_name: "Rafi & Novi" })
  assert.ok(next)
  assert.notEqual(next.key, "display_name")
})

test("draft: patch men-stringify inviting_families", () => {
  const { patch } = buildPatch({ inviting_families: ["Keluarga Bapak Sutanto", "Keluarga Ibu Hartini"] })
  assert.equal(typeof patch.inviting_families, "string")
  assert.deepEqual(JSON.parse(patch.inviting_families), [
    "Keluarga Bapak Sutanto",
    "Keluarga Ibu Hartini",
  ])
})

test("draft: patch menolak field terlarang", () => {
  const result = buildPatch({ package_type: "elite", display_name: "Rafi & Novi" })
  assert.equal(result.ok, false)
  assert.deepEqual(result.rejected, ["package_type"])
  assert.equal(result.patch.package_type, undefined)
})

test("draft: field yang butuh konfirmasi", () => {
  assert.equal(requiresConfirmation("sessions"), true)
  assert.equal(requiresConfirmation("display_name"), false)
})

// ---------- filter kategori template ----------

test("template: 'adat' cocok dengan Adat/Tradisional, Adat, dan Budaya", () => {
  assert.equal(matchesTemplateCategory({ category: "Adat/Tradisional" }, "adat"), true)
  assert.equal(matchesTemplateCategory({ category: "Adat" }, "adat"), true)
  assert.equal(matchesTemplateCategory({ category: "Budaya" }, "adat"), true)
})

test("template: 'adat' tidak cocok dengan Floral", () => {
  assert.equal(matchesTemplateCategory({ category: "Floral" }, "adat"), false)
})

test("template: 'modern' cocok dengan Modern Minimalis", () => {
  assert.equal(matchesTemplateCategory({ category: "Modern Minimalis" }, "modern"), true)
})

test("template: 'interaktif' cocok dengan Undangan Interaksi", () => {
  assert.equal(matchesTemplateCategory({ category: "Undangan Interaksi" }, "interaktif"), true)
})

test("template: tanpa filter mengembalikan semua", () => {
  assert.equal(matchesTemplateCategory({ category: "Floral" }, ""), true)
})

test("template: placeholder 'Template-2' disaring", () => {
  assert.equal(isPlaceholderTemplate("Template-2"), true)
  assert.equal(isPlaceholderTemplate("Adat Jawa"), false)
  assert.equal(isPlaceholderTemplate("Cinnabar Seal"), false)
})

test("template: 'adat batak' mengenali Sai Horas", () => {
  assert.equal(matchesTemplateCategory({ name: "Sai Horas", category: "Adat/Tradisional" }, "adat batak"), true)
  assert.equal(matchesTemplateCategory({ name: "Minang Royal", category: "Adat/Tradisional" }, "adat batak"), false)
})

test("template: 'adat jawa' hanya cocok dengan Jawa", () => {
  assert.equal(matchesTemplateCategory({ name: "Adat Jawa" }, "adat jawa"), true)
  assert.equal(matchesTemplateCategory({ name: "Adat Melayu" }, "adat jawa"), false)
})

test("teks: penanda daftar dibersihkan dari aksara asing", () => {
  assert.equal(sanitizeReply("•\u0945 Adat Jawa"), "• Adat Jawa")
  assert.equal(sanitizeReply("• Minang Royal"), "• Minang Royal")
})

test("teks: karakter tak terlihat dihapus", () => {
  assert.equal(sanitizeReply("Halo\u200B Kak"), "Halo Kak")
})

test("katalog: paket bonus/cetak tidak dijual", () => {
  assert.equal(isSellablePackage("signature"), true)
  assert.equal(isSellablePackage("essential"), true)
  assert.equal(isSellablePackage("cetak_undangan_bonus"), false)
  assert.equal(isSellablePackage("bonus_full_custom"), false)
})

test("katalog: fitur undangan fisik disembunyikan", () => {
  assert.equal(isCustomerFeature("wish_wall"), true)
  assert.equal(isCustomerFeature("undangan_fisik"), false)
})

test("policies: default dipakai kalau belum diatur", () => {
  const resolved = resolvePolicies(null)
  assert.equal(resolved.timelineSelf, POLICIES.timelineSelf)
  assert.equal(resolved.timelineAssisted, POLICIES.timelineAssisted)
})

test("policies: bisa dioverride dari guardrails", () => {
  const resolved = resolvePolicies({ timeline_self: "Paling cepat 10 menit." })
  assert.equal(resolved.timelineSelf, "Paling cepat 10 menit.")
  assert.equal(resolved.timelineAssisted, POLICIES.timelineAssisted)
})

test("policies: teks menyebut hitungan menit", () => {
  assert.match(formatPolicies(POLICIES), /hitungan menit/)
})

// ---------- widget CS hanya di halaman marketing ----------

test("widget: halaman marketing menampilkan", () => {
  for (const path of [
    "/",
    "/hero",
    "/templates",
    "/templates/kategori/adat",
    "/design",
    "/premium-web-invitation",
    "/qr-digital-buku-tamu",
    "/virtual-wish-wall",
    "/reminder-tamu-vip",
    "/galeri-kenangan-tamu",
    "/fitur",
    "/fitur/wish-wall",
    "/artikel",
    "/artikel/harga-undangan-digital-2026",
    "/portofolio",
    "/portofolio/contoh-undangan",
    "/checklist-nikah",
    "/kalkulator-budget",
  ]) {
    assert.equal(csWidgetEnabledOn(path), true, path)
  }
})

test("widget: halaman app/auth/undangan tidak menampilkan", () => {
  for (const path of [
    "/dashboard",
    "/dashboard/abc",
    "/ops/cs",
    "/login",
    "/register",
    "/daftar",
    "/customize",
    "/preview/abc",
    "/scanner/rafi-novi",
    "/w/rafi-novi",
    "/led/rafi-novi",
    "/qr/rafi-novi",
    "/qr-print/abc",
    "/welcome/abc",
    "/g/abc",
    "/q/abc",
    "/api/cs/chat",
    "/templatesX",
    "/artikelX",
  ]) {
    assert.equal(csWidgetEnabledOn(path), false, path)
  }
})

test("widget: trailing slash tidak mengubah keputusan", () => {
  assert.equal(csWidgetEnabledOn("/templates/"), true)
  assert.equal(csWidgetEnabledOn("/fitur/wish-wall/"), true)
  assert.equal(csWidgetEnabledOn("/dashboard/"), false)
  assert.equal(csWidgetEnabledOn("/register/"), false)
  assert.equal(csWidgetEnabledOn(""), true)
})

// ---------- percakapan web: strike + nada ----------

test("sentiment: nada klien terdeteksi", () => {
  assert.equal(detectSentiment("halo kak, mau tanya paket"), "neutral")
  assert.equal(detectSentiment("kok gini sih kak, lama banget"), "frustrated")
  assert.equal(detectSentiment("ini tipu ya"), "angry")
  assert.equal(detectSentiment(""), "neutral")
})

test("strike: hitung balasan unknown berturut-turut", () => {
  assert.equal(
    countUnknownStrikes([
      { direction: "in", intent: null },
      { direction: "out", intent: "unknown" },
      { direction: "in", intent: null },
      { direction: "out", intent: "unknown" },
    ]),
    2
  )
  assert.equal(
    countUnknownStrikes([
      { direction: "out", intent: "unknown" },
      { direction: "in", intent: null },
      { direction: "out", intent: "price" },
    ]),
    0
  )
  assert.equal(countUnknownStrikes([]), 0)
})

test("decide: unknown berulang dieskalasi", () => {
  const d = decide("unknown", { ...ctx, strikeCount: 2 })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "low_confidence")
})

test("decide: unknown saat klien marah dieskalasi", () => {
  const d = decide("unknown", { ...ctx, sentiment: "angry" })
  assert.equal(d.action, "escalate")
  assert.equal(d.reason, "low_confidence")
})

// ---------- knowledge base + sitasi ----------

test("knowledge: HTML dipecah per heading", () => {
  const chunks = htmlToChunks(
    "<p>Pembuka yang cukup panjang untuk lolos penyaring potongan pertama ini.</p><h2>Bagian A</h2><p>Isi bagian A juga cukup panjang supaya tidak dibuang oleh penyaring.</p>"
  )
  assert.equal(chunks.length, 2)
  assert.equal(chunks[0].heading, null)
  assert.equal(chunks[1].heading, "Bagian A")
  assert.ok(!chunks[1].content.includes("<p>"))
})

test("knowledge: stripHtml membuang tag dan entity", () => {
  assert.equal(stripHtml("<p>Halo&nbsp;<strong>Kak</strong></p>").trim(), "Halo Kak")
})

test("knowledge: nominal dibuang dari korpus", () => {
  const cleaned = stripMoney("Harga Rp 299.000 dan 1,5 juta rupiah, DP 500rb.")
  assert.ok(!/\d/.test(cleaned), cleaned)
  assert.match(cleaned, /nominal sesuai paket/)
})

test("knowledge: tokenize memetakan sinonim", () => {
  const tokens = tokenize("biaya undangan buat tamu")
  assert.ok(tokens.includes("harga"), tokens.join(","))
  assert.ok(tokens.includes("tamu"))
})

test("knowledge: retrieval memilih dokumen yang tepat", () => {
  const chunks = [
    {
      title: "Musik latar",
      url: null,
      heading: "Lagu",
      content: "Undangan bisa memutar musik latar yang dipilih dari daftar lagu.",
    },
    {
      title: "Pembayaran",
      url: null,
      heading: "Transfer",
      content: "Pembayaran dilakukan dengan transfer bank, lalu bukti bayar dikirim ke tim.",
    },
  ]
  const top = retrieveKnowledge(chunks, "cara bayar gimana kak")
  assert.equal(top[0].title, "Pembayaran")
  assert.equal(retrieveKnowledge(chunks, "zzz qqq").length, 0)
})

test("knowledge: satu potongan per dokumen", () => {
  const chunks = [
    { title: "Sama", url: null, heading: "A", content: "musik latar lagu undangan audio pilihan" },
    { title: "Sama", url: null, heading: "B", content: "musik latar lagu undangan audio pilihan" },
    { title: "Lain", url: null, heading: "C", content: "musik latar lagu undangan audio pilihan" },
  ]
  const top = retrieveKnowledge(chunks, "musik", { limit: 3 })
  assert.equal(top.length, 2)
})

test("knowledge: sitasi memuat judul dan url", () => {
  assert.equal(
    citationLine({ title: "Cara daftar", url: "https://wedding.aksaraa.com/register" }),
    "\n\nSumber: Cara daftar (https://wedding.aksaraa.com/register)"
  )
  assert.equal(citationLine({ title: "Tanpa URL", url: null }), "\n\nSumber: Tanpa URL")
})

test("knowledge: kurasi FAQ bebas nominal", () => {
  for (const entry of CS_KNOWLEDGE) {
    for (const chunk of entry.chunks) {
      assert.ok(!/rp\.?\s*\d/i.test(chunk.content), `${entry.key}: ${chunk.content}`)
      assert.ok(!/\b0\d{8,}\b/.test(chunk.content), `${entry.key}: nomor telepon`)
    }
  }
})

// ---------- alur bantu isi undangan ----------

test("onboarding: nama template cocok exact dan partial", () => {
  const templates = [
    { id: "1", name: "Taj Romance", code: "template-32" },
    { id: "2", name: "Adat Bugis", code: "adat-bugis" },
    { id: "3", name: "Adat Bali", code: "adat-bali" },
  ]
  assert.equal(matchTemplateByName("taj romance", templates).match?.id, "1")
  assert.equal(matchTemplateByName("bugis", templates).match?.id, "2")
  const ambiguous = matchTemplateByName("adat", templates)
  assert.equal(ambiguous.match, null)
  assert.equal(ambiguous.candidates.length, 2)
  assert.equal(matchTemplateByName("zzz", templates).match, null)
})

test("onboarding: jawaban divalidasi sesuai tipe", () => {
  assert.equal(validateFlowAnswer({ key: "x", label: "", question: "", kind: "date" }, "2026-12-12").ok, true)
  assert.equal(validateFlowAnswer({ key: "x", label: "", question: "", kind: "date" }, "12/12/2026").ok, false)
  assert.equal(validateFlowAnswer({ key: "x", label: "", question: "", kind: "time" }, "08:00").ok, true)
  assert.equal(validateFlowAnswer({ key: "x", label: "", question: "", kind: "time" }, "8 pagi").ok, false)
  assert.equal(validateFlowAnswer({ key: "x", label: "", question: "", kind: "url" }, "youtube.com/x").ok, false)
  assert.equal(validateFlowAnswer({ key: "x", label: "", question: "", kind: "url" }, "https://youtube.com/x").ok, true)
})

test("onboarding: field opsional bisa dilewati", () => {
  const optional = { key: "x", label: "", question: "", kind: "text", optional: true }
  assert.equal(isSkip("lewati"), true)
  assert.equal(validateFlowAnswer(optional, "lewati").ok, true)
  assert.equal(validateFlowAnswer(optional, "lewati").value, undefined)
})

test("onboarding: daftar dipisah koma/tanpa kata sambung", () => {
  const field = { key: "x", label: "", question: "", kind: "list" }
  assert.deepEqual(validateFlowAnswer(field, "Keluarga A, Keluarga B dan Keluarga C").value, [
    "Keluarga A",
    "Keluarga B",
    "Keluarga C",
  ])
})

test("onboarding: keluhan dipetakan ke bagian", () => {
  assert.equal(mapSectionFromText("fotonya ganti"), "galeri")
  assert.equal(mapSectionFromText("nama mempelai salah"), "profile")
  assert.equal(mapSectionFromText("tanggal acara keliru"), "acara")
  assert.equal(mapSectionFromText("foto sampul"), "sampul")
  assert.equal(mapSectionFromText("apa aja"), null)
})

test("onboarding: setiap bagian punya field atau manual", () => {
  for (const [key, spec] of Object.entries(SECTION_SPECS)) {
    assert.ok(spec.fields.length > 0 || !!spec.manual, key)
    for (const field of spec.fields) {
      assert.ok(field.question.length > 5, `${key}.${field.key}`)
      assert.ok(field.label.length > 0, `${key}.${field.key}`)
    }
  }
})

// ---------- sesi acara: validasi per sub-field ----------

test("sesi: jam rentang diterima, tanggal lampau ditolak", () => {
  const now = new Date("2026-11-19T00:00:00")
  assert.equal(validateSessionField("time", "08:00", now).ok, true)
  assert.equal(validateSessionField("time", "10:00-11:00", now).ok, true)
  assert.equal(validateSessionField("time", "8 pagi", now).ok, false)
  assert.equal(validateSessionField("date", "2026-12-03", now).ok, true)
  assert.equal(validateSessionField("date", "2026-09-24", now).ok, false)
  assert.equal(validateSessionField("date", "03/12/2026", now).ok, false)
  assert.equal(validateSessionField("date", "2026-12-03").ok, true)
})

test("sesi: link maps harus Google Maps", () => {
  assert.equal(validateSessionField("maps_url", "https://maps.app.goo.gl/abc").ok, true)
  assert.equal(validateSessionField("maps_url", "https://www.google.com/maps?q=medan").ok, true)
  assert.equal(validateSessionField("maps_url", "gagsgaga").ok, false)
  assert.equal(validateSessionField("maps_url", "https://example.com/maps").ok, false)
})

// ---------- sitasi relevan ----------

test("sitasi: hanya ditempel kalau sumbernya nyambung", () => {
  const templateSource = {
    heading: "Ganti template",
    content: "Template bisa diganti dari dashboard tanpa mengulang data yang sudah diisi.",
  }
  assert.equal(
    isCitationRelevant("Untuk ganti template, buka dashboard lalu pilih template baru.", templateSource),
    true
  )
  assert.equal(
    isCitationRelevant("Ceriavite dibuat untuk khitanan, aqiqah, dan ulang tahun.", templateSource),
    false
  )
})

test("knowledge: Ceriavite ada dan tanpa nominal", () => {
  const entry = CS_KNOWLEDGE.find((item) => item.key === "ceriavite")
  assert.ok(entry, "entry ceriavite wajib ada")
  assert.match(entry.url, /ceriavite\.aksaraa\.com/)
  const text = entry.chunks.map((c) => c.content).join(" ")
  assert.ok(!/\brp/i.test(text))
})

test("onboarding: field wajib menolak 'lewati'", () => {
  const required = { key: "groom_full_name", label: "Nama", question: "", kind: "text" }
  const result = validateFlowAnswer(required, "lewati")
  assert.equal(result.ok, false)
})

test("onboarding: pertanyaan dikenali, jawaban biasa tidak", () => {
  assert.equal(looksLikeQuestion("berapa harganya?"), true)
  assert.equal(looksLikeQuestion("maksudnya apa"), true)
  assert.equal(looksLikeQuestion("Akad Nikah"), false)
  assert.equal(looksLikeQuestion("2027-06-12"), false)
})

test("kutipan: pilihan populer + jawaban ragu", () => {
  assert.equal(POPULAR_QUOTES.length >= 2, true)
  assert.match(POPULAR_QUOTES[0].source, /Ar-Rum/)
  assert.equal(isUncertainAnswer("terserah"), true)
  assert.equal(isUncertainAnswer("tidak ada"), true)
  assert.equal(isUncertainAnswer("gak tau"), true)
  assert.equal(isUncertainAnswer("QS. Ar-Rum: 21"), false)
})

test("kutipan: pertanyaan menawarkan opsi populer", () => {
  const question = SECTION_SPECS.kutipan.fields[0].question
  assert.match(question, /1/)
  assert.match(question, /terserah/i)
})

test("skip: variasi bahasa klien dikenali", () => {
  for (const text of [
    "lewati",
    "lewati juga",
    "skip aja",
    "tidak pakai",
    "ga pakai",
    "gak pake",
    "nggak punya",
    "belum ada",
    "tidak punya ig",
    "no",
  ]) {
    assert.equal(isSkip(text), true, text)
  }
  assert.equal(isSkip("novi_salsabila"), false)
  assert.equal(isSkip("@novi"), false)
})
