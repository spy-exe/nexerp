"use client"

import { useQuery } from "@tanstack/react-query"
import { BarChart3, Boxes, TrendingUp, WalletCards } from "lucide-react"

import { Card } from "@/components/ui/card"
import { getAdvancedFinancialReport, getAdvancedSalesReport, getAdvancedStockReport } from "@/lib/auth"
import { currency, quantity } from "@/lib/utils"

export default function ReportsPage() {
  const salesQuery = useQuery({ queryKey: ["advanced-sales-report"], queryFn: getAdvancedSalesReport })
  const stockQuery = useQuery({ queryKey: ["advanced-stock-report"], queryFn: getAdvancedStockReport })
  const financialQuery = useQuery({ queryKey: ["advanced-financial-report"], queryFn: getAdvancedFinancialReport })

  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Relatórios</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Relatórios avançados</h1>
        <p className="mt-1 text-sm text-slate-500">Vendas, estoque e financeiro consolidados por tenant.</p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Metric icon={TrendingUp} label="Receita" value={currency(salesQuery.data?.total_revenue ?? 0)} />
        <Metric icon={WalletCards} label="Resultado financeiro" value={currency(financialQuery.data?.net ?? 0)} />
        <Metric icon={Boxes} label="Alertas de estoque" value={String(stockQuery.data?.low_stock_count ?? 0)} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <Header icon={BarChart3} title="Produtos mais vendidos" />
          <div className="mt-6 space-y-3">
            {salesQuery.data?.top_products.map((item) => (
              <Row key={item.id} label={item.label} value={`${quantity(item.quantity)} un. • ${currency(item.total)}`} />
            ))}
            {!salesQuery.data?.top_products.length && <p className="text-sm text-slate-500">Sem vendas registradas.</p>}
          </div>
        </Card>

        <Card className="p-6">
          <Header icon={TrendingUp} title="Clientes por faturamento" />
          <div className="mt-6 space-y-3">
            {salesQuery.data?.top_customers.map((item) => (
              <Row key={item.id} label={item.label} value={currency(item.total)} />
            ))}
            {!salesQuery.data?.top_customers.length && <p className="text-sm text-slate-500">Sem clientes faturados.</p>}
          </div>
        </Card>
      </section>

      <Card className="p-6">
        <Header icon={Boxes} title="Estoque crítico" />
        <div className="mt-6 grid gap-3">
          {stockQuery.data?.items.map((item) => (
            <div key={`${item.product_id}-${item.warehouse_id}`} className="rounded-[24px] border border-line bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.sku} • {item.warehouse_name}</p>
                </div>
                <p className={item.status === "low_stock" ? "font-semibold text-amber-700" : "font-semibold text-teal-700"}>
                  {quantity(item.quantity)} / mínimo {quantity(item.min_stock)}
                </p>
              </div>
            </div>
          ))}
          {!stockQuery.data?.items.length && <p className="text-sm text-slate-500">Sem saldo de estoque registrado.</p>}
        </div>
      </Card>
    </div>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof TrendingUp; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-teal-50 p-3 text-teal-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function Header({ icon: Icon, title }: { icon: typeof TrendingUp; title: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3 text-sm">
      <span className="font-medium text-slate-800">{label}</span>
      <span className="text-slate-500">{value}</span>
    </div>
  )
}
