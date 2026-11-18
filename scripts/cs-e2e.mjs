#!/usr/bin/env node
// Uji end-to-end percakapan CS terhadap server yang sedang berjalan.
//
// Pakai:
//   CS_E2E_URL=http://127.0.0.1:3100 node scripts/cs-e2e.mjs
//
// Skrip ini memakai satu sesi cookie, mengirim serangkaian pertanyaan, lalu
// memeriksa apakah balasannya sesuai SOP. Exit code 1 kalau ada yang gagal.

const BASE = (process.env.CS_E2E_URL || "http://127.0.0.1:3100").replace(/\/$/, "")

let cookie = ""

async function chat(text, clientId) {
  const headers = { "content-type": "application/json" }
  if (cookie) headers.cookie = cookie

  const res = await fetch(`${BASE}/api/cs/chat`, {
    method: "POST",
    headers,
    body: JSON.stringify({ text, client_message_id: clientId }),
  })

  const setCookie = res.headers.get("set-cookie")
  if (setCookie) {
    const match = setCookie.match(/cs_session=[^;]+/)
    if (match) cookie = match[0]
  }

  const data = await res.json().catch(() => ({}))
  return { status: res.status, reply: String(data.reply || ""), error: data.error || null }
}

const FALLBACK = "cek dulu ke tim biar jawabannya pasti"

function codeLeak(reply) {
  return /\bAKSARAA-[A-Z0-9]{4,}\b/.test(reply) || /\bCTK\d{2,}\b/.test(reply)
}

const CASES = [
  {
    id: "sapaan",
    text: "halo kak",
    check: (r) => ({
      ok:
        !/tanggal|kota|formulir/i.test(r) &&
        r.toLowerCase().includes("kak") &&
        !r.toLowerCase().includes(FALLBACK),
      why: "sapaan tidak boleh menginterogasi atau jatuh ke fallback",
    }),
  },
  {
    id: "harga",
    text: "paket signature berapa?",
    check: (r) => ({
      ok: /rp\s?[\d.,]+/i.test(r) && /signature/i.test(r) && !/tier/i.test(r) && !r.toLowerCase().includes(FALLBACK),
      why: "harga harus menyebut nominal, bukan 'cek tim' atau 'tier'",
    }),
  },
  {
    id: "template-adat",
    text: "ada template adat?",
    check: (r) => ({
      ok:
        /adat|minang/i.test(r) &&
        /wedding\.aksaraa\.com\/templates\//i.test(r) &&
        !/belum menemukan/i.test(r),
      why: "harus menemukan template adat dan memberi link",
    }),
  },
  {
    id: "template-batak",
    text: "ada template adat batak?",
    check: (r) => ({
      ok: /sai horas|belum tersedia/i.test(r) && !/sai-horas\/preview/i.test(r) && !/belum menemukan|tidak ada template/i.test(r),
      why: "Sai Horas disebut sebagai belum aktif, tanpa link mati",
    }),
  },
  {
    id: "voucher-umum",
    text: "ada voucher ga kak?",
    check: (r) => ({
      ok: /cek dulu|teruskan ke tim|sambungkan ke tim/i.test(r) && !codeLeak(r) && !/kirim.*kode|kode.*kirim/i.test(r),
      why: "voucher umum: diteruskan ke tim, tanpa kode dan tanpa minta kode",
    }),
  },
  {
    id: "voucher-kode",
    text: "voucher CTK01 masih berlaku?",
    check: (r) => ({
      ok: /cek dulu|teruskan ke tim|sambungkan ke tim/i.test(r) && !/berlaku|potongan|diskon/i.test(r),
      why: "klien kirim kode: agent tidak mengadili validitas, diteruskan ke tim",
    }),
  },
  {
    id: "pilih-paket",
    text: "aku mau signature kak",
    check: (r) => ({
      ok:
        /register\?package=signature/i.test(r) &&
        !/kode voucher|kirim.*kode/i.test(r) &&
        !/tanggal|kota/i.test(r) &&
        !r.toLowerCase().includes(FALLBACK),
      why: "paket dipilih: arahkan ke link registrasi paket itu, tanpa tanya voucher",
    }),
  },
  {
    id: "sla",
    text: "berapa lama pengerjaannya?",
    check: (r) => ({
      ok: /hitungan menit|antri|antre|seberapa cepat/i.test(r) && !r.toLowerCase().includes(FALLBACK),
      why: "SLA dijawab dari kebijakan, bukan 'cek tim'",
    }),
  },
  {
    id: "tanpa-cetak",
    text: "ada undangan cetak ga?",
    check: (r) => ({
      ok: /digital/i.test(r) && /belum tersedia|tidak tersedia|hanya|cuma|belum ada|tidak ada|nggak ada/i.test(r) && !/mau cetak|pilih cetak|beli cetak/i.test(r),
      why: "tidak menawarkan undangan cetak",
    }),
  },
  {
    id: "cara-daftar",
    text: "cara daftar gimana?",
    check: (r) => ({
      ok: /register/i.test(r) && /template/i.test(r) && !r.toLowerCase().includes(FALLBACK),
      why: "langkah daftar jelas + link, bukan 'cek tim'",
    }),
  },
  {
    id: "eskalasi",
    text: "minta cs manusia dong",
    check: (r) => ({
      ok: /sambungkan ke tim|tim ya/i.test(r),
      why: "permintaan manusia harus dieskalasi",
    }),
  },
]

const BANNED = [
  "sudah saya catat",
  "telah kami terima",
  "mohon ditunggu",
  "formulir",
  "tier 0",
]

async function main() {
  const health = await fetch(`${BASE}/api/health`).catch(() => null)
  if (!health || !health.ok) {
    console.error(`Server tidak siap di ${BASE}`)
    process.exit(1)
  }

  const results = []
  for (const testCase of CASES) {
    const started = Date.now()
    const { status, reply, error } = await chat(testCase.text, `e2e-${testCase.id}-${Date.now()}`)
    const latency = Date.now() - started

    const assertion = testCase.check(reply)
    const banned = BANNED.filter((phrase) => reply.toLowerCase().includes(phrase))
    const ok = status === 200 && !error && assertion.ok && banned.length === 0

    results.push({ id: testCase.id, ok, why: assertion.why, banned, reply, latency })
  }

  let failed = 0
  for (const result of results) {
    const mark = result.ok ? "✅" : "❌"
    if (!result.ok) failed += 1
    console.log(`${mark} ${result.id} (${result.latency} ms)`)
    console.log(`   ${result.reply.replace(/\n/g, " ") || "(kosong)"}`)
    if (!result.ok) {
      console.log(`   alasan: ${result.why}${result.banned.length ? `; frasa terlarang: ${result.banned.join(", ")}` : ""}`)
    }
    console.log()
  }

  console.log(`${results.length - failed}/${results.length} skenario lulus`)
  process.exit(failed === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
