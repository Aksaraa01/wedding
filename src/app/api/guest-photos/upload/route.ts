import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ensureBucket, uploadFile } from "@/lib/storage"

const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    await ensureBucket()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const wedding_profile_id = formData.get("wedding_profile_id") as string | null
    const guest_id = formData.get("guest_id") as string | null

    if (!file || !wedding_profile_id || !guest_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Ukuran file maksimal 5MB" }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from("guest_photos")
      .select("id")
      .eq("guest_id", guest_id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: "Anda sudah mengunggah foto sebelumnya. Setiap tamu hanya dapat mengunggah satu foto." }, { status: 409 })
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
      })
      .select("id, image_url")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ photo: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
