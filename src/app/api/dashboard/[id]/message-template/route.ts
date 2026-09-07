import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAuth } from "@/lib/requireAuth"

const VALID = ["nasional", "international", "muslim", "kristen", "budha", "hindu"]

// PUT /api/dashboard/[id]/message-template — persist the couple's selected
// WhatsApp invitation-message template category.
export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req)
  if (auth) return auth

  const { id } = await ctx.params
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 })
  }

  const category = String(body.category || "").trim().toLowerCase()
  if (!VALID.includes(category)) {
    return NextResponse.json({ error: "Kategori tidak valid" }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from("wedding_profiles")
    .update({ message_category: category })
    .eq("id", id)
    .select("message_category")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message_category: data?.message_category })
}