"use client"

import { useQuery } from "@tanstack/react-query"
import { CreditCard, LogOut, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { getSubscriptionUsage, logout } from "@/lib/auth"
import { currency } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

export function AppHeader() {
  const router = useRouter()
  const { accessToken, user, company, clearSession } = useAuthStore()
  const isSuperadmin = user?.company_id === null && user.roles.some((role) => role.name === "superadmin")
  const usageQuery = useQuery({
    queryKey: ["subscription-usage"],
    queryFn: getSubscriptionUsage,
    enabled: Boolean(accessToken && user?.company_id)
  })
  const usage = usageQuery.data

  async function handleLogout() {
    try {
      await logout()
    } catch (error) {
      console.warn("Falha ao encerrar sessão no servidor.", error)
    }
    clearSession()
    router.push("/login")
  }

  return (
    <header className="flex flex-col gap-4 rounded-lg border border-line bg-white/80 px-6 py-5 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{isSuperadmin ? "Admin" : "Workspace"}</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">{isSuperadmin ? "NexERP SaaS" : company?.trade_name ?? "NexERP"}</h2>
        <p className="mt-1 text-sm text-slate-500">{user?.name ? `${user.name} • ${user.email}` : "Sessão local"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {isSuperadmin ? (
          <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            <ShieldCheck className="h-4 w-4" />
            Superadmin
          </div>
        ) : (
          usage && (
            <div className="flex items-center gap-3 rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm text-teal-900">
              <CreditCard className="h-4 w-4 text-teal-700" />
              <span className="font-semibold">{usage.plan.name}</span>
              <span className="text-teal-700">{currency(usage.plan.price_monthly)}/mês</span>
            </div>
          )
        )}
        <Button variant="outline" className="gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </header>
  )
}
