import { supabaseAdmin } from "@/lib/supabase"
import { storagePathFromUrl, thumbPathsFor } from "@/lib/storageUrl"

// Idempotent, resumable teardown executor for the Clearance console.
// Every step records its outcome in clearance_actions.steps so a failed run can
// be retried without repeating finished work. The "plan" (captured post id +
// media paths) is persisted up-front so a retry after disable_link still knows
// what to delete.

const WP_ORIGIN = process.env.NEXT_PUBLIC_WP_ORIGIN || ""
const WP_SECRET = process.env.WP_INTERNAL_SECRET || ""
const BUCKET = "media"
const MEDIA_BATCH = 100

export type ClearanceKind = "photos" | "invitation"
export type ClearanceStatus = "pending" | "reminded" | "executing" | "partial" | "done" | "failed"

type Steps = Record<string, unknown>
type StepOutcome = string | { error: string }

export type ClearanceResult = {
  ok: boolean
  status: ClearanceStatus
  steps: Steps
  error?: string
  deletedMedia: number
  deletedPhotos: number
}

function wpHeaders(): Record<string, string> {
  return { "X-Aksaraa-Secret": WP_SECRET, "Content-Type": "application/json" }
}

function collectUrls(value: unknown, out: string[]) {
  if (!value) return
  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) out.push(value)
    return
  }
  if (Array.isArray(value)) {
    for (const v of value) collectUrls(v, out)
    return
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>
    for (const key of ["url", "image_url", "src"]) {
      if (typeof o[key] === "string") collectUrls(o[key], out)
    }
  }
}

function toPath(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null
  return storagePathFromUrl(url)
}

async function removeStoragePaths(paths: string[]): Promise<number> {
  // Originals + their pre-generated thumbnails (thumbs are separate objects).
  const expanded = paths.flatMap((p) => [p, ...thumbPathsFor(p)])
  const unique = [...new Set(expanded.filter(Boolean))]
  let removed = 0
  for (let i = 0; i < unique.length; i += MEDIA_BATCH) {
    const batch = unique.slice(i, i + MEDIA_BATCH)
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove(batch)
    if (error) throw new Error(`Hapus media gagal: ${error.message}`)
    removed += batch.length
  }
  return removed
}

// Build the deletion plan: WP post id + every Supabase media path owned by the
// profile (couple assets, template gallery/cover jsonb, and guest photos).
async function buildPlan(profileId: string, kind: ClearanceKind) {
  const mediaUrls: string[] = []

  const { data: profile } = await supabaseAdmin
    .from("wedding_profiles")
    .select(
      "id, gallery_photos, cover_photos, couple_illustration_url, groom_photo_url, bride_photo_url, gallery_photo_url, og_image_url, active_wp_post_id, selected_track_id"
    )
    .eq("id", profileId)
    .maybeSingle()

  const { data: photos } = await supabaseAdmin
    .from("guest_photos")
    .select("image_url")
    .eq("wedding_profile_id", profileId)

  const photoPaths = (photos || []).map((p) => toPath(p.image_url)).filter(Boolean) as string[]

  let wpPostId: number | null = null
  const assetPaths: string[] = []

  if (profile) {
    wpPostId = (profile.active_wp_post_id as number | null) ?? null
    if (kind === "invitation") {
      for (const key of [
        "couple_illustration_url",
        "groom_photo_url",
        "bride_photo_url",
        "gallery_photo_url",
        "og_image_url",
      ]) {
        collectUrls((profile as Record<string, unknown>)[key], mediaUrls)
      }
      collectUrls(profile.gallery_photos, mediaUrls)
      collectUrls(profile.cover_photos, mediaUrls)
      if (profile.selected_track_id) {
        const { data: tr } = await supabaseAdmin
          .from("web_tracks")
          .select("audio_url")
          .eq("id", profile.selected_track_id)
          .maybeSingle()
        collectUrls(tr?.audio_url, mediaUrls)
      }
      for (const u of mediaUrls) {
        const path = toPath(u)
        if (path) assetPaths.push(path)
      }
    }
  }

  return {
    wpPostId,
    assetPaths,
    photoPaths,
    plan: { wp_post_id: wpPostId, asset_paths: assetPaths, photo_paths: photoPaths },
  }
}

export async function getAction(profileId: string, kind: ClearanceKind) {
  const { data } = await supabaseAdmin
    .from("clearance_actions")
    .select("id, status, steps, due_at, reminded_at, executed_at, last_error, attempts")
    .eq("wedding_profile_id", profileId)
    .eq("kind", kind)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data as
    | {
        id: string
        status: ClearanceStatus
        steps: Steps | null
        due_at: string
        reminded_at: string | null
        executed_at: string | null
        last_error: string | null
        attempts: number
      }
    | null
}

