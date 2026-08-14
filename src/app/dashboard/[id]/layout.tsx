import DashboardShell from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <DashboardShell id={id}>{children}</DashboardShell>
}
