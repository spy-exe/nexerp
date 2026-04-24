"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { useAuthStore } from "@/stores/auth-store"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const accessToken = useAuthStore((state) => state.accessToken)

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login")
    }
  }, [accessToken, router])

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_35%),linear-gradient(180deg,_#f6f1e8_0%,_#f8fafc_60%)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AppSidebar pathname={pathname} />
        <main className="flex-1 px-5 py-5 md:px-8 md:py-8">
          <AppHeader />
          <div className="mt-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
