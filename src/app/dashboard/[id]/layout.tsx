import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardShell from "@/components/dashboard/DashboardShell"
import { canAccessProfile } from "@/lib/requireProfileAccess"
import CsWidget from "@/components/cs/CsWidget"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // The API routes are session-gated, so an expired cookie used to render a
  // shell whose panels all came back empty. Send the visitor to login instead.
  const store = await cookies()
  const cookieHeader = store
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ")
  const allowed = await canAccessProfile(
    new Request("http://internal/dashboard", { headers: { cookie: cookieHeader } }),
    id,
  )
  if (!allowed) redirect("/login")

  return (
    <>
      <DashboardShell id={id}>{children}</DashboardShell>
      <CsWidget />
    </>
  )
}
