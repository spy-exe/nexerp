"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { Card } from "@/components/ui/card"
import { getSale } from "@/lib/auth"
import { currency, formatDateTime, quantity } from "@/lib/utils"

export default function SaleDetailPage() {
  const params = useParams<{ saleId: string }>()
  const saleQuery = useQuery({
    queryKey: ["sale", params.saleId],
    queryFn: () => getSale(params.saleId)
  })

  if (!saleQuery.data) {
    return <Card className="p-6 text-sm text-slate-500">Carregando venda...</Card>
  }

  const sale = saleQuery.data

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Venda</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{sale.sale_number}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <InfoCard label="Cliente" value={sale.customer_name || "Consumidor final"} />
          <InfoCard label="Emissão" value={formatDateTime(sale.issued_at)} />
          <InfoCard label="Canal" value={sale.channel === "pos" ? "PDV" : "Venda assistida"} />
          <InfoCard label="Total" value={currency(sale.total_amount)} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Itens</h2>
        <div className="mt-6 grid gap-3">
          {sale.items.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.product_sku} • {quantity(item.quantity)} {item.unit}
                  </p>
                </div>
                <p className="text-xl font-semibold text-slate-900">{currency(item.total_amount)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Pagamentos</h2>
        <div className="mt-6 grid gap-3">
          {sale.payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between rounded-[24px] border border-line bg-white px-5 py-4">
              <span className="font-medium capitalize text-slate-900">{payment.method}</span>
              <span className="text-sm font-semibold text-slate-700">{currency(payment.amount)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] bg-slate-100 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  )
}
