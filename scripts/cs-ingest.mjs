#!/usr/bin/env node
// Ingest knowledge base CS ke Supabase (cs_documents + cs_chunks).
//
//   set -a; source .env.local.prod; set +a
//   node --import ./scripts/register-ts-resolve.mjs --experimental-strip-types scripts/cs-ingest.mjs
//
// Sumber: artikel /artikel (src/data/artikel.ts) + FAQ kurasi
// (src/data/csKnowledge.ts). Nominal rupiah dibuang saat ingest — harga hanya
// boleh datang dari tool. Aman dijalankan berulang (checksum + replace chunks).

import { createHash } from "node:crypto"
import { supabaseAdmin } from "../src/lib/supabase.ts"
import { ARTICLES } from "../src/data/artikel.ts"
import { CS_KNOWLEDGE } from "../src/data/csKnowledge.ts"
import { htmlToChunks, stripMoney } from "../src/lib/cs/knowledge.ts"

const SITE = "https://wedding.aksaraa.com"

function checksumOf(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 32)
}

function buildDocuments() {
  const docs = []

  for (const article of ARTICLES) {
    const chunks = htmlToChunks(article.body).map((chunk) => ({
      heading: chunk.heading,
      content: stripMoney(chunk.content),
    }))
    if (!chunks.length) continue
    docs.push({
      source_type: "article",
      title: article.title,
      url: `${SITE}/artikel/${article.slug}`,
      chunks,
    })
  }

  for (const entry of CS_KNOWLEDGE) {
    const chunks = entry.chunks
      .map((chunk) => ({ heading: chunk.heading, content: stripMoney(chunk.content) }))
      .filter((chunk) => chunk.content.trim().length > 20)
    if (!chunks.length) continue
    docs.push({ source_type: "faq", title: entry.title, url: entry.url, chunks })
  }

  return docs
}

async function main() {
  const docs = buildDocuments()
  if (!docs.length) throw new Error("tidak ada dokumen untuk di-ingest")

  const { data: existing, error } = await supabaseAdmin
    .from("cs_documents")
    .select("id,title,url,checksum")
  if (error) throw error

  // Kunci = judul, bukan URL: beberapa entri KB berbagi URL yang sama
  // (mis. semua ke /premium-web-invitation), dan kunci URL membuat entri baru
  // menimpa dokumen lain alih-alih dibuat.
  const byKey = new Map()
  for (const row of existing || []) byKey.set(row.title, row)

  let inserted = 0
  let updated = 0
  let chunkCount = 0
  const seen = new Set()

  for (const doc of docs) {
    const key = doc.title
    seen.add(key)
    const checksum = checksumOf(
      `${doc.title}\n${doc.chunks.map((chunk) => `${chunk.heading || ""}|${chunk.content}`).join("\n")}`
    )
    let id = byKey.get(key)?.id
    const unchanged = id && byKey.get(key)?.checksum === checksum

    if (!id) {
      const { data, error: insertError } = await supabaseAdmin
        .from("cs_documents")
        .insert({
          source_type: doc.source_type,
          title: doc.title,
          url: doc.url,
          checksum,
          active: true,
        })
        .select("id")
        .single()
      if (insertError) throw insertError
      id = data.id
      inserted += 1
    } else {
      if (!unchanged) {
        const { error: updateError } = await supabaseAdmin
          .from("cs_documents")
          .update({ checksum, active: true, updated_at: new Date().toISOString() })
          .eq("id", id)
        if (updateError) throw updateError
        updated += 1
      } else {
        await supabaseAdmin.from("cs_documents").update({ active: true }).eq("id", id)
      }
    }

    if (unchanged) continue

    // Ganti seluruh chunk dokumen supaya heading/hitungan selalu sinkron.
    const { error: deleteError } = await supabaseAdmin
      .from("cs_chunks")
      .delete()
      .eq("document_id", id)
    if (deleteError) throw deleteError

    const rows = doc.chunks.map((chunk) => ({
      document_id: id,
      heading: chunk.heading,
      content: chunk.content,
      token_count: Math.ceil(chunk.content.split(/\s+/).length * 1.3),
    }))
    const { error: chunkError } = await supabaseAdmin.from("cs_chunks").insert(rows)
    if (chunkError) throw chunkError
    chunkCount += rows.length
  }

  const staleIds = (existing || [])
    .filter((row) => !seen.has(row.url || row.title) && row.id)
    .map((row) => row.id)
  if (staleIds.length) {
    await supabaseAdmin.from("cs_documents").update({ active: false }).in("id", staleIds)
  }

  const { count } = await supabaseAdmin
    .from("cs_chunks")
    .select("id", { count: "exact", head: true })

  console.log(
    `documents: ${docs.length} (insert ${inserted}, update ${updated}, stale ${staleIds.length}) · chunks ditulis ${chunkCount} · total chunk ${count ?? "?"}`
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
