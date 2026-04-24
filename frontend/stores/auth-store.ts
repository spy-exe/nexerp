"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { SessionPayload } from "@/lib/auth"

type AuthState = {
  accessToken: string | null
  permissions: string[]
  user: SessionPayload["user"] | null
  company: SessionPayload["company"] | null
  setSession: (session: SessionPayload) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      permissions: [],
      user: null,
      company: null,
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
        })
    }),
    {
      name: "nexerp-auth"
    }
  )
)
