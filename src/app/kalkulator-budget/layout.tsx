import { siteOrigin } from "@/lib/site"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Kalkulator Budget Pernikahan: Hitung Estimasi Biaya Nikah",
  description:
    "Hitung estimasi budget pernikahan: atur jumlah tamu, sesuaikan pos venue, katering, MUA, dekor, WO, total otomatis plus tips hemat undangan digital.",
  alternates: { canonical: `${siteOrigin()}/kalkulator-budget` },
  openGraph: {
    title: "Kalkulator Budget Pernikahan | Aksaraa",
    description:
      "Estimasi biaya nikah otomatis: venue, katering, MUA, dekor, WO, souvenir, plus tips menghemat jutaan rupiah.",
  },
}

export default function KalkulatorBudgetLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
