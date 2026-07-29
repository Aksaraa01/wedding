import { NextRequest, NextResponse } from "next/server"
import { ensureBucket, uploadFile } from "@/lib/storage"

export async function POST(req: NextRequest) {
  try {
    await ensureBucket()

    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya file gambar yang diizinkan" }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Maksimal 10MB" }, { status: 400 })
    }

    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const url = await uploadFile(file, "template-media", name)

    return NextResponse.json({ url, path: `template-media/${name}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}