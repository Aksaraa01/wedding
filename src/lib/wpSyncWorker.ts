import { supabaseAdmin } from "@/lib/supabase"
import { buildProfileFields } from "@/lib/buildProfileFields"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""
const CONCURRENCY = Math.max(1, parseInt(process.env.WP_QUEUE_CONCURRENCY || "2", 10))
const POLL_MS = 2500
const STALE_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 3
const WP_FETCH_TIMEOUT = 120_000

export type WpJobKind = "duplicate" | "patch"

function wpHeaders() {
  return { "X-Aksaraa-Secret": WP_SECRET, "Content-Type": "application/json" }
}

function wpFetch(url: string, init: RequestInit = {}) {
  return fetch(url, { ...init, headers: { ...wpHeaders(), ...(init.headers || {}) }, signal: AbortSignal.timeout(WP_FETCH_TIMEOUT) })
}

// ---------- Job execution (moved verbatim from the old synchronous routes) ----------

async function runDuplicate(jobId: string, profileId: string, templateId: string) {
  const { data: tpl } = await supabaseAdmin
    .from("web_templates")
    .select("wp_master_slug, name")
    .eq("id", templateId)
    .maybeSingle()

  if (!tpl?.wp_master_slug) {
    throw new Error("Template tidak memiliki wp_master_slug")
  }

  const built = await buildProfileFields(profileId)
  if (!built) {
    throw new Error("Profil tidak ditemukan")
  }
  const { profile, fields } = built

  // If this couple already has a duplicated WP post (theme-switch), delete it first.
  // BUT never delete the master template — resolve its post ID first and skip if equal.
  let masterPostId: number | null = null
  try {
    const masterRes = await wpFetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/post/${encodeURIComponent(tpl.wp_master_slug)}`)
    if (masterRes.ok) {
      const md = await masterRes.json()
      masterPostId = typeof md.id === "number" ? md.id : null
    }
  } catch (e) {
    console.error("[wpSync] resolve master failed", e)
  }

  if (profile.active_wp_post_id && profile.active_wp_post_id !== masterPostId) {
    try {
      await wpFetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${profile.active_wp_post_id}?force=1`, { method: "DELETE" })
    } catch (e) {
      console.error("[wpSync] delete old post failed", e)
    }
  }

  let resolvedTrackUrl = ""
  if (profile.selected_track_id) {
    const { data: tr } = await supabaseAdmin
      .from("web_tracks")
      .select("audio_url")
      .eq("id", profile.selected_track_id)
      .maybeSingle()
    resolvedTrackUrl = tr?.audio_url || ""
  }

  const title = `${profile.bride_name} & ${profile.groom_name} — ${tpl.name}`
  const newSlug = profile.slug ? profile.slug : undefined

  const wpBody: Record<string, any> = { title, fields }
  if (newSlug) wpBody.new_slug = newSlug
  if (resolvedTrackUrl) wpBody.track_url = resolvedTrackUrl

  const res = await wpFetch(
    `${WP_ORIGIN}/wp-json/aksaraa/v1/templates/${encodeURIComponent(tpl.wp_master_slug)}/duplicate`,
    { method: "POST", body: JSON.stringify(wpBody) }
  )

  if (!res.ok) {
    const errText = await res.text()
    let errMsg = "Gagal menduplikasi template"
    try { errMsg = JSON.parse(errText).message || errMsg } catch {}
    throw new Error(`${errMsg} (HTTP ${res.status})`)
  }

  const data = await res.json()
  const postUrl = data.post_url || ""

  const { error: updateErr } = await supabaseAdmin
    .from("wedding_profiles")
    .update({
      active_wp_post_id: data.post_id,
      active_wp_post_url: postUrl,
      selected_template_id: templateId,
    })
    .eq("id", profileId)

  if (updateErr) {
    throw new Error(updateErr.message)
  }

  return { post_id: data.post_id, post_url: postUrl }
}

async function runPatch(jobId: string, profileId: string) {
  const built = await buildProfileFields(profileId)
  if (!built) {
    throw new Error("Profil tidak ditemukan")
  }
  const { profile, fields } = built

  if (!profile.active_wp_post_id) {
    throw new Error("Belum ada postingan WordPress aktif. Pilih template terlebih dahulu.")
  }

  let trackUrl = ""
  if (profile.selected_track_id) {
    const { data: tr } = await supabaseAdmin
      .from("web_tracks")
      .select("audio_url")
      .eq("id", profile.selected_track_id)
      .maybeSingle()
    trackUrl = tr?.audio_url || ""
  }

  const { data: tpl } = await supabaseAdmin
    .from("web_templates")
    .select("wp_manifest")
    .eq("id", profile.selected_template_id)
    .maybeSingle()

  let manifest: any = tpl?.wp_manifest || {}
  if (typeof manifest === "string") {
    try { manifest = JSON.parse(manifest) } catch { manifest = {} }
  }

  const res = await wpFetch(
    `${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${profile.active_wp_post_id}/elements`,
    { method: "PATCH", body: JSON.stringify({ fields, manifest, track_url: trackUrl }) }
  )

  if (!res.ok) {
    const errText = await res.text()
    let errMsg = "Gagal memperbarui konten WordPress"
    try { errMsg = JSON.parse(errText).message || errMsg } catch {}
    throw new Error(`${errMsg} (HTTP ${res.status})`)
  }

  const data = await res.json()
  return { patched: data.patched || [] }
}

