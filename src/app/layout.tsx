import type { Metadata } from "next"
import { Inter, Playfair_Display, Cormorant_Garamond } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
})

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Aksaraa Wedding — Platform Pernikahan Naratif",
  description:
    "Aksaraa: Mengubah janji suci dan perjalanan cinta Anda menjadi kisah digital interaktif yang memikat.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body
        className={`${inter.variable} ${playfair.variable} ${cormorant.variable} font-body-md bg-background text-on-surface`}
        data-mode="connect"
      >
        {children}
      </body>
    </html>
  )
}