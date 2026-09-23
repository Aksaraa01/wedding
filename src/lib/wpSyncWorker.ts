import { supabaseAdmin } from "@/lib/supabase"
import { buildProfileFields } from "@/lib/buildProfileFields"

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""
const CONCURRENCY = Math.max(1, parseInt(process.env.WP_QUEUE_CONCURRENCY || "6", 10))
const POLL_MS = Math.max(200, parseInt(process.env.WP_POLL_MS || "800", 10))
const POLL_MS_IDLE = 2000
const STALE_MS = 5 * 60 * 1000
const MAX_ATTEMPTS = 3
const WP_FETCH_TIMEOUT = 120_000

export type WpJobKind = "duplicate" | "patch" | "cleanup"

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

  const oldPostId = profile.active_wp_post_id && profile.active_wp_post_id !== masterPostId ? profile.active_wp_post_id : null

  let resolvedTrackUrl = ""
  if (profile.selected_track_id) {
    const { data: tr } = await supabaseAdmin
      .from("web_tracks")
      .select("audio_url")
      .eq("id", profile.selected_track_id)
      .maybeSingle()
    resolvedTrackUrl = tr?.audio_url || ""
  }

  const brideFull = (profile.bride_full_name || profile.bride_name || "").trim()
  const groomFull = (profile.groom_full_name || profile.groom_name || "").trim()
  const title = `${brideFull} & ${groomFull} - ${tpl.name}`
  const newSlug = profile.slug ? profile.slug : undefined

  const wpBody: Record<string, any> = { title, fields }
  if (newSlug) wpBody.new_slug = newSlug
  if (resolvedTrackUrl) wpBody.track_url = resolvedTrackUrl
  if (resolvedTrackUrl) fields.track_url = resolvedTrackUrl
  if (oldPostId) wpBody.exclude_post_id = oldPostId

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

  if (oldPostId) {
    await enqueueCleanup(profileId, oldPostId, profile.slug || "")
  }

  return { post_id: data.post_id, post_url: postUrl, cleaned_old: oldPostId }
}

async function runCleanup(jobId: string, profileId: string, payload: any) {
  const oldPostId = payload?.old_post_id as number | undefined
  const baseSlug = payload?.base_slug as string | undefined
  const { data: profile } = await supabaseAdmin.from("wedding_profiles").select("slug, active_wp_post_id").eq("id", profileId).maybeSingle()
  const activeId = profile?.active_wp_post_id
  const slug = baseSlug || profile?.slug || ""
  if (oldPostId && activeId && oldPostId === activeId) return { skipped: "old equals active" }
  if (slug) {
    const res = await wpFetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/cleanup`, {
      method: "POST",
      body: JSON.stringify({ base_slug: slug, keep_post_id: activeId, old_post_id: oldPostId }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`Cleanup failed HTTP ${res.status}: ${t.slice(0, 500)}`)
    }
    const data = await res.json()
    return data
  }
  if (oldPostId) {
    const res = await wpFetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${oldPostId}?force=1`, { method: "DELETE" })
    if (!res.ok && res.status !== 404) {
      const t = await res.text()
      throw new Error(`Delete old post ${oldPostId} failed HTTP ${res.status}: ${t.slice(0, 300)}`)
    }
    return { deleted: oldPostId }
  }
  return { skipped: "no slug nor old_post_id" }
}

