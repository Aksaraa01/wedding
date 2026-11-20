// Tool yang boleh dipanggil agent. Semua read-only kecuali draft pengisian
// data. Angka selalu datang dari sini, tidak pernah dari model.

import { supabaseAdmin } from "@/lib/supabase"
import { coupleUrl } from "@/lib/coupleUrl"
import { eventSite } from "@/lib/eventType"
import { getPublishBlockers } from "@/lib/publishBlockers"
import { pendingBlockers, type PaymentState } from "@/lib/cs/statusReply"
import { getPriceBook } from "@/lib/priceBook"
import { PACKAGE_CODES, PACKAGE_LABELS, calcTotalBook } from "@/lib/packages"
import {
  FIELD_BY_KEY,
  applyAnswer,
  buildPatch,
  nextQuestion,
  requiresConfirmation,
  validateField,
} from "@/lib/cs/profileFields"
import { ensureLead, saveLeadFact } from "@/lib/cs/leads"
import { missingCoreFacts, nextQualifyingQuestion, recommendPackage } from "@/lib/cs/playbook"
import { isPlaceholderTemplate, matchesTemplateCategory } from "@/lib/cs/templateFilter"
import { isCustomerFeature, isSellablePackage } from "@/lib/cs/catalog"
import { enqueuePatch } from "@/lib/wpSyncWorker"

export interface CsToolContext {
  contactId: string
  conversationId: string
  weddingProfileId: string | null
  verified: boolean
}

export interface ToolResult {
  data: unknown
  evidence: unknown
}

interface DraftRow {
  draft: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== "string") return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function presentFields(profile: Record<string, unknown>): Set<string> {
  const present = new Set<string>()
  for (const key of Object.keys(FIELD_BY_KEY)) {
    const value = profile[key]
    if (value === null || value === undefined) continue
    if (typeof value === "string" && value.trim() === "") continue
    if (Array.isArray(value) && value.length === 0) continue
    present.add(key)
  }
  return present
}

const PROFILE_SELECT =
  "display_name,groom_full_name,bride_full_name,groom_parents,bride_parents,groom_instagram,bride_instagram,estimated_guest_count,sessions,quote_text,quote_source,stories,inviting_families,selected_template_id,payment_status,is_published,package_type,estimated_wedding_date,active_wp_post_id,slug,guest_link_strict,event_type,invitation_disabled_at"

async function getProfile(weddingProfileId: string) {
  const { data, error } = await supabaseAdmin
    .from("wedding_profiles")
    .select(PROFILE_SELECT)
    .eq("id", weddingProfileId)
    .maybeSingle()
  if (error) throw new Error(`profil tidak terbaca: ${error.message}`)
  return data as Record<string, unknown> | null
}

async function getDraftRow(weddingProfileId: string): Promise<Record<string, unknown>> {
  const { data } = await supabaseAdmin
    .from("cs_profile_drafts")
    .select("draft")
    .eq("wedding_profile_id", weddingProfileId)
    .maybeSingle()
  return asRecord((data as DraftRow | null)?.draft)
}

async function toolGetPriceBook(): Promise<ToolResult> {
  const book = await getPriceBook()
  const [{ data: packages }, { data: features }] = await Promise.all([
    supabaseAdmin.from("packages").select("code,name,description,is_active"),
    supabaseAdmin.from("package_features").select("package_code,feature_code,is_included"),
  ])

  const featureMap: Record<string, string[]> = {}
  for (const row of (features || []) as { package_code: string; feature_code: string; is_included: boolean }[]) {
    if (!row.is_included) continue
    if (!isCustomerFeature(row.feature_code)) continue
    featureMap[row.package_code] = featureMap[row.package_code] || []
    featureMap[row.package_code].push(row.feature_code)
  }

  const data = ((packages || []) as { code: string; name: string; description: string; is_active: boolean }[])
    .filter((p) => p.is_active && isSellablePackage(p.code))
    .map((p) => ({
      code: p.code,
      name: p.name,
      description: p.description,
      price: book.base[p.code] ?? null,
      price_old: book.old[p.code] ?? null,
      features: featureMap[p.code] || [],
    }))

  return { data: { packages: data, wa_blast_tiers: book.waTiers, express: book.express }, evidence: data }
}

