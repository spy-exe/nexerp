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
  title: "NexERP | ERP open source brasileiro",
  description: "ERP open source para PMEs brasileiras com comercial, financeiro, estoque, fiscal, auditoria e permissões.",
  icons: {
    icon: "/favicon.svg"
  }
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
