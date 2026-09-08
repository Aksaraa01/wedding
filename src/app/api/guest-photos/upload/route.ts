import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureBucket, uploadFile } from "@/lib/storage"
import { getGuestPhotoQuota } from "@/lib/featureGates"

const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    await ensureBucket()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const wedding_profile_id = formData.get("wedding_profile_id") as string | null
    const guest_id = formData.get("guest_id") as string | null
    const source = formData.get("source") as string | null

    if (!file || !wedding_profile_id || !guest_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
    }

    // Per-guest photo quota follows the selected Buku Tamu Digital package
    // ("Photo by Guest" matrix row: Sistem 2 / Pro 2 / Premium 3 / Prestige 4).
    // Concierge check-in selfies (source="selfie") are operator-initiated and
    // bypass the guest-facing quota so a Foto Check-in is always captured.
    const { data: profile } = await supabaseAdmin
      .from("wedding_profiles")
      .select("package_type")
      .eq("id", wedding_profile_id)
      .single()

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

    const { data, error } = await supabaseAdmin
      .from("guest_photos")
      .insert({
        wedding_profile_id,
        guest_id,
        image_url: imageUrl,
        source: isSelfie ? "selfie" : "gallery",
      })
      .select("id, image_url, source")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
