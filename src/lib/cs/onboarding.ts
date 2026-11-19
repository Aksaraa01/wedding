// Alur "Bantu Isi Undangan" — state disimpan di cs_profile_drafts.draft.__onboarding
// supaya tidak perlu migration. Semua penulisan field divalidasi dulu, lalu
// langsung masuk wedding_profiles (write-through) + patch WP bila perlu.

import { supabaseAdmin } from "@/lib/supabase"
import { getPublishBlockers } from "@/lib/publishBlockers"
import { getRowGates } from "@/lib/featureGates"
import { getTemplateContentSpec } from "@/components/templates"
import { hidesOpeningSection } from "@/lib/templateSections"
import { enqueueDuplicate, enqueuePatch, hasOpenWpChain } from "@/lib/wpSyncWorker"
import {
  POPULAR_QUOTES,
  SECTION_SPECS,
  SESSION_QUESTIONS,
  STORY_QUESTIONS,
  isSkip,
  isUncertainAnswer,
  looksLikeQuestion,
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
  giftPhase?: "account" | "address" | null
  giftStep?: number
  giftDraft?: Record<string, unknown>
  attempts?: Record<string, number>
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
  "groom_name",
  "bride_name",
  "couple_initials",
  "display_name",
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
      "id,slug,package_type,event_type,selected_template_id,active_wp_post_id,groom_full_name,bride_full_name,groom_parents,bride_parents,groom_instagram,bride_instagram,opening_title,opening_description,quote_text,quote_source,video_url,groom_photo_url,bride_photo_url,sessions,stories,gallery_photos,cover_photos,inviting_families,link_thumbnail_url,link_thumbnail_disabled,is_published,groom_name,bride_name,couple_initials,display_name,dresscode,livestream,rundown,contacts"
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
  else if (key === "dresscode_title" || key === "dresscode_description") {
    const current = (profile.dresscode as Record<string, unknown>) || {}
    patch.dresscode = {
      ...current,
      ...(key === "dresscode_title" ? { title: value } : { description: value }),
    }
  } else if (key === "livestream_url" || key === "livestream_title") {
    const current = (profile.livestream as Record<string, unknown>) || {}
    patch.livestream = {
      ...current,
      ...(key === "livestream_url" ? { url: value } : { title: value }),
    }
  } else if (key === "rundown") {
    patch.rundown = (Array.isArray(value) ? value : []).map((line) => {
      const text = String(line)
      const match = text.match(/^\s*(\d{1,2}[:.]\d{2})\s*(.*)$/)
      return match ? { time: match[1].replace(".", ":"), description: match[2] } : { time: "", description: text }
    })
  } else if (key === "contacts") {
    patch.contacts = (Array.isArray(value) ? value : []).map((line) => {
      const parts = String(line).split(/\s+-\s+|\s*\|\s*/).map((part) => part.trim())
      return { name: parts[0] || "", whatsapp: parts[1] || "", description: parts[2] || "" }
    })
  } else if (key === "gallery_photos" || key === "cover_photos") {
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

async function applicableSections(profile: Record<string, unknown>): Promise<string[]> {
  const noPhoto = false
  let spec: ReturnType<typeof getTemplateContentSpec> = undefined
  let templateNoPhoto = false
  let templateCode: string | null = null

  if (profile.selected_template_id) {
    const { data: template } = await supabaseAdmin
      .from("web_templates")
      .select("code,no_photo")
      .eq("id", profile.selected_template_id)
      .maybeSingle()
    templateCode = (template?.code as string) || null
    templateNoPhoto = template?.no_photo === true
    spec = getTemplateContentSpec(templateCode)
  }

  const gates = await getRowGates((profile.package_type as string) || "signature")
  const sections: string[] = []

  if (!templateNoPhoto) sections.push("sampul")
  if (!hidesOpeningSection(templateCode)) sections.push("pembuka")
  sections.push("profile", "acara")
  if (!templateNoPhoto) sections.push("galeri")
  if (gates.inviting_families.included && spec?.sections?.inviting !== false) sections.push("inviting")
  if (spec?.sections?.quote !== false) sections.push("kutipan")
  if (gates.cinematic_video.included && !templateNoPhoto && spec?.sections?.video !== false) sections.push("video")
  if (gates.story.included && spec?.sections?.story !== false) sections.push("story")
  sections.push("gift")
  if (spec?.sections?.dresscode) sections.push("dresscode")
  if (spec?.sections?.livestream) sections.push("livestream")
  if (spec?.sections?.rundown) sections.push("rundown")
  if (spec?.sections?.contacts) sections.push("contacts")

  void noPhoto
  return sections
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

  // Alur mengikuti SEMUA bagian yang tampil di editor (template + paket),
  // bukan hanya yang menghalangi publikasi.
  const sections = await applicableSections(profile)

  for (const key of sections) {
    const spec = SECTION_SPECS[key]
    if (!spec) continue

    if (spec.manual) {
      const asked = new Set(state.asked || [])
      if (!asked.has(key)) {
        asked.add(key)
        state.asked = Array.from(asked)
        await saveState(profileId, contactId, draft, state)
        return `${spec.manual}`
      }
      continue
    }

    const prompt = await sectionPrompt(profileId, contactId, state, draft, key, profile)
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

  // Sesi acara: lengkapi sesi yang belum lengkap; kalau sudah lengkap,
  // tawarkan "ada acara lain?" SEKALI, lalu tutup bagian ini.
  if (spec.repeat === "sessions") {
    if (state.sessionAwaitingMore) return null
    if ((state.asked || []).includes("acara")) return null

    const sessions = Array.isArray(profile.sessions)
      ? (profile.sessions as Record<string, unknown>[])
      : []
    const required = ["name", "date", "venue", "address", "maps_url"]
    const incompleteIndex = sessions.findIndex((session) =>
      required.some((key) => !String(session?.[key] ?? "").trim())
    )

    if (incompleteIndex >= 0) {
      const missingKey = required.find((key) => !String(sessions[incompleteIndex]?.[key] ?? "").trim()) || "name"
      const missingStep = SESSION_QUESTIONS.findIndex((question) => question.key === missingKey)
      state.section = sectionKey
      state.sessionEditIndex = incompleteIndex
      state.sessionStep = missingStep >= 0 ? missingStep : 0
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      const label = sessions[incompleteIndex]?.name || `sesi ${incompleteIndex + 1}`
      return `Bagian Acara (melengkapi "${label}"): ${SESSION_QUESTIONS[state.sessionStep].question}`
    }

    if (sessions.length > 0) {
      state.section = sectionKey
      state.sessionAwaitingMore = true
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      return 'Semua sesi acara sudah lengkap. Ada acara lain? Sebut nama acaranya, atau balas "selesai".'
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

  if (spec.repeat === "gifts") {
    const asked = new Set(state.asked || [])
    if (asked.has("gift")) return null
    state.section = "gift"
    state.giftPhase = state.giftPhase || "account"
    state.giftStep = state.giftStep ?? 0
    state.pendingUpload = null
    await saveState(profileId, contactId, draft, state)
    if (state.giftPhase === "account") {
      return `Bagian hadiah (rekening): ${GIFT_ACCOUNT_QUESTIONS[state.giftStep]?.question} Balas "lewati" kalau tidak mau mengisi.`
    }
    return `Bagian hadiah (alamat pengiriman): ${GIFT_ADDRESS_QUESTIONS[state.giftStep]?.question}`
  }

  if (spec.repeat === "stories") {
    if ((state.asked || []).includes("story")) return null
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
    const current = profile[key] !== undefined && profile[key] !== null ? profile[key] : draft[key]

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
  // Nama/teks pendek: kalau klien menempel banyak sekaligus, jangan simpan
  // seluruh paragraf sebagai satu nama.
  if (field.kind === "text" && text.length > 80) {
    return `Aku catat satu per satu ya Kak. ${field.question}`
  }
  // Kutipan: klien sering tidak punya kutipan sendiri. Tawarkan pilihan
  // populer (sama seperti editor) alih-alih memaksa atau menolak.
  if (field.key === "quote_text") {
    const value = text.trim()
    const picked =
      value === "1" ? POPULAR_QUOTES[0] : value === "2" ? POPULAR_QUOTES[1] : null
    const fallback = picked || (isUncertainAnswer(value) ? POPULAR_QUOTES[0] : null)

    if (fallback) {
      draft.quote_text = fallback.text
      draft.quote_source = fallback.source
      await applyField(profileId, "quote_text", fallback.text)
      await applyField(profileId, "quote_source", fallback.source)
      const asked = new Set(state.asked || [])
      asked.add("quote_text")
      asked.add("quote_source")
      state.asked = Array.from(asked)
      state.field = undefined
      await saveState(profileId, contactId, draft, state)
      return `Aku pakai kutipan ${fallback.label} ya Kak (bisa diganti dari dashboard nanti).\n\n${await nextPrompt(
        profileId,
        contactId,
        state,
        draft
      )}`
    }
  }

  const outcome = validateFlowAnswer(field, text)
  if (!outcome.ok) {
    const attempts = { ...(state.attempts || {}) }
    attempts[field.key] = (attempts[field.key] || 0) + 1
    state.attempts = attempts
    // Simpan hitungan SEBELUM kembali, kalau tidak percobaan tidak pernah
    // terakumulasi dan field opsional berputar selamanya.
    await saveState(profileId, contactId, draft, state)

    // Field opsional tidak boleh membuat klien terjebak: setelah 3 kali gagal,
    // lewati dan lanjut (mis. klien mengetik nama pada pertanyaan Instagram).
    if (field.optional && attempts[field.key] >= 3) {
      const asked = new Set(state.asked || [])
      asked.add(field.key)
      state.asked = Array.from(asked)
      state.field = undefined
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      return `Oke, bagian ini aku lewati dulu ya Kak (bisa diisi dari dashboard nanti).\n\n${await nextPrompt(
        profileId,
        contactId,
        state,
        draft
      )}`
    }

    return `${outcome.error}\n\n${field.question}`
  }

  if (state.attempts?.[field.key]) {
    const attempts = { ...state.attempts }
    delete attempts[field.key]
    state.attempts = attempts
  }

  if (outcome.value !== undefined) {
    draft[field.key] = outcome.value
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

async function answerGift(
  profileId: string,
  contactId: string,
  state: OnboardingState,
  draft: Record<string, unknown>,
  text: string
): Promise<string | null> {
  const lower = text.trim().toLowerCase()
  if (lower === "batal") return null

  if (state.giftPhase === "account") {
    const step = state.giftStep ?? 0
    const question = GIFT_ACCOUNT_QUESTIONS[step]
    if (step === 0 && isSkip(text)) {
      state.asked = Array.from(new Set([...(state.asked || []), "gift"]))
      state.giftPhase = null
      state.giftStep = undefined
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    const value = text.trim()
    if (!value) return "Jawabannya masih kosong."
    if (question.key === "account_number" && !/^[0-9\s.-]{4,30}$/.test(value)) {
      return "Nomor rekening itu angkanya saja ya Kak, coba lagi."
    }
    const giftDraft = { ...(state.giftDraft || {}), [question.key]: value }
    state.giftDraft = giftDraft
    if (step + 1 < GIFT_ACCOUNT_QUESTIONS.length) {
      state.giftStep = step + 1
      await saveState(profileId, contactId, draft, state)
      return GIFT_ACCOUNT_QUESTIONS[state.giftStep].question
    }

    const { error } = await supabaseAdmin.from("gift_accounts").insert({
      wedding_profile_id: profileId,
      type: /gopay|ovo|dana|shopeepay|linkaja|ewallet/i.test(String(giftDraft.provider_name || "")) ? "ewallet" : "bank",
      provider_name: String(giftDraft.provider_name || ""),
      account_number: String(giftDraft.account_number || ""),
      account_name: String(giftDraft.account_name || ""),
      sort_order: 0,
    })
    if (error) return "Rekening gagal disimpan. Coba lagi ya Kak."

    state.giftPhase = "address"
    state.giftStep = 0
    state.giftDraft = {}
    await saveState(profileId, contactId, draft, state)
    if (lower === "selesai") {
      state.giftPhase = null
      state.asked = Array.from(new Set([...(state.asked || []), "gift"]))
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    return `Rekening tersimpan. Lanjut alamat pengiriman hadiah ya Kak. ${GIFT_ADDRESS_QUESTIONS[0].question}`
  }

  // address phase
  const step = state.giftStep ?? 0
  const question = GIFT_ADDRESS_QUESTIONS[step]
  const isOptional = "optional" in question && question.optional === true
  if (isOptional && isSkip(text)) {
    // lewati field opsional
  } else {
    state.giftDraft = { ...(state.giftDraft || {}), [question.key]: text.trim() }
  }
  if (step + 1 < GIFT_ADDRESS_QUESTIONS.length) {
    state.giftStep = step + 1
    await saveState(profileId, contactId, draft, state)
    return GIFT_ADDRESS_QUESTIONS[state.giftStep].question
  }

  const address = (state.giftDraft || {}) as Record<string, unknown>
  await supabaseAdmin.from("gift_addresses").upsert(
    {
      wedding_profile_id: profileId,
      recipient_name: String(address.recipient_name || ""),
      full_address: String(address.full_address || ""),
      city: String(address.city || ""),
      postal_code: String(address.postal_code || ""),
      phone: String(address.phone || ""),
    },
    { onConflict: "wedding_profile_id" }
  )

  state.giftPhase = null
  state.giftStep = undefined
  state.giftDraft = {}
  state.asked = Array.from(new Set([...(state.asked || []), "gift"]))
  await saveState(profileId, contactId, draft, state)
  return nextPrompt(profileId, contactId, state, draft)
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

const CONFIRM =
  /^(selesai|cukup|sudah|udah|tidak|gak|nggak|engga|no|nope|ya sudah|oke sudah|belum perlu|beres|done|itu aja|segitu|tidak usah|gak usah|nggak usah|ga usah|cuma itu|hanya itu|sudah aja|udah aja)/

// "ya" sendirian pada pertanyaan "ada acara lain?" berarti mereka PUNYA acara
// lain, bukan "selesai".
const YES_ONLY = /^(ya|iya|ada|mau|perlu|masih ada)\s*$/i

const GIFT_ACCOUNT_QUESTIONS = [
  { key: "provider_name", question: "Rekening hadiah: bank atau e-wallet apa? (contoh: BCA / GoPay)" },
  { key: "account_number", question: "Nomor rekening atau nomor e-wallet-nya?" },
  { key: "account_name", question: "Atas nama siapa?" },
] as const

const GIFT_ADDRESS_QUESTIONS = [
  { key: "recipient_name", question: "Alamat hadiah: nama penerima paket?" },
  { key: "full_address", question: "Alamat lengkap pengiriman hadiah?" },
  { key: "city", question: "Kota/kecamatan penerima?" },
  { key: "postal_code", question: "Kode pos? (boleh di-skip)", optional: true },
  { key: "phone", question: "Nomor HP penerima? (boleh di-skip)", optional: true },
] as const

const ESCAPE_INTENTS = new Set([
  "voucher",
  "refund",
  "payment",
  "human_request",
  "discount",
  "complaint",
  "out_of_scope",
  "price",
  "package_info",
  "template",
  "timeline",
  "technical",
  "status",
  "comparison",
  "recommendation",
  "timing",
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
  if (askingQuestion) {
    // Pertanyaan di tengah pengisian dijawab router (state tidak hilang).
    if (ESCAPE_INTENTS.has(classify(message))) return null
    if (looksLikeQuestion(message)) return null
  }

  if (state.stage === "preview") {
    // Klien minta lanjut mengisi lagi setelah pratinjau: buka alur, jangan
    // dilempar ke router sebagai pertanyaan.
    if (/isi undangan|lanjut isi|bantu isi|lanjutkan|tambah data/.test(lower)) {
      state.stage = "data"
      state.asked = []
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
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

  if (state.section === "gift" && state.giftPhase) {
    return answerGift(profileId, contactId, state, draft, message)
  }

  if (state.sessionAwaitingMore) {
    if (CONFIRM.test(lower)) {
      state.sessionAwaitingMore = false
      state.asked = Array.from(new Set([...(state.asked || []), "acara"]))
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    if (YES_ONLY.test(lower)) {
      await saveState(profileId, contactId, draft, state)
      return "Siap, sebut nama acara barunya ya Kak."
    }
    // Nama acara baru.
    state.sessionAwaitingMore = false
    state.sessionDraft = { name: message }
    state.sessionStep = 1
    await saveState(profileId, contactId, draft, state)
    return SESSION_QUESTIONS[1].question
  }

  if (state.storyAwaitingMore) {
    if (CONFIRM.test(lower)) {
      state.storyAwaitingMore = false
      state.asked = Array.from(new Set([...(state.asked || []), "story"]))
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    if (YES_ONLY.test(lower)) {
      await saveState(profileId, contactId, draft, state)
      return "Siap, sebut judul momen barunya ya Kak."
    }
    state.storyAwaitingMore = false
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
    if (/^\d+$/.test(lower)) {
      return "Kalau mau kirim foto, pakai tombol foto ya Kak. Balas \"selesai\" kalau sudah cukup."
    }
    // "selesai" saat foto galeri/sampul = cukup, lanjut bagian berikutnya.
    const isPhotoList = state.pendingUpload === "gallery_photos" || state.pendingUpload === "cover_photos"
    if (isPhotoList && CONFIRM.test(lower)) {
      state.field = undefined
      state.pendingUpload = null
      await saveState(profileId, contactId, draft, state)
      return nextPrompt(profileId, contactId, state, draft)
    }
    return "Belum ada foto yang aku terima. Kirim lewat tombol foto di chat, atau balas \"selesai\" kalau cukup."
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