async function runPatch(jobId: string, profileId: string, postId?: number | null) {
  const built = await buildProfileFields(profileId)
  if (!built) {
    throw new Error("Profil tidak ditemukan")
  }
  const { profile, fields } = built

  // Explicit post wins (duplicate→patch chains pin the fresh post). Otherwise
  // fall back to the profile's active post. Never patch the template master:
  // runDuplicate deliberately never sets active_wp_post_id to the master id.
  const targetPostId = postId || profile.active_wp_post_id
  if (!targetPostId) {
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
  if (trackUrl) fields.track_url = trackUrl

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
    `${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${targetPostId}/elements`,
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

export async function enqueuePatch(profileId: string, postId?: number | null): Promise<EnqueueResult> {
  const { data: existing } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id, status, payload")
    .eq("wedding_profile_id", profileId)
    .eq("kind", "patch")
    .in("status", ["queued", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Reuse an in-flight patch only when it targets the same post (or neither
  // pins a post, e.g. manual editor saves). A duplicate→patch chain that
  // pins a fresh post_id must NOT coalesce into a patch for the old post.
  const existingPostId = (existing?.payload as any)?.post_id ?? null
  if (existing && (existingPostId || null) === (postId || null)) {
    await supabaseAdmin
      .from("wp_sync_jobs")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", existing.id)
    return { job_id: existing.id, status: existing.status }
  }

  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .insert({ wedding_profile_id: profileId, kind: "patch", status: "queued", payload: postId ? { post_id: postId } : null })
    .select("id, status")
    .single()

  if (error) throw new Error(error.message)
  return { job_id: data.id, status: data.status }
}

export async function enqueueCleanup(profileId: string, oldPostId: number, baseSlug: string): Promise<EnqueueResult> {
  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .insert({ wedding_profile_id: profileId, kind: "cleanup", status: "queued", payload: { old_post_id: oldPostId, base_slug: baseSlug } })
    .select("id, status")
    .single()
  if (error) throw new Error(error.message)
  return { job_id: data.id, status: data.status }
}

// ---------- Worker ----------

async function claimNext(): Promise<{ id: string; wedding_profile_id: string; kind: WpJobKind; template_id: string | null; payload: any | null } | null> {
  const now = new Date()
  await supabaseAdmin
    .from("wp_sync_jobs")
    .update({ status: "queued", started_at: null, updated_at: now.toISOString() })
    .eq("status", "processing")
    .lt("started_at", new Date(now.getTime() - STALE_MS).toISOString())

  // Per-profile serialization: never run two jobs for the same couple
  // concurrently. A patch that runs while a newer duplicate is still writing
  // would otherwise patch the old post (or read a half-updated profile).
  const { data: processing } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("wedding_profile_id")
    .eq("status", "processing")

  const busyProfiles = new Set((processing || []).map((r: any) => r.wedding_profile_id))

  const { data: queued } = await supabaseAdmin
    .from("wp_sync_jobs")
    .select("id, wedding_profile_id")
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(10)

  const oldest = (queued || []).find((q: any) => !busyProfiles.has(q.wedding_profile_id))
  if (!oldest) return null

  const { data, error } = await supabaseAdmin
    .from("wp_sync_jobs")
    .update({ status: "processing", started_at: now.toISOString(), updated_at: now.toISOString() })
    .eq("id", oldest.id)
    .eq("status", "queued")
    .select("id, wedding_profile_id, kind, template_id, payload")
    .maybeSingle()

  if (error || !data) return null
  return data
}

async function processJob(job: NonNullable<Awaited<ReturnType<typeof claimNext>>>) {
  const { id, wedding_profile_id, kind, template_id, payload } = job
  try {
    let result: any
    if (kind === "duplicate") {
      if (!template_id) throw new Error("template_id hilang untuk job duplicate")
      result = await runDuplicate(id, wedding_profile_id, template_id)
    } else if (kind === "cleanup") {
      result = await runCleanup(id, wedding_profile_id, payload)
    } else {
      const pinnedPostId = typeof payload?.post_id === "number" ? payload.post_id : null
      result = await runPatch(id, wedding_profile_id, pinnedPostId)
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
    // A 404 means the target post is gone (e.g. superseded by a newer
    // duplicate and cleaned up) — retrying can never succeed, fail fast.
    const terminal = attempts >= MAX_ATTEMPTS || message.includes("(HTTP 404)")
    const update: Record<string, any> = {
      attempts,
      updated_at: new Date().toISOString(),
      status: terminal ? "failed" : "queued",
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
    let claimed = 0
    while (running < CONCURRENCY) {
      const job = await claimNext()
      if (!job) break
      claimed++
      running++
      processJob(job).finally(() => {
        running--
      })
    }
    return claimed
  }

  const loop = async () => {
    let claimed = 0
    try {
      claimed = await tick()
    } catch (err) {
      console.error("[wpSync] poll error", err)
    }
    setTimeout(loop, claimed > 0 ? POLL_MS : POLL_MS_IDLE)
  }
  loop()
}