// Alur "Bantu Isi Undangan" — state disimpan di cs_profile_drafts.draft.__onboarding
// supaya tidak perlu migration. Semua penulisan field divalidasi dulu, lalu
// langsung masuk wedding_profiles (write-through) + patch WP bila perlu.

import { supabaseAdmin } from "@/lib/supabase"
import { getPublishBlockers } from "@/lib/publishBlockers"
import { enqueueDuplicate, enqueuePatch, hasOpenWpChain } from "@/lib/wpSyncWorker"
import {
  SECTION_SPECS,
  SESSION_QUESTIONS,
  STORY_QUESTIONS,
  isSkip,
  mapSectionFromText,
  matchTemplateByName,
  validateFlowAnswer,
  type FlowField,
} from "@/lib/cs/onboardingSpec"
import { validateField } from "@/lib/cs/profileFields"
import { validateSessionField } from "@/lib/cs/onboardingSpec"
import { classify } from "@/lib/cs/policy"

const STATE_KEY = "__onboarding"

export interface OnboardingState {
  stage: "template" | "data" | "preview" | "done"
  startedAt?: string
  templateJob?: { id: string; status: string } | null
  section?: string
  field?: string
  asked?: string[]
  sessionStep?: number
  sessionDraft?: Record<string, unknown> | null
  sessionEditIndex?: number | null
  sessionAwaitingMore?: boolean
  storyAwaitingMore?: boolean
  storyStep?: number
  storyDraft?: Record<string, unknown> | null
  pendingUpload?: string | null
  previewSent?: boolean
  publishSent?: boolean
  templateChoices?: { id: string; name: string; code: string }[]
}

interface DraftRow {
  id: string
  draft: Record<string, unknown>
}

const DIRECT_COLUMNS = new Set([
  "opening_title",
  "opening_description",
  "groom_full_name",
  "bride_full_name",
  "groom_parents",
  "bride_parents",
  "groom_instagram",
  "bride_instagram",
  "quote_text",
  "quote_source",
  "video_url",
  "groom_photo_url",
  "bride_photo_url",
])

const JSONB_COLUMNS = new Set(["sessions", "stories"])

async function readDraft(profileId: string): Promise<DraftRow | null> {
  const { data } = await supabaseAdmin
    .from("cs_profile_drafts")
    .select("id,draft")
    .eq("wedding_profile_id", profileId)
    .maybeSingle()
  if (!data) return null
  return { id: String(data.id), draft: (data.draft as Record<string, unknown>) || {} }
}

async function writeDraft(profileId: string, contactId: string, draft: Record<string, unknown>) {
  await supabaseAdmin.from("cs_profile_drafts").upsert(
    {
      wedding_profile_id: profileId,
      contact_id: contactId,
      draft,
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "wedding_profile_id" }
  )
}

export async function getOnboardingState(
  profileId: string
): Promise<{ state: OnboardingState | null; draft: Record<string, unknown> }> {
  const row = await readDraft(profileId)
  const draft = row?.draft || {}
  const state = (draft[STATE_KEY] as OnboardingState | undefined) || null
  return { state, draft }
}

async function saveState(
  profileId: string,
  contactId: string,
  draft: Record<string, unknown>,
  state: OnboardingState
) {
  await writeDraft(profileId, contactId, { ...draft, [STATE_KEY]: state })
}

async function profileRow(profileId: string) {
  const { data } = await supabaseAdmin
    .from("wedding_profiles")
    .select(
      "id,slug,package_type,event_type,selected_template_id,active_wp_post_id,groom_full_name,bride_full_name,groom_parents,bride_parents,groom_instagram,bride_instagram,opening_title,opening_description,quote_text,quote_source,video_url,groom_photo_url,bride_photo_url,sessions,stories,gallery_photos,cover_photos,inviting_families,link_thumbnail_url,link_thumbnail_disabled,is_published"
    )
    .eq("id", profileId)
    .maybeSingle()
  return data as Record<string, unknown> | null
}

function isFilled(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  return typeof value === "string" ? value.trim() !== "" : value !== null && value !== undefined
}