// ---------- Queue helpers (used by the API routes) ----------

type EnqueueResult = { job_id: string; status: string }

export async function enqueueDuplicate(profileId: string, templateId: string): Promise<EnqueueResult> {
  // Idempotent: if a duplicate is already queued/processing, reuse it.
  // If still queued and the template changed, swap the template on the same record.
  const { data: existing } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id, status, template_id")
    .eq("wedding_profile_id", profileId)
    .eq("kind", "duplicate")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    if (existing.status === "queued" && existing.template_id !== templateId) {
      await supabaseAdmin
        .from("wp_sync_jobs")
        .update({ template_id: templateId, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    }
    return { job_id: existing.id, status: existing.status }
  }

  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .insert({ wedding_profile_id: profileId, kind: "duplicate", template_id: templateId, status: "queued" })
    .select("id, status")
    .single()

  if (error) throw new Error(error.message)
  return { job_id: data.id, status: data.status }
}

export async function enqueuePatch(profileId: string): Promise<EnqueueResult> {
  // Coalesce: one patch job per profile at a time (the worker re-reads the latest
  // Supabase state at run time, so a single pending job always applies newest data).
  const { data: existing } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id, status")
    .eq("wedding_profile_id", profileId)
    .eq("kind", "patch")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    await supabaseAdmin
      .from("wp_sync_jobs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    return { job_id: existing.id, status: existing.status }
  }

  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .insert({ wedding_profile_id: profileId, kind: "patch", status: "queued" })
    .select("id, status")
    .single()

  if (error) throw new Error(error.message)
  return { job_id: data.id, status: data.status }
}

// ---------- Worker ----------

async function claimNext(): Promise<{ id: string; wedding_profile_id: string; kind: WpJobKind; template_id: string | null } | null> {
  const now = new Date()
  // Reclaim jobs stuck in processing (process restarted mid-job).
  await supabaseAdmin
    .from("wp_sync_jobs")
    .update({ status: "queued", started_at: null, updated_at: now.toISOString() })
    .eq("status", "processing")
    .lt("started_at", new Date(now.getTime() - STALE_MS).toISOString())

  const { data: oldest } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!oldest) return null

  // Conditional claim: only win if it's still queued (guards against a
  // concurrent claim or a coalesced re-queue racing us).
  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .update({ status: "processing", started_at: now.toISOString(), updated_at: now.toISOString() })
    .eq("id", oldest.id)
    .eq("status", "queued")
    .select("id, wedding_profile_id, kind, template_id")
    .maybeSingle()

  if (error || !data) return null
  return data
}

async function processJob(job: NonNullable<Awaited<ReturnType<typeof claimNext>>>) {
  const { id, wedding_profile_id, kind, template_id } = job
  try {
    let result: any
    if (kind === "duplicate") {
      if (!template_id) throw new Error("template_id hilang untuk job duplicate")
      result = await runDuplicate(id, wedding_profile_id, template_id)
    } else {
      result = await runPatch(id, wedding_profile_id)
    }
    await supabaseAdmin
      .from("wp_sync_jobs")
      .update({ status: "done", result, updated_at: new Date().toISOString(), last_error: null })
      .eq("id", id)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[wpSync] job ${id} (${kind}) failed:`, message)
    const { data: current } = await supabaseAdmin
      .from("wp_sync_jobs")
      .select("attempts")
      .eq("id", id)
      .single()
    const attempts = (current?.attempts || 0) + 1
    const update: Record<string, any> = {
      attempts,
      updated_at: new Date().toISOString(),
      status: attempts >= MAX_ATTEMPTS ? "failed" : "queued",
      last_error: message,
      started_at: null,
    }
    await supabaseAdmin.from("wp_sync_jobs").update(update).eq("id", id)
  }
}

let workerStarted = false
let running = 0

export function startWpSyncWorker() {
  if (workerStarted) return
  if (!WP_ORIGIN || !WP_SECRET) {
    console.warn("[wpSync] WP_ORIGIN / WP_INTERNAL_SECRET not configured — worker disabled")
    return
  }
  workerStarted = true
  console.log(`[wpSync] worker started (concurrency=${CONCURRENCY}, poll=${POLL_MS}ms)`)

  const tick = async () => {
    while (running < CONCURRENCY) {
      const job = await claimNext()
      if (!job) break
      running++
      processJob(job).finally(() => {
        running--
      })
    }
  }

  const loop = async () => {
    try {
      await tick()
    } catch (err) {
      console.error("[wpSync] poll error", err)
    }
    setTimeout(loop, POLL_MS)
  }
  loop()
}