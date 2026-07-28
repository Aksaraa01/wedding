import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) return new NextResponse("Missing url", { status: 400 })

  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new NextResponse(blob, {
      headers: {
        "Content-Type": res.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch {
    return new NextResponse("Proxy failed", { status: 502 })
  }
}
