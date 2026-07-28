import { NextResponse } from "next/server"
import { ensureBucket } from "@/lib/storage"

export async function POST() {
  try {
    await ensureBucket()
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
