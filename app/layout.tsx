import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Fraunces } from "next/font/google"

import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
})

const nunito = DM_Sans({ // Declared the nunito variable here
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "LUMEN - Tu apoyo emocional",
  description:
    "Una luz en tus momentos difíciles. Plataforma de apoyo emocional con IA y profesionales de salud mental.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${fraunces.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
