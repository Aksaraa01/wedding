import type { CSSProperties } from "react"

// Dark Split Rail typography. The reference design uses literal Times New Roman
// for display, Public Sans for body, Baskervville for buttons, Lora for the
// verse and Jura for the gift cards. Only the non-system families are vendored
// (public/fonts + src/app/fonts.css); Times stays a system stack.
export const FONT_DISPLAY: CSSProperties = { fontFamily: '"Times New Roman", Times, serif' }
export const FONT_BODY: CSSProperties = { fontFamily: "var(--font-publicsans, 'Public Sans'), sans-serif" }
export const FONT_BTN: CSSProperties = { fontFamily: "var(--font-baskervville, 'Baskervville'), serif" }
export const FONT_VERSE: CSSProperties = { fontFamily: "var(--font-lora, 'Lora'), serif" }
export const FONT_GIFT: CSSProperties = { fontFamily: "var(--font-jura, 'Jura'), sans-serif" }
export const FONT_CLOSE: CSSProperties = { fontFamily: "var(--font-poppins, 'Poppins'), sans-serif" }

export const COLORS = {
  ink: "#1B1B18",
  cream: "#F2F1EE",
  fill: "rgba(175, 172, 166, 0.27)",
  rail: "rgba(0, 0, 0, 0.12)",
  error: "#DB0000",
}

export const RAIL_PAD = "px-9 py-16"