async function toolQuotePrice(args: Record<string, unknown>): Promise<ToolResult> {
  const code = String(args.package_code || "").trim()
  if (!(PACKAGE_CODES as readonly string[]).includes(code) || !isSellablePackage(code)) {
    return { data: { error: "package_code tidak dikenal" }, evidence: null }
  }

  const book = await getPriceBook()
  if (book.base[code] === undefined) {
    return { data: { error: "harga paket belum dikonfigurasi" }, evidence: null }
  }

  const waTier = Math.max(0, Math.floor(Number(args.wa_blast_tier) || 0))
  const express = args.express === true
  const base = calcTotalBook(book, code, waTier, express, 0)

  let discount = 0
  let voucherInfo: Record<string, unknown> | null = null
  const voucherCode = typeof args.voucher_code === "string" ? args.voucher_code.trim() : ""

  if (voucherCode) {
    const { data: voucher } = await supabaseAdmin
      .from("vouchers")
      .select("*")
      .ilike("code", voucherCode)
      .maybeSingle()

    if (!voucher) {
      voucherInfo = { code: voucherCode.toUpperCase(), valid: false, reason: "tidak ditemukan" }
    } else {
      const row = voucher as Record<string, unknown>
      const eligible = Array.isArray(row.package_eligibility) ? (row.package_eligibility as string[]) : []
      const active = row.is_active === true && Number(row.used_count || 0) < Number(row.max_uses || 0)
      const allowed = eligible.length === 0 || eligible.includes(code)
      if (!active) {
        voucherInfo = { code: row.code, valid: false, reason: "tidak aktif atau kuota habis" }
      } else if (!allowed) {
        voucherInfo = { code: row.code, valid: false, reason: "tidak berlaku untuk paket ini" }
      } else if (row.discount_type === "percent") {
        const percent = Math.max(1, Math.min(100, Number(row.percent) || 0))
        discount = Math.floor((base * percent) / 100)
        if (row.max_discount !== null && row.max_discount !== undefined) {
          discount = Math.min(discount, Number(row.max_discount) || 0)
        }
        voucherInfo = { code: row.code, valid: true, type: "percent", percent, discount }
      } else {
        discount = Math.max(0, Number(row.amount) || 0)
        voucherInfo = { code: row.code, valid: true, type: "amount", discount }
      }
    }
  }

  const total = Math.max(0, base - discount)
  const data = {
    package_code: code,
    package_name: PACKAGE_LABELS[code] || code,
    base,
    wa_blast_tier: waTier,
    express,
    voucher: voucherInfo,
    discount,
    total,
    note: voucherInfo?.valid
      ? "Voucher dicek ulang saat registrasi; kalau sudah terpakai, total kembali ke harga normal."
      : undefined,
  }

  return { data, evidence: data }
}