export async function markReminded(profileId: string, kind: ClearanceKind, dueAt: string) {
  const existing = await getAction(profileId, kind)
  const now = new Date().toISOString()
  await supabaseAdmin
    .from("clearance_actions")
    .upsert(
      {
        wedding_profile_id: profileId,
        kind,
        due_at: dueAt,
        status: existing && existing.status !== "pending" ? existing.status : "reminded",
        reminded_at: now,
        updated_at: now,
      },
      { onConflict: "wedding_profile_id,kind" }
    )
}

export async function executeClearance(
  profileId: string,
  kind: ClearanceKind,
  actorId: string | null,
  dueAt: string
): Promise<ClearanceResult> {
  const existing = await getAction(profileId, kind)
  const steps: Steps = { ...(existing?.steps || {}) }
  const attempts = (existing?.attempts || 0) + 1
  let deletedMedia = 0
  let deletedPhotos = 0

  const setStep = (name: string, value: StepOutcome) => {
    steps[name] = value
  }

  const persist = async (status: ClearanceStatus, error?: string) => {
    const now = new Date().toISOString()
    await supabaseAdmin.from("clearance_actions").upsert(
      {
        wedding_profile_id: profileId,
        kind,
        status,
        steps,
        attempts,
        last_error: error ?? null,
        executed_by: actorId,
        due_at: dueAt,
        executed_at: status === "done" ? now : existing?.executed_at ?? null,
        updated_at: now,
      },
      { onConflict: "wedding_profile_id,kind" }
    )
  }

  await persist("executing")

  // Persist the plan once so a retry (after a mid-run failure) can still find
  // the WP post id / media paths even if disable_link already cleared them.
  let plan = steps.plan as
    | { wp_post_id: number | null; asset_paths: string[]; photo_paths: string[] }
    | undefined
  if (!plan) {
    const built = await buildPlan(profileId, kind)
    plan = built.plan
    steps.plan = plan
    await persist("executing")
  }

  const runStep = async (name: string, fn: () => Promise<number>): Promise<number> => {
    if (steps[name] && typeof steps[name] === "string") return 0
    const n = await fn()
    setStep(name, new Date().toISOString())
    return n
  }

  try {
    if (kind === "photos") {
      deletedMedia += await runStep("media", () => removeStoragePaths(plan.photo_paths))
      deletedPhotos += await runStep("rows", async () => {
        const { error } = await supabaseAdmin
          .from("guest_photos")
          .delete()
          .eq("wedding_profile_id", profileId)
        if (error) throw new Error(`Hapus baris foto gagal: ${error.message}`)
        return plan.photo_paths.length
      })
      await runStep("mark_cleared", async () => {
        const { error } = await supabaseAdmin
          .from("wedding_profiles")
          .update({ photos_cleared_at: new Date().toISOString() })
          .eq("id", profileId)
        if (error) throw new Error(`Gagal menandai galeri terhapus: ${error.message}`)
        return 1
      })
    } else {
      const wpPostId = plan.wp_post_id

      await runStep("disable_link", async () => {
        const { error } = await supabaseAdmin
          .from("wedding_profiles")
          .update({
            invitation_disabled_at: new Date().toISOString(),
            is_published: false,
            active_wp_post_id: null,
            active_wp_post_url: null,
          })
          .eq("id", profileId)
        if (error) throw new Error(`Gagal menonaktifkan link: ${error.message}`)
        return 1
      })

      if (wpPostId && WP_ORIGIN && WP_SECRET) {
        // Attachments BEFORE the post: the route reads the post's
        // _elementor_data to know which attachments belong to it.
        await runStep("wp_attachments", async () => {
          const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${wpPostId}/attachments`, {
            method: "DELETE",
            headers: wpHeaders(),
          })
          if (res.status === 404) return 0
          if (!res.ok) {
            const t = await res.text()
            throw new Error(`Hapus lampiran WP gagal HTTP ${res.status}: ${t.slice(0, 300)}`)
          }
          const data = await res.json().catch(() => ({}))
          return (data?.deleted as number) || 0
        })

        await runStep("wp_post", async () => {
          const res = await fetch(`${WP_ORIGIN}/wp-json/aksaraa/v1/posts/${wpPostId}?force=1`, {
            method: "DELETE",
            headers: wpHeaders(),
          })
          if (!res.ok && res.status !== 404) {
            const t = await res.text()
            throw new Error(`Hapus post WP gagal HTTP ${res.status}: ${t.slice(0, 300)}`)
          }
          return 1
        })
      } else {
        setStep("wp_post", { error: "WP tidak dikonfigurasi — dilewati" })
      }

      deletedMedia += await runStep("media", () => removeStoragePaths(plan.asset_paths))
    }

    await persist("done")
    return { ok: true, status: "done", steps, deletedMedia, deletedPhotos }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await persist("partial", message)
    return { ok: false, status: "partial", steps, error: message, deletedMedia, deletedPhotos }
  }
}
