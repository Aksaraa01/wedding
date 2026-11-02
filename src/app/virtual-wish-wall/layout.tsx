import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Wish Wall Digital: Papan Ucapan Pernikahan di Layar",
  description:
    "Abadikan doa dan ucapan tamu dalam karya visual elegan: wish wall digital dengan moderasi instan, tayang live di layar resepsi pernikahan.",
  alternates: { canonical: "https://wedding.aksaraa.com/virtual-wish-wall" },
  openGraph: {
    title: "Wish Wall Digital untuk Pernikahan | Aksaraa",
    description:
      "Papan ucapan digital dengan moderasi instan, doa tamu tayang live dan elegan di layar resepsi Anda.",
  },
}

export default function VirtualWishWallLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
