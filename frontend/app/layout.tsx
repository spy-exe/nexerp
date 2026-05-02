import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import localFont from "next/font/local"

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

const geist = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2",
      weight: "500",
      style: "normal"
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2",
      weight: "600",
      style: "normal"
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2",
      weight: "700",
      style: "normal"
    }
  ],
  variable: "--font-geist"
})

const geistMono = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2",
      weight: "400",
      style: "normal"
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2",
      weight: "500",
      style: "normal"
    }
  ],
  variable: "--font-geist-mono"
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
      className={`${inter.variable} ${mono.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
