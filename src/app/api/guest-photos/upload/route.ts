import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureBucket, uploadFile, deleteFile } from "@/lib/storage"
import { storagePathFromUrl } from "@/lib/storageUrl"
import { getGuestPhotoQuota } from "@/lib/featureGates"
import {
  getGalleryEventByToken,
  galleryWindowStatus,
  getGalleryQuota,
  countDevicePhotos,
} from "@/lib/gallery"
import { isValidGuestCategory } from "@/lib/guest-slug"
import { sanitizeGuestName } from "@/lib/nameClean"
import { checkRateLimit, getClientIp, rateLimited } from "@/lib/rateLimit"

const MAX_SIZE = 10 * 1024 * 1024
const MAX_NAME = 32
const MAX_CAPTION = 140

type RpcResult = {
  ok: boolean
  dedup?: boolean
  code?: string
  photo?: { id: string; image_url: string; caption: string | null; created_at: string }
}

function rpcErrorStatus(code: string): number {
  switch (code) {
    case "QUOTA_DEVICE":
    case "QUOTA_EVENT":
      return 409
    case "UPCOMING":
    case "ENDED":
    case "NOT_CONFIGURED":
      return 410
    default:
      return 400
  }
}

function rpcErrorMessage(code: string, quota: number): string {
  switch (code) {
    case "QUOTA_DEVICE":
      return `Slot foto perangkat ini sudah habis (${quota} foto).`
    case "QUOTA_EVENT":
      return "Kuota foto acara sudah penuh. Silakan hubungi mempelai."
    case "UPCOMING":
      return "QR belum aktif. QR hanya aktif 1 jam sebelum acara dimulai."
    case "ENDED":
      return "QR sudah tidak aktif. Terima kasih sudah hadir!"
    default:
      return "Acara belum siap. Silakan coba lagi nanti."
  }
}

