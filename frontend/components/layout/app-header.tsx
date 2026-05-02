"use client"

import { LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"
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

  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?"

  return (
    <header className="flex items-center justify-between rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)] px-5 py-3">
      {/* Breadcrumb / workspace */}
      <div className="flex flex-col">
        <p className="text-[11px] font-medium uppercase tracking-widest text-[var(--fg-soft)]">
          Workspace
        </p>
        <h2 className="font-display mt-0.5 text-lg font-semibold text-[var(--fg)]">
          {company?.trade_name ?? "NexERP"}
        </h2>
      </div>

      {/* Right: badge + avatar + logout */}
      <div className="flex items-center gap-3">
        {/* Beta badge */}
        <span className="hidden rounded-full border border-[#00ff88]/20 bg-[#00ff88]/10 px-2.5 py-1 text-xs font-medium text-[#00ff88] sm:inline-flex">
          Beta
        </span>

        {/* User avatar */}
        <div
          title={user?.name ?? "Usuário"}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00ff88]/10 text-xs font-semibold text-[#00ff88]"
        >
          {initials}
        </div>

        <ThemeToggle />

        {/* Logout */}
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
          <LogOut className="h-4 w-4 text-[var(--fg-muted)]" />
        </Button>
      </div>
    </header>
  )
}