async function toolListTemplates(args: Record<string, unknown>): Promise<ToolResult> {
  const limit = Math.max(1, Math.min(20, Number(args.limit) || 8))

  // Ambil lebih banyak lalu saring di sini: label kategori di DB tidak seragam
  // ("Adat", "Adat/Tradisional", "Budaya"), jadi exact match selalu gagal.
  let query = supabaseAdmin
    .from("web_templates")
    .select("id,code,name,category,tier,preview_image_url,demo_url,no_photo,popular_rank,is_active")
    .order("popular_rank", { ascending: true, nullsFirst: false })
    .limit(60)

  if (args.has_photos === true) query = query.eq("no_photo", false)
  if (args.has_photos === false) query = query.eq("no_photo", true)

  const { data, error } = await query
  if (error) throw new Error(`template tidak terbaca: ${error.message}`)

  const term = typeof args.category === "string" ? args.category : ""
  const rows = ((data || []) as Record<string, unknown>[]).filter(
    (row) =>
      !isPlaceholderTemplate(row.name as string | null) &&
      matchesTemplateCategory(
        { category: row.category as string | null, name: row.name as string | null },
        term
      )
  )

  const activeRows = rows.filter((row) => row.is_active !== false)
  const inactiveRows = rows.filter((row) => row.is_active === false)
  const selected = activeRows.slice(0, limit)

  // Jumlah sebenarnya di katalog (bisa > 60 baris yang diambil di atas).
  const { count: catalogCount } = await supabaseAdmin
    .from("web_templates")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)

  return {
    data: {
      category_filter: term || "(semua)",
      total_matches: activeRows.length,
      total_active_in_catalog: catalogCount ?? activeRows.length,
      gallery_url: term ? "https://wedding.aksaraa.com/templates" : "https://wedding.aksaraa.com/templates",
      note:
        "templates[] hanya cuplikan, bukan seluruh katalog. Kalau klien minta SEMUA template, " +
        "kirim gallery_url saja dan jangan menyebut jumlah dari daftar ini. " +
        "Sebut angka hanya dari total_active_in_catalog.",
      templates: selected.map((row) => ({
        id: row.id,
        code: row.code,
        name: row.name,
        category: row.category,
        tier: row.tier,
        demo_url: row.demo_url,
      })),
      inactive_matches: inactiveRows.slice(0, 3).map((row) => ({
        name: row.name,
        category: row.category,
      })),
    },
    evidence: selected,
  }
}

async function toolCheckVoucher(args: Record<string, unknown>): Promise<ToolResult> {
  const code = String(args.code || "").trim()
  if (!code) return { data: { error: "kode kosong" }, evidence: null }

  const { data } = await supabaseAdmin.from("vouchers").select("*").ilike("code", code).maybeSingle()
  if (!data) {
    return { data: { code: code.toUpperCase(), valid: false, reason: "tidak ditemukan" }, evidence: null }
  }

  const row = data as Record<string, unknown>
  const remaining = Math.max(0, Number(row.max_uses || 0) - Number(row.used_count || 0))
  const valid = row.is_active === true && remaining > 0
  const info = {
    code: row.code,
    valid,
    reason: valid ? "" : row.is_active === true ? "kuota habis" : "tidak aktif",
    discount_type: row.discount_type,
    amount: row.amount,
    percent: row.percent,
    max_discount: row.max_discount,
    remaining,
    eligible_packages: Array.isArray(row.package_eligibility) ? row.package_eligibility : [],
  }

  return { data: info, evidence: info }
}

async function toolListVouchers(): Promise<ToolResult> {
  const { data } = await supabaseAdmin
    .from("vouchers")
    .select("code,amount,max_uses,used_count,package_eligibility,is_active,discount_type,percent,max_discount")
    .eq("is_active", true)

  const active = ((data || []) as Record<string, unknown>[]).filter(
    (row) => Number(row.used_count || 0) < Number(row.max_uses || 0)
  )

  const groups = new Map<
    string,
    { discount: string; eligible_packages: string[]; remaining: number }
  >()

  for (const row of active) {
    const eligibility = Array.isArray(row.package_eligibility)
      ? (row.package_eligibility as string[])
      : []
    const discount =
      row.discount_type === "percent"
        ? `${Number(row.percent) || 0}%${row.max_discount ? ` (maks Rp ${Number(row.max_discount).toLocaleString("id-ID")})` : ""}`
        : `Rp ${Number(row.amount || 0).toLocaleString("id-ID")}`
    const packages =
      eligibility.length === 0
        ? ["semua paket"]
        : eligibility.map((code) => {
            const label = PACKAGE_LABELS[code] || code
            return code.startsWith("dgb_") ? `Buku Tamu ${label}` : label
          })
    const key = `${discount}|${packages.join("|")}`

    const existing = groups.get(key)
    if (existing) {
      existing.remaining += Math.max(0, Number(row.max_uses || 0) - Number(row.used_count || 0))
      continue
    }

    groups.set(key, {
      discount,
      eligible_packages: packages,
      remaining: Math.max(0, Number(row.max_uses || 0) - Number(row.used_count || 0)),
    })
  }

  const voucher_groups = Array.from(groups.values()).slice(0, 5)

  return {
    data: {
      total_active: active.length,
      voucher_groups,
      note:
        voucher_groups.length === 0
          ? "Tidak ada voucher aktif saat ini. Tawarkan sambungkan ke tim, jangan meminta kode ke klien."
          : "JANGAN sebut kode voucher sama sekali. Ceritakan sebagai narasi singkat: potongan apa, untuk paket apa, dan bahwa voucher bisa dipilih saat registrasi.",
    },
    evidence: voucher_groups,
  }
}

