import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/packages"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get("q") || ""
  const phone = normalizePhone(raw)

  if (!phone) {
    return NextResponse.json({ exists: false })
  }

  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle()

  return NextResponse.json({ exists: !!data })
}
