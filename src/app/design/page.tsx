import type { Metadata } from "next"
import DesignPage from "@/components/design/DesignPage"

const APEX = "https://aksaraa.com"

export const metadata: Metadata = {
  title: {
    absolute: "Desain Undangan Pernikahan & Acara Lain | Aksaraa",
  },
  description:
    "Jelajahi koleksi desain undangan digital Aksaraa: pernikahan, khitanan, aqiqah, dan ulang tahun. Saring berdasarkan gaya, lihat pratinjau langsung, lalu pilih desain favorit.",
  alternates: { canonical: `${APEX}/` },
  openGraph: {
    type: "website",
    url: `${APEX}/`,
    siteName: "Aksaraa",
    title: "Desain Undangan Pernikahan & Acara Lain | Aksaraa",
    description:
      "Ratusan desain undangan digital untuk pernikahan dan acara keluarga. Pratinjau langsung, filter gaya, dan tautan tamu dalam satu paket.",
    images: [
      {
        url: `${APEX}/og/aksaraa-wedding.jpg`,
        width: 1200,
        height: 630,
        alt: "Desain undangan digital Aksaraa",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Desain Undangan Pernikahan & Acara Lain | Aksaraa",
    description: "Koleksi desain undangan digital Aksaraa dengan pratinjau langsung.",
    images: [`${APEX}/og/aksaraa-wedding.jpg`],
  },
}

// Template rows change rarely; a short ISR window keeps ops edits visible
// without an SSR round-trip on every visit to the apex homepage.
export const revalidate = 300

export default function DesignRoute() {
  return <DesignPage />
}
