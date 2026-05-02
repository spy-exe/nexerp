"use client"

import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, BarChart3, PackageSearch, Wallet } from "lucide-react"

import { Card } from "@/components/ui/card"
import { getDashboardOverview } from "@/lib/auth"
import { currency, quantity } from "@/lib/utils"

const statCards = [
  { key: "revenue_today",    label: "Faturamento hoje",   icon: Wallet },
  { key: "revenue_month",    label: "Faturamento no mês", icon: BarChart3 },
  { key: "purchases_month",  label: "Compras no mês",     icon: PackageSearch },
  { key: "average_ticket",   label: "Ticket médio",       icon: Wallet }
] as const

export default function DashboardPage() {
  const overviewQuery = useQuery({ queryKey: ["dashboard-overview"], queryFn: getDashboardOverview })
  const overview = overviewQuery.data

  return (
    <div className="space-y-5">
      {/* KPI cards */}
      <section className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = overview ? currency(overview[card.key]) : currency(0)
          return (
            <Card key={card.key} className="p-6 transition-all hover:shadow-glow-green">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[var(--fg-muted)]">{card.label}</p>
                <div className="rounded-xl bg-[#00ff88]/10 p-2.5 text-[#00ff88]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-5 text-3xl font-bold text-[var(--fg)]">{value}</p>
            </Card>
          )
        })}
      </section>

      {/* Radar comercial + Top clientes */}
      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Radar comercial</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--fg)]">Operação de vendas e compras</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#00ff88]/10 p-5">
              <p className="text-sm text-[var(--fg-muted)]">Vendas hoje</p>
              <p className="mt-3 text-4xl font-bold text-[#00ff88]">{overview?.sales_count_today ?? 0}</p>
            </div>
            <div className="rounded-xl bg-[#ffd700]/10 p-5">
              <p className="text-sm text-[var(--fg-muted)]">Alertas de estoque</p>
              <p className="mt-3 text-4xl font-bold text-[#ffd700]">{overview?.open_low_stock_alerts ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#00d4ff]">Top clientes</p>
              <h2 className="mt-3 text-xl font-bold text-[var(--fg)]">Maior volume de compras</h2>
            </div>
            <div className="rounded-xl bg-[#00d4ff]/10 p-2.5 text-[#00d4ff]">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {overview?.top_customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[var(--bg-muted)] px-4 py-3"
              >
                <span className="text-sm font-medium text-[var(--fg)]">{customer.label}</span>
                <span className="text-sm font-semibold text-[#00d4ff]">{currency(customer.value)}</span>
              </div>
            ))}
            {!overview?.top_customers.length && (
              <p className="text-sm text-[var(--fg-muted)]">Sem dados suficientes.</p>
            )}
          </div>
        </Card>
      </section>

      {/* Mais vendidos + Estoque crítico */}
      <section className="grid gap-5 xl:grid-cols-2">
        <Card className="p-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">Produtos líderes</p>
          <h2 className="mt-3 text-xl font-bold text-[var(--fg)]">Mais vendidos</h2>
          <div className="mt-6 space-y-2">
            {overview?.top_products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-lg border border-[color:var(--border)] bg-[var(--bg-muted)] px-4 py-3"
              >
                <span className="text-sm font-medium text-[var(--fg)]">{product.label}</span>
                <span className="text-sm font-semibold text-[var(--fg-muted)]">{quantity(product.value)}</span>
              </div>
            ))}
            {!overview?.top_products.length && (
              <p className="text-sm text-[var(--fg-muted)]">Sem dados suficientes.</p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[#ffd700]">Estoque crítico</p>
              <h2 className="mt-3 text-xl font-bold text-[var(--fg)]">Ação imediata</h2>
            </div>
            <div className="rounded-xl bg-[#ffd700]/10 p-2.5 text-[#ffd700]">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 space-y-2">
            {overview?.low_stock_alerts.map((alert) => (
              <div
                key={alert.product_id}
                className="rounded-lg border border-[#ffd700]/20 bg-[#ffd700]/5 px-4 py-3"
              >
                <p className="text-sm font-medium text-[var(--fg)]">{alert.product_name}</p>
                <p className="mt-1 text-xs text-[#ffd700]">
                  Saldo {quantity(alert.quantity)} • mínimo {quantity(alert.min_stock)}
                </p>
              </div>
            ))}
            {!overview?.low_stock_alerts.length && (
              <p className="text-sm text-[var(--fg-muted)]">Nenhum alerta crítico no momento.</p>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}
