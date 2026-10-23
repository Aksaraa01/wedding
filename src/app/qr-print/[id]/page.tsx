import type { Metadata } from "next"
import QrPrintClient from "./QrPrintClient"

export const metadata: Metadata = {
  title: "Cetak QR Tamu",
  robots: { index: false, follow: false },
}

export default async function QrPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ autoprint?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  return <QrPrintClient id={id} autoprint={query.autoprint === "1"} />
}
