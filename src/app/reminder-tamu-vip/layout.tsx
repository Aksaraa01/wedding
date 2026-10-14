import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reminder WhatsApp Otomatis untuk Tamu Undangan",
  description:
    "Pastikan tamu kehormatan hadir: reminder WhatsApp otomatis, blast undangan, RSVP via WA, tautan unik, dan nomor meja untuk setiap tamu.",
  alternates: { canonical: "https://wedding.aksaraa.com/reminder-tamu-vip" },
  openGraph: {
    title: "Reminder WhatsApp Otomatis untuk Tamu | Aksaraa",
    description:
      "Blast undangan dan pengingat otomatis via WhatsApp dengan RSVP, tautan unik, dan nomor meja per tamu.",
  },
}

export default function ReminderVipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