async function toolProfileStatus(ctx: CsToolContext): Promise<ToolResult> {
  if (!ctx.verified || !ctx.weddingProfileId) {
    return { data: { error: "butuh verifikasi nomor terdaftar" }, evidence: null }
  }

  const profile = await getProfile(ctx.weddingProfileId)
  if (!profile) return { data: { error: "profil tidak ditemukan" }, evidence: null }

  const { count: pendingFeedback } = await supabaseAdmin
    .from("feedback_submissions")
    .select("id", { count: "exact", head: true })
    .eq("wedding_profile_id", ctx.weddingProfileId)
    .neq("status", "resolved")

  const published = profile.is_published === true
  const contentBlockers = published
    ? []
    : (await getPublishBlockers(ctx.weddingProfileId).catch(() => [])).map((item) => item.label)
  // Pembayaran dan konfirmasi bukan bagian dari getPublishBlockers, tapi keduanya
  // juga menahan undangan tayang.
  const blockers = pendingBlockers({
    payment: (profile.payment_status as PaymentState) || "UNPAID",
    contentBlockers,
    published,
  })
  const linkMode = profile.guest_link_strict === false ? "fleksibel" : "terbatas"

  const data = {
    package_type: profile.package_type,
    payment_status: profile.payment_status,
    is_published: published,
    invitation_disabled: !!profile.invitation_disabled_at,
    estimated_wedding_date: profile.estimated_wedding_date,
    slug: profile.slug,
    pending_feedback: pendingFeedback || 0,
    // Tautan & mode: Terbatas = hanya tamu terdaftar ( tautan per tamu ada di
    // dashboard), Fleksibel = satu tautan + ?to=nama.
    invitation_link: profile.slug ? coupleUrl(String(profile.slug), "", profile.event_type) : null,
    link_mode: linkMode,
    dashboard_guest_links: `${eventSite(profile.event_type)}/dashboard/${ctx.weddingProfileId}/qr-guestbook`,
    publish_blockers: blockers,
  }

  return { data, evidence: data }
}

async function toolGuestSummary(ctx: CsToolContext): Promise<ToolResult> {
  if (!ctx.verified || !ctx.weddingProfileId) {
    return { data: { error: "butuh verifikasi nomor terdaftar" }, evidence: null }
  }

  const counts: Record<string, number> = {}
  for (const status of ["HADIR", "TIDAK_HADIR", "BELUM_RESPON"]) {
    const { count } = await supabaseAdmin
      .from("guests")
      .select("id", { count: "exact", head: true })
      .eq("wedding_profile_id", ctx.weddingProfileId)
      .eq("rsvp_status", status)
    counts[status] = count || 0
  }

  const total = counts.HADIR + counts.TIDAK_HADIR + counts.BELUM_RESPON
  const data = { total, hadir: counts.HADIR, tidak_hadir: counts.TIDAK_HADIR, belum_respon: counts.BELUM_RESPON }
  return { data, evidence: data }
}

