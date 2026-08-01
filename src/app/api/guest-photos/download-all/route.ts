import { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { ZipArchive } from "archiver"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function sanitizeName(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim() || "Tamu"
}

function fileExt(url: string): string {
  const clean = url.split("?")[0]
  const match = clean.match(/\.([a-zA-Z0-9]+)$/)
  return match ? match[1].toLowerCase() : "jpg"
}

export async function GET(req: NextRequest) {
  const weddingProfileId = req.nextUrl.searchParams.get("wedding_profile_id")

  if (!weddingProfileId) {
    return new Response("wedding_profile_id diperlukan", { status: 400 })
  }

  const { data: photos, error } = await supabaseAdmin
    .from("guest_photos")
    .select("id, image_url, created_at, guests(name, category)")
    .eq("wedding_profile_id", weddingProfileId)
    .order("created_at", { ascending: false })

  if (error) {
    return new Response(error.message, { status: 500 })
  }
  if (!photos || photos.length === 0) {
    return new Response("Belum ada foto untuk diunduh", { status: 404 })
  }

  const archive = new ZipArchive({ zlib: { level: 6 } })

  let appended = 0
  let failed = 0
  const pending: Promise<void>[] = []

  for (const photo of photos) {
    const guest = Array.isArray(photo.guests) ? photo.guests[0] : (photo.guests as { name?: string } | null)
    const guestName = sanitizeName(guest?.name || "Tamu")
    const ext = fileExt(photo.image_url)
    const fileName = `${photo.id}.${ext}`

    const p = fetch(photo.image_url)
      .then((res) => {
        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
        if (!res.body) throw new Error("empty body")
        return res.arrayBuffer()
      })
      .then((buf) => {
        archive.append(Buffer.from(buf), { name: `${guestName}/${fileName}` })
        appended++
      })
      .catch(() => {
        failed++
      })

    pending.push(p)
  }

  await Promise.all(pending)

  const body = new ReadableStream({
    start(controller) {
      archive.on("data", (chunk: Buffer) => controller.enqueue(chunk))
      archive.on("end", () => controller.close())
      archive.on("error", (err: Error) => controller.error(err))
    },
  })

  archive.finalize()

  return new Response(body, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="galeri-kenangan.zip"`,
      "X-Zip-Files": String(appended),
      "X-Zip-Failed": String(failed),
    },
  })
}
