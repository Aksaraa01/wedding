import test from "node:test"
import assert from "node:assert/strict"

import { formatTemplateReply, normalizeDemoUrl } from "../src/lib/cs/templateListReply.ts"

test("normalizeDemoUrl: URL absolut dipertahankan", () => {
  assert.equal(
    normalizeDemoUrl("https://demo.example.com/x", "iris", "https://wedding.aksaraa.com"),
    "https://demo.example.com/x"
  )
})

test("normalizeDemoUrl: path relatif dan kosong dilengkapi", () => {
  const base = "https://wedding.aksaraa.com"
  assert.equal(
    normalizeDemoUrl("/templates/iris/preview", "iris", base),
    "https://wedding.aksaraa.com/templates/iris/preview"
  )
  assert.equal(
    normalizeDemoUrl("templates/iris/preview", "iris", base),
    "https://wedding.aksaraa.com/templates/iris/preview"
  )
  assert.equal(
    normalizeDemoUrl("", "iris-sage", base),
    "https://wedding.aksaraa.com/templates/iris-sage/preview"
  )
  assert.equal(
    normalizeDemoUrl(null, "luna", base),
    "https://wedding.aksaraa.com/templates/luna/preview"
  )
})

test("formatTemplateReply: maksimal 3 template berurutan dengan nama dan demo link", () => {
  const text = formatTemplateReply({
    category_filter: "Modern",
    total_matches: 5,
    templates: [
      { name: "Iris", category: "Modern", demo_url: "https://wedding.aksaraa.com/templates/iris/preview" },
      { name: "Luna", category: "Modern", demo_url: "https://wedding.aksaraa.com/templates/luna/preview" },
      { name: "Moss", category: "Modern", demo_url: "https://wedding.aksaraa.com/templates/moss/preview" },
      { name: "Noir", category: "Modern", demo_url: "https://wedding.aksaraa.com/templates/noir/preview" },
    ],
    inactive_matches: [],
  })

  assert.ok(text)
  assert.match(text || "", /Iris \(Modern\) — https:\/\/wedding\.aksaraa\.com\/templates\/iris\/preview/)
  assert.match(text || "", /Luna \(Modern\) — https:\/\/wedding\.aksaraa\.com\/templates\/luna\/preview/)
  assert.match(text || "", /Moss \(Modern\) — https:\/\/wedding\.aksaraa\.com\/templates\/moss\/preview/)
  assert.doesNotMatch(text || "", /Noir/)
  assert.match(text || "", /pilihan lain/i)
})

test("formatTemplateReply: kosong tanpa inactive memberi respon informatif", () => {
  const text = formatTemplateReply({
    category_filter: "Adat",
    total_matches: 0,
    templates: [],
    inactive_matches: [],
  })

  assert.ok(text)
  assert.match(text || "", /Adat/)
  assert.match(text || "", /belum menemukan/i)
})

test("formatTemplateReply: inactive_matches disebut tanpa link", () => {
  const text = formatTemplateReply({
    category_filter: "(semua)",
    total_matches: 0,
    templates: [],
    inactive_matches: [{ name: "Aruna", category: "Adat" }],
  })

  assert.ok(text)
  assert.match(text || "", /Aruna/)
  assert.match(text || "", /belum tersedia/i)
  assert.doesNotMatch(text || "", /https?:\/\//)
})
