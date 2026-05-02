"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { SessionPayload } from "@/lib/auth"

type AuthState = {
  accessToken: string | null
  permissions: string[]
  user: SessionPayload["user"] | null
  company: SessionPayload["company"] | null
  hasHydrated: boolean
  setSession: (session: SessionPayload) => void
  clearSession: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      permissions: [],
      user: null,
      company: null,
      hasHydrated: false,
      setSession: (session) =>
        set({
          accessToken: session.access_token,
          permissions: session.permissions,
          user: session.user,
          company: session.company
        }),
      clearSession: () =>
        set({
          accessToken: null,
          permissions: [],
          user: null,
          company: null
        }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "nexerp-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
