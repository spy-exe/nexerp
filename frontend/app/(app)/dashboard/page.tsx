"use client"

import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, BarChart3, PackageSearch, Wallet } from "lucide-react"

import { Card } from "@/components/ui/card"
import { getDashboardOverview } from "@/lib/auth"
import { currency, quantity } from "@/lib/utils"

const statCards = [
  { key: "revenue_today", label: "Faturamento hoje", icon: Wallet },
  { key: "revenue_month", label: "Faturamento no mês", icon: BarChart3 },
  { key: "purchases_month", label: "Compras no mês", icon: PackageSearch },
  { key: "average_ticket", label: "Ticket médio", icon: Wallet }
] as const

export default function DashboardPage() {
  const overviewQuery = useQuery({ queryKey: ["dashboard-overview"], queryFn: getDashboardOverview })
  const overview = overviewQuery.data

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const value = overview ? currency(overview[card.key]) : currency(0)
          return (
            <Card key={card.key} className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{card.label}</p>
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-5 text-3xl font-semibold text-slate-900">{value}</p>
            </Card>
          )
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Radar comercial</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Operação de vendas e compras</h1>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg bg-slate-950 p-5 text-white">
              <p className="text-sm text-slate-300">Vendas hoje</p>
              <p className="mt-3 text-4xl font-semibold">{overview?.sales_count_today ?? 0}</p>
            </div>
            <div className="rounded-lg bg-amber-50 p-5 text-amber-950">
              <p className="text-sm text-amber-800">Alertas de estoque</p>
              <p className="mt-3 text-4xl font-semibold">{overview?.open_low_stock_alerts ?? 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Top clientes</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Maior volume de compras</h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {overview?.top_customers.map((customer) => (
              <div key={customer.id} className="flex items-center justify-between rounded-lg border border-line bg-white px-5 py-4">
                <span className="font-medium text-slate-900">{customer.label}</span>
                <span className="text-sm font-semibold text-slate-700">{currency(customer.value)}</span>
              </div>
            ))}
            {!overview?.top_customers.length && <p className="text-sm text-slate-500">Sem dados suficientes.</p>}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Produtos líderes</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Mais vendidos</h2>
          <div className="mt-6 space-y-3">
            {overview?.top_products.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg border border-line bg-white px-5 py-4">
                <span className="font-medium text-slate-900">{product.label}</span>
                <span className="text-sm font-semibold text-slate-700">{quantity(product.value)}</span>
              </div>
            ))}
            {!overview?.top_products.length && <p className="text-sm text-slate-500">Sem dados suficientes.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Estoque crítico</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Ação imediata</h2>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {overview?.low_stock_alerts.map((alert) => (
              <div key={alert.product_id} className="rounded-lg border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="font-medium text-amber-950">{alert.product_name}</p>
                <p className="mt-2 text-sm text-amber-800">
                  Saldo {quantity(alert.quantity)} • mínimo {quantity(alert.min_stock)}
                </p>
              </div>
            ))}
            {!overview?.low_stock_alerts.length && <p className="text-sm text-slate-500">Nenhum alerta crítico no momento.</p>}
          </div>
        </Card>
      </section>
    </div>
  )
}
