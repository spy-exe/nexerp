"use client"

import { useQuery } from "@tanstack/react-query"

import { Card } from "@/components/ui/card"
import { listBalances, listCategories, listProducts } from "@/lib/auth"

export default function DashboardPage() {
  const products = useQuery({ queryKey: ["products"], queryFn: listProducts })
  const categories = useQuery({ queryKey: ["categories"], queryFn: listCategories })
  const balances = useQuery({ queryKey: ["balances"], queryFn: listBalances })

  const stats = [
    { label: "Produtos ativos", value: products.data?.length ?? 0 },
    { label: "Categorias", value: categories.data?.length ?? 0 },
    { label: "Saldos em estoque", value: balances.data?.length ?? 0 }
  ]

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-6">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-3 text-4xl font-semibold text-slate-900">{stat.value}</p>
          </Card>
        ))}
      </section>
      <Card className="p-7">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Próximos passos</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Foundation pronta para operar</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Cadastre categorias e produtos, ajuste o onboarding da empresa e registre movimentações de estoque. A base de
          autenticação, permissões e multi-tenant já está conectada ao backend.
        </p>
      </Card>
    </div>
  )
}
