import { NextRequest, NextResponse } from "next/server"
import { ensureBucket, uploadFile } from "@/lib/storage"

export async function POST(req: NextRequest) {
  try {
    await ensureBucket()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folder = (formData.get("folder") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 })
    }

    const name = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const url = await uploadFile(file, folder, name)

    return NextResponse.json({ url, path: `${folder}/${name}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
