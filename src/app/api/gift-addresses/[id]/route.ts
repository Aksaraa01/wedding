import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { cleanBlock, cleanLine } from "@/lib/plainText"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { recipient_name, phone, full_address, city, postal_code } = body

    const updateData: Record<string, unknown> = {}
    if (recipient_name !== undefined) updateData.recipient_name = cleanLine(recipient_name, 120)
    if (phone !== undefined) updateData.phone = cleanLine(phone, 40)
    if (full_address !== undefined) updateData.full_address = cleanBlock(full_address, 600)
    if (city !== undefined) updateData.city = cleanLine(city, 80)
    if (postal_code !== undefined) updateData.postal_code = cleanLine(postal_code, 20)

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
