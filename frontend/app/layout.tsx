import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

import { Providers } from "@/components/providers"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "600"]
})

export const metadata: Metadata = {
  title: "NexERP | O ERP que sua empresa merece",
  description: "ERP gratuito, completo e sem complicação para pequenas e médias empresas brasileiras.",
  icons: {
    icon: "/favicon.svg"
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
