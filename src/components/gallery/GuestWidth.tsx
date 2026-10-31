"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

// Guest pages live in a phone-width column (max-w-lg), but the camera must be
// able to reach the screen edges — otherwise a landscape / fullscreen phone
// shows dead space on the left and right with no UI.
export default function GuestWidth({ children }: { children: ReactNode }) {
  const pathname = usePathname() || ""
  const fullBleed = /\/kamera\/?$/.test(pathname)
  return <div className={`w-full flex-1 flex flex-col relative ${fullBleed ? "" : "max-w-lg"}`}>{children}</div>
}
