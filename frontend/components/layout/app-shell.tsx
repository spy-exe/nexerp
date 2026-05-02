"use client"

import { useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef } from "react"

import { AppHeader } from "@/components/layout/app-header"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { warmAppNavigation } from "@/lib/app-prefetch"
import { useAuthStore } from "@/stores/auth-store"

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const queryClient = useQueryClient()
  const navigationWarmed = useRef(false)
  const accessToken = useAuthStore((state) => state.accessToken)
  const company = useAuthStore((state) => state.company)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)

  useEffect(() => {
    if (!hasHydrated) {
      return
    }
    if (!accessToken) {
      router.replace("/login")
      return
    }
    if (company && !company.onboarding_completed) {
      router.replace("/onboarding")
    }
  }, [accessToken, company, hasHydrated, router])

  useEffect(() => {
    if (!hasHydrated || !accessToken || !company?.onboarding_completed || navigationWarmed.current) {
      return
    }

    navigationWarmed.current = true
    return warmAppNavigation(router, queryClient)
  }, [accessToken, company?.onboarding_completed, hasHydrated, queryClient, router])

  if (!hasHydrated) {
    return <div className="min-h-screen bg-[var(--bg)]" />
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <AppSidebar pathname={pathname} />
        <main className="flex-1 px-5 py-5 md:px-7 md:py-6">
          <AppHeader />
          <div className="mt-5">{children}</div>
        </main>
      </div>
    </div>
  )
}
