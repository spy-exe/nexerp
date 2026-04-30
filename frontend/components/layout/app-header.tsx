"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { logout } from "@/lib/auth"
import { useAuthStore } from "@/stores/auth-store"

export function AppHeader() {
  const router = useRouter()
  const { user, company, clearSession } = useAuthStore()

  async function handleLogout() {
    await logout().catch(() => undefined)
    clearSession()
    router.push("/login")
  }

  return (
    <header className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace</p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">{company?.trade_name ?? "NexERP"}</h2>
        <p className="mt-1 text-sm text-slate-500">{user?.name ? `${user.name} • ${user.email}` : "Sessão local"}</p>
      </div>
      <Button variant="outline" className="gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </header>
  )
}