async function applyField(profileId: string, key: string, value: unknown): Promise<void> {
  const profile = await profileRow(profileId)
  if (!profile) return

  const patch: Record<string, unknown> = {}
  if (DIRECT_COLUMNS.has(key)) patch[key] = value
  else if (JSONB_COLUMNS.has(key)) patch[key] = value
  else if (key === "inviting_families") patch[key] = JSON.stringify(value)
  else if (key === "gallery_photos" || key === "cover_photos") {
    const current = Array.isArray(profile[key]) ? (profile[key] as unknown[]) : []
    const next = Array.isArray(value) ? value : [...current, value]
    patch[key] = key === "cover_photos" ? next.slice(0, 3) : next
  } else return

  const { error } = await supabaseAdmin.from("wedding_profiles").update(patch).eq("id", profileId)
  if (error) return

  await supabaseAdmin.from("cs_audit").insert({
    actor: `cs:onboarding`,
    action: "onboarding_field",
    subject: profileId,
    detail: { key },
  })

  const postId = profile.active_wp_post_id
  if (postId) await enqueuePatch(profileId, Number(postId), { source: "cs" }).catch(() => {})
}

async function eligibleTemplates(profile: Record<string, unknown>) {
  const { data } = await supabaseAdmin
    .from("web_templates")
    .select("id,name,code,source_type,package_eligibility,event_type,is_active,no_photo")
    .eq("is_active", true)
    .order("popular_rank", { ascending: true, nullsFirst: false })
    .limit(60)

  const eventType = (profile.event_type as string) || "wedding"
  const packageType = (profile.package_type as string) || "signature"

  return ((data || []) as Record<string, unknown>[]).filter((row) => {
    if ((row.event_type as string) !== eventType) return false
    const eligibility = Array.isArray(row.package_eligibility)
      ? (row.package_eligibility as string[])
      : []
    return eligibility.length === 0 || eligibility.includes(packageType)
  })
}

function templateListReply(templates: Record<string, unknown>[]): string {
  const lines = templates
    .slice(0, 8)
    .map((row, index) => `${index + 1}. ${row.name}`)
    .join("\n")
  return `Template yang bisa dipakai:\n${lines}\n\nSebutkan nama template pilihannya ya Kak (contoh: "${templates[0]?.name || "Taj Romance"}").`
}

function previewLink(profile: Record<string, unknown>): string {
  return `https://wedding.aksaraa.com/preview/${profile.id}`
}

function publishReply(profile: Record<string, unknown>): string {
  const link = profile.is_published
    ? `Undangannya sudah tayang: https://wedding.aksaraa.com/w/${profile.slug}`
    : `Undangannya belum tayang. Buka dashboard untuk konfirmasi & publikasi:\nhttps://wedding.aksaraa.com/dashboard/${profile.id}/web-invitation\n\nLangkahnya: login → menu Web Invitation → cek pratinjau → tekan Publikasi.`
  return `Sip, semua sudah oke. ${link}`
}

export async function startOnboarding(profileId: string, contactId: string): Promise<string> {
  const profile = await profileRow(profileId)
  if (!profile) return "Profil undangannya belum ketemu. Aku sambungkan ke tim dulu ya Kak."

  const { draft } = await getOnboardingState(profileId)
  const state: OnboardingState = {
    stage: profile.selected_template_id ? "data" : "template",
    startedAt: new Date().toISOString(),
    asked: [],
    pendingUpload: null,
  }
  await saveState(profileId, contactId, draft, state)

  if (state.stage === "template") {
    const templates = await eligibleTemplates(profile)
    state.templateChoices = templates.slice(0, 8).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      code: String(row.code),
    }))
    await saveState(profileId, contactId, draft, state)
    return `Oke, aku bantu isi undangannya dari awal ya Kak.\n\n${templateListReply(templates)}`
  }
  return nextPrompt(profileId, contactId, state, draft)
}

