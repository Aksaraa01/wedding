import type { Metadata } from "next"
import DesignPage from "@/components/design/DesignPage"
import CsWidget from "@/components/cs/CsWidget"

const APEX = "https://aksaraa.com"

export const metadata: Metadata = {
  title: {
    absolute: "Desain Undangan Pernikahan & Acara Lain | Aksaraa",
  },
  description:
    "Koleksi desain undangan digital Aksaraa untuk pernikahan, khitanan, aqiqah, dan ulang tahun. Saring berdasarkan gaya, buka pratinjau langsung, lalu pilih desain — sekali bayar, tanpa langganan.",
  alternates: { canonical: `${APEX}/` },
  openGraph: {
    type: "website",
    url: `${APEX}/`,
    siteName: "Aksaraa",
    locale: "id_ID",
    title: "Desain Undangan Pernikahan & Acara Lain | Aksaraa",
    description:
      "Desain undangan digital untuk pernikahan dan acara keluarga: saring gaya, buka pratinjau langsung, pilih desain favorit.",
    images: [
      {
        url: `${APEX}/og/aksaraa-design.jpg`,
        width: 1200,
        height: 630,
        alt: "Katalog desain undangan digital Aksaraa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desain Undangan Pernikahan & Acara Lain | Aksaraa",
    description:
      "Desain undangan digital untuk pernikahan dan acara keluarga, lengkap dengan pratinjau langsung.",
    images: [`${APEX}/og/aksaraa-design.jpg`],
  },
}

// Template rows change rarely; a short ISR window keeps ops edits visible
// without an SSR round-trip on every visit to the apex homepage.
export const revalidate = 300

export default function DesignRoute() {
  return (
    <>
      <DesignPage />
      <CsWidget />
    </>
  )
}
