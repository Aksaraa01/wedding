import { supabaseAdmin } from "@/lib/supabase"
import {
  retrieveKnowledge,
  type KnowledgeChunk,
  type RetrievedSource,
} from "@/lib/cs/knowledge"

// Server-only. Korpus CS kecil (ratusan potongan), jadi seluruh isi di-cache
// sebentar di memori daripada query per giliran percakapan.
const CACHE_MS = 5 * 60_000

let cache: { at: number; chunks: KnowledgeChunk[] } | null = null

export async function getKnowledgeCorpus(): Promise<KnowledgeChunk[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.chunks

  const { data, error } = await supabaseAdmin
    .from("cs_chunks")
    .select("heading,content,cs_documents!inner(title,url,active)")
    .limit(800)

  if (error || !data) return cache?.chunks || []

  const chunks: KnowledgeChunk[] = []
  for (const row of data as unknown as {
    heading: string | null
    content: string
    cs_documents: { title: string; url: string | null; active: boolean } | null
  }[]) {
    const doc = row.cs_documents
    if (!doc || doc.active === false) continue
    chunks.push({
      title: doc.title,
      url: doc.url,
      heading: row.heading,
      content: row.content,
    })
  }

  cache = { at: Date.now(), chunks }
  return chunks
}

export async function findSources(query: string, limit = 3): Promise<RetrievedSource[]> {
  if (!query || query.trim().length < 3) return []
  try {
    const chunks = await getKnowledgeCorpus()
    return retrieveKnowledge(chunks, query, { limit, minScore: 0.35 })
  } catch {
    // Knowledge base tidak boleh menjatuhkan percakapan.
    return []
  }
}
