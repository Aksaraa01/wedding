import type { Metadata, Viewport } from "next"

export const metadata: Metadata = {
  title: { absolute: "Buat Undangan | Ceriavite" },
  description:
    "Daftarkan ananda dan buat undangan digital khitanan, aqiqah, atau ulang tahun. Satu paket Rp 199.000.",
  robots: { index: false, follow: true },
  manifest: "/manifest-ceriavite.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function DaftarLayout({ children }: { children: React.ReactNode }) {
  return children
}