// Gallery (QR umum) upload path: gallery_token + device identity.
// Quota + window are enforced atomically inside the insert_gallery_photo
// RPC (advisory lock per event), so parallel uploads cannot overrun the
// per-device quota or the per-event cap. capture_id makes retries and
// double-taps idempotent.
async function handleGalleryUpload(
  req: NextRequest,
  file: File,
  formData: FormData
): Promise<NextResponse> {
  const ip = getClientIp(req)
  const galleryToken = (formData.get("gallery_token") as string | null) || ""
  const deviceId = (formData.get("device_id") as string | null) || ""
  const captureId = (formData.get("capture_id") as string | null) || ""
  const rawName = ((formData.get("uploader_name") as string | null) || "").trim()
  const category = (formData.get("category") as string | null) || ""
  const caption = (((formData.get("caption") as string | null) || "").trim()).slice(0, MAX_CAPTION)

  if (!galleryToken || !deviceId || !captureId) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
  }
  if (!/^[0-9a-f-]{8,64}$/i.test(deviceId)) {
    return NextResponse.json({ error: "Perangkat tidak valid" }, { status: 400 })
  }
  const name = sanitizeGuestName(rawName).replace(/ +/g, " ").trim().slice(0, MAX_NAME)
  if (!name) {
    return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 })
  }
  if (!isValidGuestCategory(category)) {
    return NextResponse.json({ error: "Kategori wajib dipilih" }, { status: 400 })
  }

  // Venue reality: dozens of guests share one public Wi-Fi IP. The old
  // per-IP+token bucket (20/h) turned guest #21 into a 429 even though every
  // device was legitimate. Scope the tight bucket to the device (the same
  // identity the per-guest quota uses) and keep a much looser per-IP ceiling
  // as an abuse backstop.
  const deviceRl = checkRateLimit(`gallery-upload:device:${deviceId}`, 12, 60 * 60 * 1000)
  if (!deviceRl.ok) return rateLimited(deviceRl.retryAfterMs || 60 * 60 * 1000)
  const ipRl = checkRateLimit(`gallery-upload:ip:${ip}`, 1000, 60 * 60 * 1000)
  if (!ipRl.ok) return rateLimited(ipRl.retryAfterMs || 60 * 60 * 1000)

  const event = await getGalleryEventByToken(galleryToken)
  if (!event) {
    return NextResponse.json({ error: "QR tidak valid" }, { status: 404 })
  }
  if (event.payment_status === "UNPAID") {
    return NextResponse.json({ error: "Galeri belum aktif." }, { status: 403 })
  }
  if (event.photos_cleared_at) {
    return NextResponse.json(
      { error: "Masa aktif galeri telah berakhir.", code: "CLEARED" },
      { status: 410 }
    )
  }
  // Cheap pre-check before touching storage bytes; the RPC re-checks
  // authoritatively inside its lock (TOCTOU-safe).
  const window = galleryWindowStatus(event.gallery_start_at, event.gallery_end_at)
  if (window !== "active") {
    return NextResponse.json(
      { error: rpcErrorMessage(window === "upcoming" ? "UPCOMING" : "ENDED", 0), code: window.toUpperCase() },
      { status: 410 }
    )
  }

  // Idempotency first: a retried capture returns the original row without
  // re-uploading bytes (saves egress on flaky venue networks).
  const { data: existing } = await supabaseAdmin
    .from("guest_photos")
    .select("id, image_url, caption, created_at")
    .eq("idempotency_key", captureId)
    .maybeSingle()
  if (existing) {
    const used = await countDevicePhotos(event.id, deviceId)
    const { quota } = await getGalleryQuota(event.id, event.package_type)
    return NextResponse.json({ photo: existing, dedup: true, used, quota })
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg"
  const objectName = `${captureId}-${Date.now()}.${ext}`
  let imageUrl: string
  try {
    imageUrl = await uploadFile(file, "guest-photos", objectName)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah foto"
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { quota, cap } = await getGalleryQuota(event.id, event.package_type)
  if (quota <= 0 || cap <= 0) {
    const path = storagePathFromUrl(imageUrl)
    if (path) { try { await deleteFile(path) } catch {} }
    return NextResponse.json({ error: "Galeri tidak tersedia untuk paket ini." }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin.rpc("insert_gallery_photo", {
    p_profile_id: event.id,
    p_device_id: deviceId,
    p_name: name,
    p_category: category,
    p_caption: caption || null,
    p_image_url: imageUrl,
    p_idem: captureId,
    p_quota: quota,
    p_cap: cap,
  })

  const result = (data || null) as RpcResult | null
  if (error || !result) {
    const path = storagePathFromUrl(imageUrl)
    if (path) { try { await deleteFile(path) } catch {} }
    return NextResponse.json({ error: error?.message || "Gagal menyimpan foto" }, { status: 500 })
  }

  if (!result.ok) {
    // Quota/window lost the race after bytes were stored — remove the orphan.
    const path = storagePathFromUrl(imageUrl)
    if (path) { try { await deleteFile(path) } catch {} }
    const code = result.code || "UNKNOWN"
    return NextResponse.json(
      { error: rpcErrorMessage(code, quota), code },
      { status: rpcErrorStatus(code) }
    )
  }

  if (result.dedup) {
    // Lost a same-capture race: our bytes are orphaned, the winner stands.
    const path = storagePathFromUrl(imageUrl)
    if (path) { try { await deleteFile(path) } catch {} }
  }

  const used = await countDevicePhotos(event.id, deviceId)
  return NextResponse.json({ photo: result.photo, dedup: !!result.dedup, used, quota })
}

export async function POST(req: NextRequest) {
  try {
    await ensureBucket()

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 10MB" }, { status: 400 })
    }

    // Event-QR (Galeri standalone) path — device identity, no guest row.
    if (formData.get("gallery_token")) {
      return handleGalleryUpload(req, file, formData)
    }

    // Legacy per-guest path (Buku Tamu Digital via /welcome). Unchanged
    // behavior; caption is persisted when provided.
    const wedding_profile_id = formData.get("wedding_profile_id") as string | null
    const guest_id = formData.get("guest_id") as string | null
    const source = formData.get("source") as string | null

    if (!wedding_profile_id || !guest_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    // Per-guest photo quota follows the selected Buku Tamu Digital package
    // ("Photo by Guest" matrix row: Sistem 2 / Pro 2 / Premium 3 / Prestige 4).
    // Concierge check-in selfies (source="selfie") are operator-initiated and
    // bypass the guest-facing quota so a Foto Check-in is always captured.
    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("package_type, photos_cleared_at")
      .eq("id", wedding_profile_id)
      .single()

    // Clearance teardown removed this couple's photos (and disallows new ones).
    if ((profile as { photos_cleared_at?: string | null } | null)?.photos_cleared_at) {
      return NextResponse.json(
        { error: "Masa aktif galeri telah berakhir.", code: "CLEARED" },
        { status: 410 }
      )
    }

    const isSelfie = source === "selfie"

    if (!isSelfie) {
      const quota = await getGuestPhotoQuota(profile?.package_type || "signature")
      if (quota <= 0) {
        return NextResponse.json({ error: "Fitur galeri foto tamu tidak tersedia untuk paket ini." }, { status: 403 })
      }

      const { count: existingCount } = await supabaseAdmin
        .from("guest_photos")
        .select("id", { count: "exact", head: true })
        .eq("guest_id", guest_id)
        .neq("source", "selfie")

      if ((existingCount || 0) >= quota) {
        return NextResponse.json(
          { error: `Batas unggah foto Anda adalah ${quota} foto. Silakan hubungi pasangan untuk kuota tambahan.` },
          { status: 409 }
        )
      }
    }

    const ext = file.name.split(".").pop() || "jpg"
    const name = `${guest_id}-${Date.now()}.${ext}`
    const imageUrl = await uploadFile(file, "guest-photos", name)

    const caption = (((formData.get("caption") as string | null) || "").trim()).slice(0, MAX_CAPTION) || null

    const { data, error } = await supabaseAdmin
      .from("guest_photos")
      .insert({
        wedding_profile_id,
        guest_id,
        image_url: imageUrl,
        source: isSelfie ? "selfie" : "gallery",
        caption,
      })
      .select("id, image_url, source")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photo: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
