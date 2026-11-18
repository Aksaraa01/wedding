import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { randomUUID } from "node:crypto"

import { supabaseAdmin } from "@/lib/supabase"
import { uploadFile } from "@/lib/storage"
import { checkRateLimit, rateLimited } from "@/lib/rateLimit"
import { COUPLE_COOKIE, getSessionToken, verifySession } from "@/lib/sessionToken"
import { getOnboardingState, handleOnboardingUpload } from "@/lib/cs/onboarding"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const CS_COOKIE = "cs_session"
const MAX_BYTES = 8 * 1024 * 1024

// POST /api/cs/upload — foto untuk alur isi undangan.
// Hanya untuk pasangan yang sudah login (cookie couple) dan hanya ketika alur
// memang sedang meminta foto (pendingUpload), supaya tidak jadi file dump.
export async function POST(request: Request) {
  const session = await verifySession(getSessionToken(request, COUPLE_COOKIE), "couple")
  const profileId = session?.sub
  if (!profileId) {
    return NextResponse.json(
      { error: "Masuk dulu ya Kak biar fotonya bisa disimpan ke undangan." },
      { status: 401 }
    )
  }

  const rate = checkRateLimit(`cs-upload:${profileId}`, 10, 10 * 60_000)
  if (!rate.ok) return rateLimited(rate.retryAfterMs!)

  const { state } = await getOnboardingState(profileId)
  if (!state?.pendingUpload) {
    return NextResponse.json(
      { error: "Sekarang belum ada foto yang diminta. Bilang \"bantu isi undangan\" dulu ya Kak." },
      { status: 400 }
    )
  }

  let file: File | null = null
  try {
    const form = await request.formData()
    const value = form.get("file")
    if (value instanceof File) file = value
  } catch {
    return NextResponse.json({ error: "format upload tidak valid" }, { status: 400 })
  }

  if (!file) return NextResponse.json({ error: "file foto tidak ditemukan" }, { status: 400 })
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Hanya file gambar (JPG/PNG/WebP)." }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Foto terlalu besar (maks 8MB)." }, { status: 400 })
  }

  const cookieStore = await cookies()
  const sessionId = cookieStore.get(CS_COOKIE)?.value || ""
  let contactId: string | null = null
  if (sessionId) {
    const { data: contact } = await supabaseAdmin
      .from("cs_contacts")
      .select("id")
      .eq("wa_jid", `web:${sessionId}`)
      .maybeSingle()
    contactId = (contact?.id as string) || null
  }

  try {
    const url = await uploadFile(file, "cs-uploads", `${profileId}/${Date.now()}-${randomUUID().slice(0, 8)}`)
    const reply = contactId
      ? await handleOnboardingUpload(profileId, contactId, url)
      : "Foto tersimpan."
    return NextResponse.json({ url, reply })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Foto gagal diunggah." },
      { status: 500 }
    )
  }
}
