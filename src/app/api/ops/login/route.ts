import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { normalizePhone } from "@/lib/packages"

export async function POST(req: Request) {
  try {
    const { phone_number, pin } = await req.json()

    if (!phone_number || !pin) {
      return NextResponse.json({ error: "Nomor HP dan PIN harus diisi" }, { status: 400 })
    }

    if (pin.length !== 6) {
      return NextResponse.json({ error: "PIN harus 6 digit" }, { status: 400 })
    }

    const normalized = normalizePhone(phone_number)

    const { data: employee, error } = await supabaseAdmin
      .from("employees")
      .select("id, name, phone_number, role")
      .eq("phone_number", normalized)
      .eq("pin", pin)
      .eq("is_active", true)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!employee) {
      return NextResponse.json({ error: "Kredensial tidak valid" }, { status: 401 })
    }

    return NextResponse.json({ employee })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