async function toolDraftState(ctx: CsToolContext): Promise<ToolResult> {
  if (!ctx.verified || !ctx.weddingProfileId) {
    return { data: { error: "butuh verifikasi nomor terdaftar" }, evidence: null }
  }

  const [profile, draft] = await Promise.all([getProfile(ctx.weddingProfileId), getDraftRow(ctx.weddingProfileId)])
  if (!profile) return { data: { error: "profil tidak ditemukan" }, evidence: null }

  const present = presentFields(profile)
  const merged = { ...draft }
  const next = nextQuestion(merged, present)

  const data = {
    next_field: next ? next.key : null,
    question: next ? next.question : "Semua data inti sudah terisi. Ada yang mau diubah?",
    filled: Object.keys(merged),
    already_present: Array.from(present),
  }

  return { data, evidence: data }
}

async function toolSaveDraftField(ctx: CsToolContext, args: Record<string, unknown>): Promise<ToolResult> {  if (!ctx.verified || !ctx.weddingProfileId) {
    return { data: { error: "butuh verifikasi nomor terdaftar" }, evidence: null }
  }

  const key = String(args.key || "").trim()
  if (!FIELD_BY_KEY[key]) {
    return { data: { error: `field ${key} tidak boleh diisi lewat bot` }, evidence: null }
  }

  const raw = parseMaybeJson(args.value)
  const checked = validateField(key, raw)
  if (!checked.ok) {
    return {
      data: {
        saved: false,
        error: checked.message,
        code: checked.code,
        ask_again: FIELD_BY_KEY[key].question,
      },
      evidence: null,
    }
  }

  const draft = await getDraftRow(ctx.weddingProfileId)

  if (requiresConfirmation(key) && args.confirmed !== true) {
    return {
      data: {
        saved: false,
        pending_confirmation: true,
        summary: checked.summary,
        question: `Oke, aku catat ya: ${checked.summary}. Bener kan, Kak? Balas "ya" kalau sudah pas.`,
      },
      evidence: { summary: checked.summary },
    }
  }

  const merged = applyAnswer(draft, key, raw)
  if (!merged.ok) {
    return { data: { saved: false, error: merged.message }, evidence: null }
  }

  const nextDraft = merged.value as Record<string, unknown>
  const { error } = await supabaseAdmin.from("cs_profile_drafts").upsert(
    {
      wedding_profile_id: ctx.weddingProfileId,
      contact_id: ctx.contactId,
      draft: nextDraft,
      status: "draft",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "wedding_profile_id" }
  )
  if (error) return { data: { saved: false, error: error.message }, evidence: null }

  await supabaseAdmin.from("cs_audit").insert({
    actor: `wa:${ctx.contactId}`,
    action: "profile_draft_field",
    subject: ctx.weddingProfileId,
    detail: { key, summary: checked.summary },
  })

  const profile = await getProfile(ctx.weddingProfileId)
  const present = profile ? presentFields(profile) : new Set<string>()
  const next = nextQuestion(nextDraft, present)

  return {
    data: {
      saved: true,
      key,
      summary: checked.summary,
      next_field: next ? next.key : null,
      question: next ? next.question : "Semua data inti sudah terisi.",
    },
    evidence: { key, saved: true, summary: checked.summary },
  }
}