async function nextPrompt(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>
): Promise<string> {
  const profile = await profileRow(profileId)
  if (!profile) return "Profil undangannya belum ketemu."

  if (!profile.selected_template_id) {
    const templates = await eligibleTemplates(profile)
    state.stage = "template"
    state.templateChoices = templates.slice(0, 8).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      code: String(row.code),
    }))
    await saveState(profileId, contactId, draft, state)
    return templateListReply(templates)
  }

  const blockers = (await getPublishBlockers(profileId)).filter((blocker) => blocker.key !== "tema")

  if (!blockers.length) {
    state.stage = "preview"
    state.section = undefined
    state.field = undefined
    state.previewSent = true
    await saveState(profileId, contactId, draft, state)
    return `Semua data inti sudah lengkap 🎉\nCek hasilnya dulu ya Kak: ${previewLink(profile)}\n\nSudah oke? Balas "ya" kalau sudah, atau sebutkan bagian yang mau diubah.`
  }

  for (const blocker of blockers) {
    const spec = SECTION_SPECS[blocker.key]
    if (!spec) continue

    if (spec.manual) {
      const asked = new Set(state.asked || [])
      if (!asked.has(blocker.key)) {
        asked.add(blocker.key)
        state.asked = Array.from(asked)
        await saveState(profileId, contactId, draft, state)
        return `${spec.manual}`
      }
      continue
    }

    const prompt = await sectionPrompt(profileId, contactId, state, draft, blocker.key, profile)
    if (prompt) return prompt
  }

  state.stage = "preview"
  state.previewSent = true
  await saveState(profileId, contactId, draft, state)
  return `Data inti sudah lengkap. Cek pratinjaunya ya Kak: ${previewLink(profile)}\n\nSudah oke? Balas "ya" atau sebutkan bagian yang mau diubah.`
}

async function sectionPrompt(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>,
  sectionKey: string,
  profile: Record<string, unknown>
): Promise<string | null> {
  const spec = SECTION_SPECS[sectionKey]
  if (!spec) return null

  // Sesi acara: lengkapi sesi yang belum lengkap dulu, baru tambah sesi baru.
  if (spec.repeat === "sessions") {
    const sessions = Array.isArray(profile.sessions)
      ? (profile.sessions as Record<string, unknown>[])
      : []
    const required = ["name", "date", "venue", "address", "maps_url"]
    const incompleteIndex = sessions.findIndex((session) =>
      required.some((key) => !String(session?.[key] ?? "").trim())
    )

    if (incompleteIndex >= 0) {
      const missingKey = required.find((key) => !String(sessions[incompleteIndex]?.[key] ?? "").trim()) || "name"
      const step = SESSION_QUESTIONS.findIndex((question) => question.key === missingKey)
      state.section = sectionKey
      state.sessionEditIndex = incompleteIndex
      state.sessionStep = step >= 0 ? step : 0
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      const label = sessions[incompleteIndex]?.name || `sesi ${incompleteIndex + 1}`
      return `Bagian Acara (melengkapi "${label}"): ${SESSION_QUESTIONS[state.sessionStep].question}`
    }

    const step = state.sessionStep ?? 0
    const question = SESSION_QUESTIONS[step]
    if (question) {
      state.section = sectionKey
      state.sessionEditIndex = null
      state.sessionStep = step
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      return `Bagian Acara (sesi ${sessions.length + 1}): ${question.question}`
    }
    return null
  }

  if (spec.repeat === "stories") {
    const step = state.storyStep ?? 0
    const question = STORY_QUESTIONS[step]
    if (question) {
      state.section = sectionKey
      state.storyStep = step
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      return `Bagian Kisah Cinta: ${question.question}`
    }
    return null
  }

  for (const field of spec.fields) {
    const asked = new Set(state.asked || [])
    const key = field.key
    const current = profile[key]

    if (key === "gallery_photos" || key === "cover_photos") {
      if (isFilled(current)) continue
      state.section = sectionKey
      state.field = key
      state.pendingUpload = key
      await saveState(profileId, contactId, draft, state)
      return field.question
    }

    if (isFilled(current)) continue
    if (field.optional && asked.has(key)) continue

    state.section = sectionKey
    state.field = key
    state.pendingUpload = field.kind === "image" ? key : null
    await saveState(profileId, contactId, draft, state)
    return field.question
  }

  return null
}

async function answerField(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>,
  field: FlowField,
  text: string
): Promise<string> {
  const outcome = validateFlowAnswer(field, text)
  if (!outcome.ok) {
    return `${outcome.error}\n\n${field.question}`
  }

  if (outcome.value !== undefined) {
    await applyField(profileId, field.key, outcome.value)
  }

  const asked = new Set(state.asked || [])
  asked.add(field.key)
  state.asked = Array.from(asked)
  state.field = undefined
  state.pendingUpload = null
  await saveState(profileId, contactId, draft, state)

  return nextPrompt(profileId, contactId, state, draft)
}

