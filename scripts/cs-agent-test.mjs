import test from "node:test"
import assert from "node:assert/strict"

import { runAgentLoop } from "../src/lib/cs/agentLoop.ts"
import { buildSystemPrompt } from "../src/lib/cs/prompt.ts"
import { escalationReply, refuseReply, verifyRequiredReply } from "../src/lib/cs/replies.ts"
import { BOUNDARIES } from "../src/lib/cs/policy.ts"

function fakeChat(responses) {
  let index = 0
  return async () => {
    const message = responses[Math.min(index, responses.length - 1)]
    index += 1
    return {
      message,
      promptTokens: 10,
      completionTokens: 5,
      model: "fake/model",
      finishReason: message.finishReason || "stop",
    }
  }
}

function toolCall(id, name, args) {
  return { id, type: "function", function: { name, arguments: JSON.stringify(args) } }
}

const base = {
  system: "sistem",
  history: [],
  userText: "berapa harga signature?",
  ctx: {},
  model: "fake/model",
  maxWords: 90,
  tools: [],
}

test("loop: tool dipanggil lalu jawaban grounded lolos", async () => {
  const result = await runAgentLoop({
    ...base,
    deps: {
      chat: fakeChat([
        { role: "assistant", content: null, tool_calls: [toolCall("c1", "quote_price", { package_code: "signature" })] },
        { role: "assistant", content: "Signature Rp 2.500.000 ya Kak, mau aku bantu bandingkan?" },
      ]),
      runTool: async () => ({ data: { total: 2500000 }, evidence: { total: 2500000 } }),
    },
  })

  assert.equal(result.guarded, true, JSON.stringify(result.violations))
  assert.deepEqual(result.toolNames, ["quote_price"])
  assert.match(result.text, /Rp 2\.500\.000/)
})

test("loop: data prefetch dipakai walau model tidak memanggil tool", async () => {
  const result = await runAgentLoop({
    ...base,
    prefetched: [{ name: "get_price_book", data: { packages: [{ code: "signature", price: 2500000 }] } }],
    deps: {
      chat: fakeChat([{ role: "assistant", content: "Signature Rp 2.500.000 ya Kak." }]),
      runTool: async () => ({ data: {}, evidence: {} }),
    },
  })

  assert.equal(result.guarded, true, JSON.stringify(result.violations))
  assert.ok(result.toolNames.includes("get_price_book"))
})

test("loop: harga tanpa tool ditolak lalu fallback", async () => {
  const result = await runAgentLoop({
    ...base,
    deps: {
      chat: fakeChat([
        { role: "assistant", content: "Prestige cuma Rp 3.000.000 Kak." },
        { role: "assistant", content: "Prestige cuma Rp 3.000.000 Kak." },
      ]),
      runTool: async () => ({ data: {}, evidence: {} }),
    },
  })

  assert.equal(result.guarded, false)
  assert.ok(result.violations.includes("ungrounded_price"))
  assert.match(result.text, /cek dulu ke tim/)
})

test("loop: retry setelah dikoreksi bisa lolos", async () => {
  const result = await runAgentLoop({
    ...base,
    deps: {
      chat: fakeChat([
        { role: "assistant", content: "Harganya 9 juta Kak." },
        { role: "assistant", content: "Boleh aku cek dulu ke tim ya Kak?" },
      ]),
      runTool: async () => ({ data: {}, evidence: {} }),
    },
  })

  assert.equal(result.guarded, true)
  assert.match(result.text, /cek dulu ke tim/)
})

test("loop: jawaban tanpa angka tidak butuh tool", async () => {
  const result = await runAgentLoop({
    ...base,
    deps: {
      chat: fakeChat([{ role: "assistant", content: "Halo Kak, aku bantu cek ya. Mau tanya bagian mana?" }]),
      runTool: async () => ({ data: {}, evidence: {} }),
    },
  })

  assert.equal(result.guarded, true)
  assert.deepEqual(result.toolNames, [])
})

test("loop: tool berulang berhenti di batas langkah lalu fallback", async () => {
  const call = { role: "assistant", content: null, tool_calls: [toolCall("c1", "get_price_book", {})] }
  const result = await runAgentLoop({
    ...base,
    deps: {
      chat: fakeChat([call, call, call, call]),
      runTool: async () => ({ data: { packages: [] }, evidence: { packages: [] } }),
    },
  })

  assert.equal(result.guarded, false)
  assert.ok(result.toolNames.length >= 3)
  assert.match(result.text, /cek dulu ke tim/)
})

test("loop: balasan terpotong ditolak lalu fallback", async () => {
  const result = await runAgentLoop({
    ...base,
    deps: {
      chat: fakeChat([
        { role: "assistant", content: "Oke Kak, CTK01 masih berlaku dan bisa dipakai untuk potongan Rp 50.000 di semua paket. Kalau mau pakai, voucher dimasukkan", finishReason: "length" },
        { role: "assistant", content: "Oke Kak, CTK01 masih berlaku. Mau aku bantu pakai saat daftar?", finishReason: "length" },
      ]),
      runTool: async () => ({ data: {}, evidence: {} }),
    },
  })
  assert.equal(result.guarded, false)
  assert.ok(result.violations.includes("truncated_reply"))
})

test("prompt: memuat batas, status pelanggan, dan arahan", () => {
  const prompt = buildSystemPrompt({
    nowIso: "3 November 2026",
    verified: false,
    hasProfile: false,
    directive: 'Panggil tool "quote_price" sebelum menjawab.',
    maxWords: 60,
  })

  assert.ok(prompt.includes("belum terverifikasi"))
  assert.ok(prompt.includes("quote_price"))
  assert.ok(prompt.includes("Maksimal 60 kata"))
  for (const rule of BOUNDARIES) {
    assert.ok(prompt.includes(rule.slice(0, 20)))
  }
})

test("prompt: menyertakan kebijakan layanan", () => {
  const prompt = buildSystemPrompt({
    nowIso: "3 November 2026",
    verified: false,
    hasProfile: false,
    directive: "jawab",
    policyText: "- Estimasi waktu: hitungan menit kalau data diisi sendiri.",
  })
  assert.ok(prompt.includes("KEBIJAKAN LAYANAN"))
  assert.ok(prompt.includes("hitungan menit"))
})

test("prompt: pelanggan terverifikasi dengan profil", () => {
  const prompt = buildSystemPrompt({
    nowIso: "3 November 2026",
    verified: true,
    hasProfile: true,
    directive: "jawab",
  })
  assert.ok(prompt.includes("sudah terverifikasi dan punya profil"))
})

test("replies: setiap alasan eskalasi punya balasan", () => {
  for (const reason of [
    "human_requested",
    "complaint",
    "refund",
    "reschedule",
    "discount",
    "payment",
    "sensitive_data",
    "low_confidence",
    "no_profile",
  ]) {
    const text = escalationReply(reason)
    assert.ok(text.length > 20, reason)
  }
})

test("replies: verifikasi meminta PIN atau nomor terdaftar", () => {
  assert.match(verifyRequiredReply(), /PIN/i)
  assert.match(verifyRequiredReply(), /nomor WhatsApp yang dipakai saat daftar/i)
})

test("replies: penolakan topik di luar", () => {
  assert.match(refuseReply(), /undangan dan layanan Aksaraa/i)
})
