import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Template Undangan Pernikahan Digital Premium",
  description:
    "Pilih dari 100+ template undangan pernikahan digital: adat, modern, floral, tanpa foto. Lengkap dengan RSVP, amplop digital, dan galeri foto.",
  alternates: { canonical: "https://wedding.aksaraa.com/premium-web-invitation" },
  openGraph: {
    title: "Template Undangan Pernikahan Digital Premium | Aksaraa",
    description:
      "Ratusan template undangan website pernikahan — adat, modern, floral, tanpa foto — siap pakai dengan RSVP dan amplop digital.",
  },
}

export default function PremiumWebInvitationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
