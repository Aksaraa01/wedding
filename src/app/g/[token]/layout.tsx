import type { Metadata } from "next"
import GuestWidth from "@/components/gallery/GuestWidth"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function GalleryGuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center" style={{ backgroundColor: "#fbf9f4" }}>
      <GuestWidth>{children}</GuestWidth>
    </div>
  )
}
