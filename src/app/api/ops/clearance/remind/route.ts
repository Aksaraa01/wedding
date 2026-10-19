import { NextResponse } from "next/server"
import { requireOpsEmployee } from "@/lib/ops-auth"
import { markReminded } from "@/lib/clearanceExecutor"
import { todayIso } from "@/lib/lifecycle"

export async function POST(req: Request) {
  const auth = await requireOpsEmployee(req, { allowedRoles: ["admin", "sales"] })
  if (!auth.ok) return auth.res

  const body = await req.json().catch(() => ({}))
  const profileId = body?.profileId as string | undefined
  const kind = body?.kind as string | undefined
  if (!profileId || (kind !== "photos" && kind !== "invitation")) {
    return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 })
  }

  try {
    const dueAt = typeof body?.dueAt === "string" ? body.dueAt.slice(0, 10) : todayIso()
    await markReminded(profileId, kind, dueAt)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
