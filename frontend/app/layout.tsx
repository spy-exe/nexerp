import type { Metadata } from "next"
import { Manrope, Space_Mono } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
})

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"]
})

export const metadata: Metadata = {
  title: "NexERP",
  description: "ERP open source para pequenas e médias empresas brasileiras."
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${manrope.variable} ${spaceMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
