import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { recipient_name, phone, full_address, city, postal_code } = body

    const updateData: Record<string, unknown> = {}
    if (recipient_name !== undefined) updateData.recipient_name = recipient_name
    if (phone !== undefined) updateData.phone = phone
    if (full_address !== undefined) updateData.full_address = full_address
    if (city !== undefined) updateData.city = city
    if (postal_code !== undefined) updateData.postal_code = postal_code

    const { data, error } = await supabaseAdmin
      .from("gift_addresses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ address: data })
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
      .from("gift_addresses")
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
