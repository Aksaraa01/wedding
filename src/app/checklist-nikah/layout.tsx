import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Checklist Persiapan Pernikahan 12 Bulan–Hari-H",
  description:
    "Checklist persiapan nikah interaktif: gedung, vendor, undangan digital, RSVP, buku tamu, centang progres, tersimpan otomatis, bisa dicetak.",
  alternates: { canonical: `${siteOrigin()}/checklist-nikah` },
  openGraph: {
    title: "Checklist Persiapan Pernikahan | Aksaraa",
    description:
      "Daftar persiapan nikah bertahap dengan progres tersimpan otomatis, tidak ada yang terlewat sampai hari-H.",
  },
}

export default function ChecklistNikahLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
