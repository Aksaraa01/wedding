import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

type Opts = { allowAnon?: boolean }

export async function requireAuth(req: Request, opts: Opts = {}) {
  const strict = process.env.STRICT_AUTH === "1"
  if (!strict) return null
  if (opts.allowAnon) return null
  const auth = req.headers.get("authorization")
  if (auth?.startsWith("Bearer ")) {
    const token = auth.slice(7)
    const { data } = await supabaseAdmin.auth.getUser(token)
    if (data?.user) return null
  }
  const cookie = req.headers.get("cookie") || ""
  if (cookie.includes("sb-") || cookie.includes("supabase")) return null
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