async function answerSession(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>,
  text: string
): Promise<string> {
  const step = state.sessionStep ?? 0
  const question = SESSION_QUESTIONS[step]
  const profile = await profileRow(profileId)
  if (!profile) return "Profil tidak ditemukan."

  const sessionDraft = (state.sessionDraft as Record<string, unknown>) || {}

  // Validasi hanya sub-field yang sedang dijawab. Sesi lain (termasuk data lama
  // dengan tanggal lampau / jam rentang) tidak boleh memblokir.
  const checked = validateSessionField(question.key, text)
  if (!checked.ok) return `${checked.error} Coba lagi ya Kak.`

  sessionDraft[question.key] = checked.value ?? text
  state.sessionDraft = sessionDraft
  state.sessionStep = step + 1

  if (state.sessionStep < SESSION_QUESTIONS.length) {
    await saveState(profileId, contactId, draft, state)
    return SESSION_QUESTIONS[state.sessionStep].question
  }

  const existing = Array.isArray(profile.sessions) ? (profile.sessions as unknown[]) : []
  const editIndex = state.sessionEditIndex
  const next =
    typeof editIndex === "number" && editIndex >= 0
      ? existing.map((session, index) =>
          index === editIndex ? { ...(session as Record<string, unknown>), ...sessionDraft } : session
        )
      : [...existing, sessionDraft]

  await applyField(profileId, "sessions", next)
  const editedLabel =
    typeof editIndex === "number"
      ? String((existing[editIndex] as Record<string, unknown>)?.name || sessionDraft.name || "Acara")
      : String(sessionDraft.name || "Acara")
  state.sessionStep = undefined
  state.sessionDraft = null
  state.sessionEditIndex = null
  state.sessionAwaitingMore = true
  await saveState(profileId, contactId, draft, state)

  return typeof editIndex === "number"
    ? `Sesi "${editedLabel}" sudah lengkap. Ada acara lain? Sebut nama acaranya, atau balas "selesai".`
    : `Sesi "${editedLabel}" tersimpan. Ada acara lain? Sebut nama acaranya, atau balas "selesai".`
}

async function answerStory(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>,
  text: string
): Promise<string> {
  const step = state.storyStep ?? 0
  const question = STORY_QUESTIONS[step]
  const profile = await profileRow(profileId)
  if (!profile) return "Profil tidak ditemukan."

  const storyDraft = (state.storyDraft as Record<string, unknown>) || {}
  const optional = "optional" in question && question.optional === true
  if (optional && isSkip(text)) {
    // lewati tahun
  } else {
    storyDraft[question.key] = text
  }
  state.storyDraft = storyDraft
  state.storyStep = step + 1

  if (state.storyStep < STORY_QUESTIONS.length) {
    await saveState(profileId, contactId, draft, state)
    return STORY_QUESTIONS[state.storyStep].question
  }

  const existing = Array.isArray(profile.stories) ? (profile.stories as unknown[]) : []
  const next = [...existing, storyDraft]
  const valid = validateField("stories", next)
  if (!valid.ok) {
    state.storyStep = 0
    state.storyDraft = {}
    await saveState(profileId, contactId, draft, state)
    return `${valid.message}\n\nAyo ulangi cerita ini ya Kak: ${STORY_QUESTIONS[0].question}`
  }

  await applyField(profileId, "stories", next)
  state.storyStep = undefined
  state.storyDraft = null
  state.storyAwaitingMore = true
  await saveState(profileId, contactId, draft, state)

  return `Cerita "${storyDraft.title}" tersimpan. Ada momen lain? Sebut judulnya, atau balas "selesai".`
}

async function applyTemplate(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>,
  _profile: Record<string, unknown>,
  template: { id: string; name: string; source_type: string }
): Promise<string> {
  state.templateChoices = undefined

  if (template.source_type === "wp") {
    if (await hasOpenWpChain(profileId)) {
      return "Template sebelumnya masih diproses. Tunggu sebentar ya Kak."
    }
    const job = await enqueueDuplicate(profileId, template.id, "cs")
    state.templateJob = { id: String(job.job_id), status: String(job.status) }
    await saveState(profileId, contactId, draft, state)
    await supabaseAdmin.from("cs_audit").insert({
      actor: "cs:onboarding",
      action: "onboarding_template",
      subject: profileId,
      detail: { template: template.name, mode: "wp" },
    })
    return `Siap, template "${template.name}" sedang disiapkan. Tunggu 1–2 menit ya Kak.`
  }

  await supabaseAdmin
    .from("wedding_profiles")
    .update({ selected_template_id: template.id, active_wp_post_id: null, active_wp_post_url: null })
    .eq("id", profileId)
  await supabaseAdmin.from("cs_audit").insert({
    actor: "cs:onboarding",
    action: "onboarding_template",
    subject: profileId,
    detail: { template: template.name, mode: "inhouse" },
  })

  state.stage = "data"
  await saveState(profileId, contactId, draft, state)
  return `Template "${template.name}" dipakai. ${await nextPrompt(profileId, contactId, state, draft)}`
}

