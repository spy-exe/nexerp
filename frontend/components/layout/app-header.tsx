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
    <header className="flex flex-col gap-4 rounded-[28px] border border-line bg-white/80 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Workspace</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{company?.trade_name ?? "NexERP"}</h2>
        <p className="mt-1 text-sm text-slate-500">{user?.name ? `${user.name} • ${user.email}` : "Sessão local"}</p>
      </div>
      <Button variant="outline" className="gap-2" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </header>
  )
}
