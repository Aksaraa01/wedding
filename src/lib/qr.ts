import { supabaseAdmin } from "@/lib/supabase"

function randomPart(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8)
}

export function generateToken(): string {
  return `AKS-${randomPart()}-${randomPart()}`
}

export async function generateUniqueToken(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const token = generateToken()
    const { data } = await supabaseAdmin
      .from("guests")
      .select("id")
      .eq("qr_token", token)
      .maybeSingle()
    if (!data) return token
  }
  return generateToken()
}
