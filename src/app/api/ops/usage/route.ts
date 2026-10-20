import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireOpsEmployee } from "@/lib/ops-auth"

// Ops-only storage/usage snapshot.
//
// Why this exists: Supabase's public Management API does NOT expose billing
// egress or image-transformation counts (only the dashboard does). We can,
// however, measure what we control: object count and bytes per folder, plus
// how much of that is our pre-generated thumbnails. Cached for 10 minutes.

const BUCKET = "media"
const CACHE_MS = 10 * 60 * 1000
const STORAGE_QUOTA_BYTES = 100 * 1024 * 1024 * 1024 // Pro plan included storage

type FolderRow = { folder: string; objects: number; bytes: number }
type StorageSnapshot = {
  source: "db" | "api"
  partial: boolean
  objects: number
  bytes: number
  thumbObjects: number
  thumbBytes: number
  guestBytes: number
  folders: FolderRow[]
}

let cache: { at: number; data: StorageSnapshot } | null = null

function projectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  return url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/i)?.[1] || null
}

async function storageFromDb(): Promise<StorageSnapshot | null> {
  const password = process.env.SUPABASE_DB_PASSWORD
  const ref = projectRef()
  if (!password || !ref) return null
  try {
    const { Client } = await import("pg")
    const host =
      process.env.SUPABASE_DB_HOST ||
      `aws-0-${process.env.SUPABASE_DB_REGION || "ap-northeast-1"}.pooler.supabase.com`
    const client = new Client({
      host,
      port: Number(process.env.SUPABASE_DB_PORT || 6543),
      user: process.env.SUPABASE_DB_USER || `postgres.${ref}`,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 8000,
      statement_timeout: 15000,
    })
    await client.connect()
    try {
      const totals = await client.query<{
        objects: string
        bytes: string
        thumb_objects: string
        thumb_bytes: string
        guest_bytes: string
      }>(`
        select
          count(*)::text as objects,
          coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes,
          count(*) filter (where name like 'thumbs/%')::text as thumb_objects,
          coalesce(sum(case when name like 'thumbs/%' then (metadata->>'size')::bigint else 0 end), 0)::text as thumb_bytes,
          coalesce(sum(case when name like 'guest-photos/%' then (metadata->>'size')::bigint else 0 end), 0)::text as guest_bytes
        from storage.objects
        where bucket_id = $1
      `, [BUCKET])
      const folders = await client.query<{ folder: string; objects: string; bytes: string }>(`
        select split_part(name, '/', 1) as folder,
               count(*)::text as objects,
               coalesce(sum((metadata->>'size')::bigint), 0)::text as bytes
        from storage.objects
        where bucket_id = $1
        group by 1
        order by 3::bigint desc
        limit 12
      `, [BUCKET])
      const t = totals.rows[0]
      return {
        source: "db",
        partial: false,
        objects: Number(t?.objects || 0),
        bytes: Number(t?.bytes || 0),
        thumbObjects: Number(t?.thumb_objects || 0),
        thumbBytes: Number(t?.thumb_bytes || 0),
        guestBytes: Number(t?.guest_bytes || 0),
        folders: folders.rows.map((r) => ({
          folder: r.folder || "(root)",
          objects: Number(r.objects || 0),
          bytes: Number(r.bytes || 0),
        })),
      }
    } finally {
      await client.end().catch(() => {})
    }
  } catch (err) {
    console.warn("[ops/usage] db snapshot failed:", err instanceof Error ? err.message : String(err))
    return null
  }
}

// Fallback when no DB password is configured (e.g. first deploy): walk the
// bucket with the Storage API. Bounded on purpose — this is a monitoring
// snapshot, not an inventory job.
async function storageFromApi(): Promise<StorageSnapshot> {
  const folders = new Map<string, { objects: number; bytes: number }>()
  let objects = 0
  let bytes = 0
  let thumbObjects = 0
  let thumbBytes = 0
  let guestBytes = 0
  let partial = false

  const queue: string[] = [""]
  let pages = 0
  while (queue.length) {
    if (pages++ > 400) {
      partial = true
      break
    }
    const prefix = queue.shift() as string
    let offset = 0
    for (;;) {
      const { data, error } = await supabaseAdmin.storage.from(BUCKET).list(prefix, {
        limit: 100,
        offset,
        sortBy: { column: "name", order: "asc" },
      })
      if (error) throw error
      if (!data?.length) break
      for (const item of data) {
        const path = prefix ? `${prefix}/${item.name}` : item.name
        if (!item.id) {
          queue.push(path)
          continue
        }
        const size = Number((item.metadata as { size?: number } | null)?.size || 0)
        objects++
        bytes += size
        const top = path.split("/")[0] || "(root)"
        const f = folders.get(top) || { objects: 0, bytes: 0 }
        f.objects++
        f.bytes += size
        folders.set(top, f)
        if (path.startsWith("thumbs/")) {
          thumbObjects++
          thumbBytes += size
        }
        if (path.startsWith("guest-photos/")) guestBytes += size
      }
      if (data.length < 100) break
      offset += 100
    }
  }

  return {
    source: "api",
    partial,
    objects,
    bytes,
    thumbObjects,
    thumbBytes,
    guestBytes,
    folders: [...folders.entries()]
      .map(([folder, v]) => ({ folder, ...v }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 12),
  }
}

export async function GET(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  try {
    if (cache && Date.now() - cache.at < CACHE_MS) {
      return NextResponse.json({ ...cache.data, quotaBytes: STORAGE_QUOTA_BYTES, cached: true })
    }
    const storage = (await storageFromDb()) || (await storageFromApi())
    // Cache either source: the API walk is ~80 list calls for 8k objects.
    cache = { at: Date.now(), data: storage }
    const ref = projectRef()
    return NextResponse.json({
      ...storage,
      quotaBytes: STORAGE_QUOTA_BYTES,
      cached: false,
      manual: {
        dashboardUrl: ref ? `https://supabase.com/dashboard/project/${ref}/settings/usage` : null,
        note:
          "Egress & image transformation counts are only available in the Supabase dashboard (the public Management API does not expose them). After removing /render/image usage, transformations should stay at 0.",
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membaca usage" },
      { status: 500 }
    )
  }
}
