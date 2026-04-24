"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"

import { Card } from "@/components/ui/card"
import { getPurchase } from "@/lib/auth"
import { currency, formatDateTime, quantity } from "@/lib/utils"

export default function PurchaseDetailPage() {
  const params = useParams<{ purchaseId: string }>()
  const purchaseQuery = useQuery({
    queryKey: ["purchase", params.purchaseId],
    queryFn: () => getPurchase(params.purchaseId)
  })

  if (!purchaseQuery.data) {
    return <Card className="p-6 text-sm text-slate-500">Carregando compra...</Card>
  }

  const purchase = purchaseQuery.data

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Compra</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{purchase.purchase_number}</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard label="Fornecedor" value={purchase.supplier_name || "Fornecedor"} />
          <InfoCard label="Emissão" value={formatDateTime(purchase.issued_at)} />
          <InfoCard label="Total" value={currency(purchase.total_amount)} />
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-semibold text-slate-900">Itens</h2>
        <div className="mt-6 grid gap-3">
          {purchase.items.map((item) => (
            <div key={item.id} className="rounded-[24px] border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">{item.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.product_sku} • {quantity(item.quantity)} {item.unit}
                  </p>
                </div>
                <p className="text-xl font-semibold text-slate-900">{currency(item.total_cost)}</p>
              </div>
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