const ESCAPE_INTENTS = new Set([
  "voucher",
  "refund",
  "payment",
  "human_request",
  "discount",
  "complaint",
  "out_of_scope",
])

export async function handleOnboarding(
  profileId: string,
  contactId: string,
  text: string
): Promise<string | null> {
  const { state, draft } = await getOnboardingState(profileId)
  if (!state) return startOnboarding(profileId, contactId)

  const profile = await profileRow(profileId)
  if (!profile) return "Profil tidak ditemukan."

  const message = text.trim()
  const lower = message.toLowerCase()

  // Pertanyaan di tengah pengisian (voucher, refund, cara bayar, minta tim)
  // tidak boleh "ditelan" sebagai jawaban field. Lepaskan ke router normal;
  // state alur tetap tersimpan untuk dilanjutkan.
  const askingQuestion =
    state.stage === "data" &&
    (!!state.field || state.sessionStep !== undefined || state.storyStep !== undefined)
  if (askingQuestion && ESCAPE_INTENTS.has(classify(message))) return null

  if (state.stage === "preview") {
    const confirming = /^(ya|iya|ok|oke|sudah|udah|betul|benar|setuju|belum|tidak|bukan)/.test(lower)
    if (!confirming && !mapSectionFromText(lower) && classify(message) !== "unknown") return null
  }

  // Job template WP yang masih berjalan.
  if (state.templateJob?.id) {
    const { data: job } = await supabaseAdmin
      .from("wp_sync_jobs")
      .select("id,status")
      .eq("id", state.templateJob.id)
      .maybeSingle()
    const status = String(job?.status || state.templateJob.status)
    if (status === "queued" || status === "processing") {
      return "Template masih disiapkan tim sistem, tunggu sebentar ya Kak. Aku kabari kalau sudah siap."
    }
    if (status === "failed" || status === "error") {
      state.templateJob = null
      await saveState(profileId, contactId, draft, state)
      return "Template-nya gagal disiapkan. Coba pilih template lain ya Kak, atau aku sambungkan ke tim."
    }
    state.templateJob = null
    await saveState(profileId, contactId, draft, state)
    return nextPrompt(profileId, contactId, state, draft)
  }

  if (lower === "batal" || lower === "stop") {
    state.stage = "done"
    await saveState(profileId, contactId, draft, state)
    return "Oke, aku hentikan pengisian. Kalau mau lanjut, bilang \"bantu isi undangan\" lagi ya Kak."
  }

  if (state.stage === "template" || !profile.selected_template_id) {
    const templates = await eligibleTemplates(profile)

    // Daftar dikirim bernomor; klien wajar membalas "1". Tanpa ini, jawaban
    // angka dianggap nama template dan alur buntu.
    if (/^\d{1,2}$/.test(message)) {
      const choice = state.templateChoices?.[Number(message) - 1]
      if (choice) {
        return applyTemplate(profileId, contactId, state, draft, profile, {
          id: choice.id,
          name: choice.name,
          source_type: (templates.find((row) => String(row.id) === choice.id)?.source_type as string) || "",
        })
      }
    }

    if (lower === "batal" || lower === "stop") {
      state.stage = "done"
      await saveState(profileId, contactId, draft, state)
      return "Oke, aku hentikan dulu. Kalau mau lanjut, bilang \"bantu isi undangan\" lagi ya Kak."
    }

    const { match, candidates } = matchTemplateByName(message, templates as never)
    if (!match) {
      if (candidates.length > 1) {
        return `Ada ${candidates.length} template mirip: ${candidates.map((c) => c.name).join(", ")}. Sebutkan salah satu namanya ya Kak.`
      }
      return `Belum ketemu template "${message}". ${templateListReply(templates)}`
    }

    return applyTemplate(profileId, contactId, state, draft, profile, {
      id: match.id,
      name: match.name,
      source_type: (match as { source_type?: string }).source_type || "",
    })
  }

  if (state.stage === "preview") {
    if (/^(ya|iya|ok|oke|sudah|udah|betul|benar|setuju)/.test(lower)) {
      state.stage = "done"
      state.publishSent = true
      await saveState(profileId, contactId, draft, state)
      await supabaseAdmin
        .from("cs_audit")
        .insert({ actor: "cs:onboarding", action: "onboarding_completed", subject: profileId, detail: {} })
      return publishReply(profile)
    }
    const section = mapSectionFromText(lower)
    state.stage = "data"
    state.asked = []
    state.section = section || undefined
    await saveState(profileId, contactId, draft, state)
    return section
      ? `Oke, kita perbaiki bagian ${section}. ${await nextPrompt(profileId, contactId, state, draft)}`
      : `Bagian mana yang mau diubah? (profil, acara, galeri, kutipan, kisah cinta, video, turut mengundang)`
  }

  // stage === "data"
  const CONFIRM = /^(selesai|cukup|sudah|udah|tidak|gak|nggak|engga|no|nope|ya sudah|oke sudah|belum perlu)/

  if (state.sessionAwaitingMore) {
    state.sessionAwaitingMore = false
    if (CONFIRM.test(lower)) {
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    // Bukan konfirmasi: anggap nama acara baru.
    state.sessionDraft = { name: message }
    state.sessionStep = 1
    await saveState(profileId, contactId, draft, state)
    return SESSION_QUESTIONS[1].question
  }

  if (state.storyAwaitingMore) {
    state.storyAwaitingMore = false
    if (CONFIRM.test(lower)) {
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    state.storyDraft = { title: message }
    state.storyStep = 1
    await saveState(profileId, contactId, draft, state)
    return STORY_QUESTIONS[1].question
  }

  if (state.section === "acara" && state.sessionStep !== undefined) {
    if (lower === "selesai") {
      state.sessionStep = undefined
      state.sessionDraft = null
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    return answerSession(profileId, contactId, state, draft, message)
  }

  if (state.section === "story" && state.storyStep !== undefined) {
    if (lower === "selesai") {
      state.storyStep = undefined
      state.storyDraft = null
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    return answerStory(profileId, contactId, state, draft, message)
  }

  if (state.pendingUpload) {
    return "Aku tunggu fotonya ya Kak. Kirim lewat tombol foto di chat."
  }

  const field = state.field
  if (!field) return nextPrompt(profileId, contactId, state, draft)

  const spec = SECTION_SPECS[state.section || ""]?.fields.find((item) => item.key === field)
  if (!spec) return nextPrompt(profileId, contactId, state, draft)

  if (lower === "selesai" && (field === "gallery_photos" || field === "cover_photos")) {
    state.field = undefined
    state.pendingUpload = null
    await saveState(profileId, contactId, draft, state)
    return nextPrompt(profileId, contactId, state, draft)
  }

  return answerField(profileId, contactId, state, draft, spec, message)
}

export async function handleOnboardingUpload(
  profileId: string,
  contactId: string,
  url: string
): Promise<string> {
  const { state, draft } = await getOnboardingState(profileId)
  if (!state?.pendingUpload) {
    return "Fotonya sudah tersimpan. Ada yang mau diisi lagi? Balas \"bantu isi undangan\" ya Kak."
  }

  const field = state.pendingUpload
  if (field === "gallery_photos" || field === "cover_photos") {
    const profile = await profileRow(profileId)
    const current = Array.isArray(profile?.[field]) ? (profile?.[field] as unknown[]) : []
    await applyField(profileId, field, [...current, url])
    const spec = SECTION_SPECS[state.section || ""]?.fields.find((item) => item.key === field)
    return `Foto tersimpan (${current.length + 1}). Kirim foto lain atau balas "selesai" ya Kak.${spec ? "" : ""}`
  }

  await applyField(profileId, field, url)
  state.pendingUpload = null
  state.field = undefined
  const asked = new Set(state.asked || [])
  asked.add(field)
  state.asked = Array.from(asked)
  await saveState(profileId, contactId, draft, state)
  return nextPrompt(profileId, contactId, state, draft)
}

export { mapSectionFromText } from "@/lib/cs/onboardingSpec"

export async function onboardingProgress(profileId: string): Promise<{ done: number; total: number } | null> {
  const { state } = await getOnboardingState(profileId)
  if (!state) return null
  const blockers = await getPublishBlockers(profileId)
  return { done: 0, total: blockers.length }
}
