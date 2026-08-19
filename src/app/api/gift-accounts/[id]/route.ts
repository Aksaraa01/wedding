import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { provider_name, provider_logo_url, account_number, account_name, qris_image_url, sort_order } = body
    const { type } = body

    const updateData: Record<string, unknown> = {}
    if (provider_name !== undefined) updateData.provider_name = provider_name
    if (provider_logo_url !== undefined) updateData.provider_logo_url = provider_logo_url
    if (account_number !== undefined) updateData.account_number = account_number
    if (account_name !== undefined) updateData.account_name = account_name
    if (qris_image_url !== undefined) updateData.qris_image_url = qris_image_url
    if (type !== undefined) updateData.type = type
    if (sort_order !== undefined) updateData.sort_order = sort_order

    const { data, error } = await supabaseAdmin
      .from("gift_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ account: data })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { error } = await supabaseAdmin
      .from("gift_accounts")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