async function toolApplyDraft(ctx: CsToolContext, args: Record<string, unknown>): Promise<ToolResult> {
  if (!ctx.verified || !ctx.weddingProfileId) {
    return { data: { applied: false, error: "butuh verifikasi nomor terdaftar" }, evidence: null }
  }
  if (args.confirm !== true) {
    return {
      data: {
        applied: false,
        needs_confirmation: true,
        question: "Aku terapkan data ini ke undangan sekarang, ya? Balas \"ya, terapkan\".",
      },
      evidence: null,
    }
  }

  const { data: row } = await supabaseAdmin
    .from("cs_profile_drafts")
    .select("id,draft,status")
    .eq("wedding_profile_id", ctx.weddingProfileId)
    .maybeSingle()

  const draft = asRecord((row as { draft?: unknown } | null)?.draft)
  const { patch, rejected } = buildPatch(draft)

  // Ganti template punya rantai sendiri (duplicate → patch → cleanup); jangan
  // pernah diterapkan lewat CS.
  if ("selected_template_id" in patch) delete patch.selected_template_id

  const fields = Object.keys(patch)
  if (!fields.length) {
    return {
      data: {
        applied: false,
        error: "belum ada data tersimpan untuk diterapkan",
        rejected,
      },
      evidence: { rejected },
    }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("wedding_profiles")
    .update(patch)
    .eq("id", ctx.weddingProfileId)
    .select("id,active_wp_post_id")
    .maybeSingle()

  if (profileError) {
    return { data: { applied: false, error: profileError.message }, evidence: null }
  }

  let patchJob: { id: string; status: string } | null = null
  const postId = (profile as { active_wp_post_id?: number | null } | null)?.active_wp_post_id
  if (postId) {
    try {
      const job = await enqueuePatch(ctx.weddingProfileId, postId, { source: "cs" })
      patchJob = { id: String(job.job_id), status: String(job.status) }
    } catch {
      // Data sudah tersimpan; patch WP akan menyusul lewat antrian berikutnya.
    }
  }

  if (row?.id) {
    await supabaseAdmin
      .from("cs_profile_drafts")
      .update({ status: "submitted", updated_at: new Date().toISOString() })
      .eq("id", row.id)
  }

  await supabaseAdmin.from("cs_audit").insert({
    actor: `wa:${ctx.contactId}`,
    action: "profile_applied",
    subject: ctx.weddingProfileId,
    detail: { fields, rejected, wp_patch: patchJob },
  })

  return {
    data: {
      applied: true,
      profile_updated: true,
      fields,
      rejected,
      wp_patch: patchJob,
      note: patchJob
        ? "Data undangan diperbarui; halaman WordPress dipatch lewat antrian."
        : "Data undangan diperbarui.",
    },
    evidence: { profile_updated: true, applied: true, fields, wp_patch: patchJob },
  }
}

async function toolGetLeadState(ctx: CsToolContext): Promise<ToolResult> {
  const lead = await ensureLead(ctx.contactId, ctx.weddingProfileId)
  const missing = missingCoreFacts(lead.facts)
  const next = nextQualifyingQuestion(lead.facts, lead.qualifyAsked)

  const data = {
    stage: lead.stage,
    facts: lead.facts,
    objection_count: lead.objectionCount,
    missing_facts: missing,
    next_field: next?.key || null,
    next_question: next?.question || null,
    opt_out: lead.optOut,
  }

  return { data, evidence: data }
}

async function toolSaveLeadFact(ctx: CsToolContext, args: Record<string, unknown>): Promise<ToolResult> {
  const result = await saveLeadFact(ctx.contactId, String(args.key || ""), args.value)
  if (!result.ok) {
    return { data: { saved: false, error: result.error }, evidence: null }
  }

  return {
    data: {
      saved: true,
      summary: result.summary,
      stage: result.lead?.stage,
      facts: result.lead?.facts,
      next_field: result.next_field,
      next_question: result.next_question,
    },
    evidence: { saved: true, summary: result.summary, facts: result.lead?.facts },
  }
}

async function toolRecommendPackage(ctx: CsToolContext): Promise<ToolResult> {
  const lead = await ensureLead(ctx.contactId, ctx.weddingProfileId)
  const book = await getPriceBook()
  const recommendation = recommendPackage(lead.facts, book)

  const data = {
    recommendation,
    package_name: PACKAGE_LABELS[recommendation.package_code] || recommendation.package_code,
    price: book.base[recommendation.package_code] ?? null,
    facts_used: lead.facts,
    note: "Harga final tetap dari quote_price. Rekomendasi ini berbasis tanggal, kota, jumlah tamu, dan budget.",
  }

  return { data, evidence: data }
}

export async function runTool(name: string, args: Record<string, unknown>, ctx: CsToolContext): Promise<ToolResult> {
  switch (name) {
    case "get_price_book":
      return toolGetPriceBook()
    case "quote_price":
      return toolQuotePrice(args)
    case "list_templates":
      return toolListTemplates(args)
    case "check_voucher":
      return toolCheckVoucher(args)
    case "list_vouchers":
      return toolListVouchers()
    case "get_profile_status":
      return toolProfileStatus(ctx)
    case "get_guest_summary":
      return toolGuestSummary(ctx)
    case "get_draft_state":
      return toolDraftState(ctx)
    case "save_draft_field":
      return toolSaveDraftField(ctx, args)
    case "apply_profile_draft":
      return toolApplyDraft(ctx, args)
    case "get_lead_state":
      return toolGetLeadState(ctx)
    case "save_lead_fact":
      return toolSaveLeadFact(ctx, args)
    case "recommend_package":
      return toolRecommendPackage(ctx)
    default:
      return { data: { error: `tool ${name} tidak dikenal` }, evidence: null }
  }
}

export const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "get_price_book",
      description: "Daftar paket aktif beserta harga, fitur, dan tier WA blast.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "quote_price",
      description:
        "Hitung total paket. WAJIB dipakai untuk setiap angka harga. Voucher opsional dan hanya estimasi.",
      parameters: {
        type: "object",
        properties: {
          package_code: { type: "string", enum: PACKAGE_CODES.filter(isSellablePackage) },
          wa_blast_tier: { type: "integer", minimum: 0 },
          express: { type: "boolean" },
          voucher_code: { type: "string" },
        },
        required: ["package_code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_templates",
      description:
        "Cari template untuk rekomendasi SPESIFIK (kategori, dengan/tanpa foto). " +
        "Untuk permintaan 'semua template / daftar template / lihat di mana', jangan pakai tool ini: " +
        "kirim gallery_url https://wedding.aksaraa.com/templates.",
      parameters: {
        type: "object",
        properties: {
          category: { type: "string" },
          has_photos: { type: "boolean" },
          limit: { type: "integer", minimum: 1, maximum: 20 },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_voucher",
      description: "Cek validitas kode voucher tanpa menghitung total.",
      parameters: {
        type: "object",
        properties: { code: { type: "string" } },
        required: ["code"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_vouchers",
      description: "Daftar voucher yang sedang aktif beserta paket yang berlaku dan sisa kuota.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_profile_status",
      description: "Status produksi dan pembayaran milik klien terverifikasi.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_guest_summary",
      description: "Ringkasan jumlah tamu dan RSVP milik klien terverifikasi. Tanpa data pribadi tamu.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_draft_state",
      description: "Field data pengantin berikutnya yang perlu ditanyakan.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "save_draft_field",
      description:
        "Simpan satu field data pengantin setelah divalidasi. Untuk sesi/cerita/jumlah tamu/template, panggil dulu dengan confirmed=false untuk minta konfirmasi, lalu ulangi dengan confirmed=true.",
      parameters: {
        type: "object",
        properties: {
          key: { type: "string", enum: Object.keys(FIELD_BY_KEY) },
          value: {},
          confirmed: { type: "boolean" },
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "apply_profile_draft",
      description:
        "Terapkan data pengantin yang sudah tersimpan di draft ke undangan. Panggil HANYA setelah klien menyetujui ringkasan (confirm=true). Field uang/paket/tanggal/template tidak pernah diterapkan lewat tool ini.",
      parameters: {
        type: "object",
        properties: { confirm: { type: "boolean" } },
        required: ["confirm"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lead_state",
      description: "Tahap lead, fakta yang sudah terkumpul, dan pertanyaan kualifikasi berikutnya.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "save_lead_fact",
      description:
        "Simpan satu fakta lead (tanggal, kota, jumlah tamu, budget, kebutuhan, paket, template). Panggil setiap kali klien menyebut fakta baru.",
      parameters: {
        type: "object",
        properties: {
          key: {
            type: "string",
            enum: [
              "wedding_date",
              "city",
              "guest_count",
              "budget_band",
              "need",
              "package_interest",
              "template_interest",
            ],
          },
          value: {},
        },
        required: ["key", "value"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recommend_package",
      description:
        "Rekomendasi paket deterministik dari tanggal, kota, jumlah tamu, dan budget. Bukan harga final.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
] as const

export function patchFromDraft(draft: Record<string, unknown>) {
  return buildPatch(draft)
}
