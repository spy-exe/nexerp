"use client"

import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Boxes, CreditCard, RefreshCw, ReceiptText, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getSubscriptionUsage, type UsageMetric } from "@/lib/auth"
import { currency } from "@/lib/utils"

const STATUS_LABEL: Record<string, string> = {
  trialing: "Trial",
  active: "Ativa",
  suspended: "Suspensa",
  canceled: "Cancelada",
  expired: "Expirada"
}

const METRICS = [
  { key: "users", label: "Usuários", icon: Users },
  { key: "products", label: "Produtos", icon: Boxes },
  { key: "sales_per_month", label: "Vendas no mês", icon: ReceiptText }
] as const

export default function SubscriptionPage() {
  const usageQuery = useQuery({ queryKey: ["subscription-usage"], queryFn: getSubscriptionUsage })
  const usage = usageQuery.data

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Assinatura</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{usageQuery.isLoading ? "Carregando plano" : usage?.plan.name ?? "Plano indisponível"}</h1>
            <p className="mt-2 text-sm text-slate-500">Acompanhe limites contratados antes de bloquear cadastros ou vendas.</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-teal-50 px-3 py-1 font-medium text-teal-800">
                {STATUS_LABEL[usage?.status ?? ""] ?? usage?.status ?? "Carregando"}
              </span>
              {usage?.trial_ends_at && (
                <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                  Trial até {new Intl.DateTimeFormat("pt-BR").format(new Date(usage.trial_ends_at))}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {usage && (
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-left sm:text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mensalidade</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{currency(usage.plan.price_monthly)}</p>
              </div>
            )}
            <Button variant="outline" size="icon" onClick={() => usageQuery.refetch()} aria-label="Atualizar uso">
              <RefreshCw className={`h-4 w-4 ${usageQuery.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {usageQuery.error && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <AlertTriangle className="h-4 w-4" />
            {usageQuery.error instanceof Error ? usageQuery.error.message : "Falha ao carregar assinatura."}
          </div>
        )}
      </Card>

      <section className="grid gap-4 xl:grid-cols-3">
        {METRICS.map((metric) => {
          const Icon = metric.icon
          const value = usage?.usage[metric.key] ?? { current: 0, limit: 0, percentage: 0 }
          return <UsageCard key={metric.key} label={metric.label} icon={Icon} metric={value} loading={usageQuery.isLoading} />
        })}
      </section>

      <Card className="p-6">
        {usage ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-slate-900">{usage.plan.slug}</h2>
              <p className="mt-1 break-words text-sm text-slate-500">
                Usuários {usage.plan.limits.max_users} · produtos {usage.plan.limits.max_products} · vendas mensais{" "}
                {usage.plan.limits.max_sales_per_month}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <CreditCard className="h-5 w-5 text-slate-400" />
            {usageQuery.isLoading ? "Carregando detalhes do plano..." : "Não foi possível exibir os detalhes do plano."}
          </div>
        )}
      </Card>
    </div>
  )
}

function UsageCard({ label, icon: Icon, metric, loading }: { label: string; icon: typeof Users; metric: UsageMetric; loading?: boolean }) {
  const width = `${Math.min(metric.percentage, 100)}%`
  const isNearLimit = metric.percentage >= 80

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {loading ? "..." : metric.current}
            <span className="ml-2 text-base font-medium text-slate-400">/ {metric.limit}</span>
          </p>
        </div>
        <div className={isNearLimit ? "rounded-2xl bg-amber-50 p-3 text-amber-700" : "rounded-2xl bg-teal-50 p-3 text-teal-700"}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div className={isNearLimit ? "h-2 rounded-full bg-amber-500" : "h-2 rounded-full bg-teal-600"} style={{ width }} />
      </div>
      <p className="mt-3 text-sm font-medium text-slate-600">{metric.percentage}% usado</p>
    </Card>
  )
}
