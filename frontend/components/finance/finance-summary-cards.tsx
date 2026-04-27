"use client"

import { useQuery } from "@tanstack/react-query"
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, Landmark, TrendingDown, TrendingUp, Wallet } from "lucide-react"

import { Card } from "@/components/ui/card"
import { getFinancialSummary } from "@/lib/auth"
import { currency } from "@/lib/utils"

export function FinanceSummaryCards() {
  const { data } = useQuery({ queryKey: ["finance-summary"], queryFn: getFinancialSummary })

  const cards = [
    {
      label: "Saldo em contas",
      value: data?.total_accounts_balance ?? "0",
      icon: Landmark,
      color: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Receitas no mês",
      value: data?.income_month ?? "0",
      icon: ArrowUpCircle,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
    },
    {
      label: "Despesas no mês",
      value: data?.expense_month ?? "0",
      icon: ArrowDownCircle,
      color: "text-red-700",
      bg: "bg-red-50",
    },
    {
      label: "Resultado do mês",
      value: data?.net_month ?? "0",
      icon: data && Number(data.net_month) >= 0 ? TrendingUp : TrendingDown,
      color: data && Number(data.net_month) >= 0 ? "text-emerald-700" : "text-red-700",
      bg: data && Number(data.net_month) >= 0 ? "bg-emerald-50" : "bg-red-50",
    },
    {
      label: "A receber",
      value: data?.receivables_open ?? "0",
      icon: Wallet,
      color: "text-teal-700",
      bg: "bg-teal-50",
    },
    {
      label: "A pagar",
      value: data?.payables_open ?? "0",
      icon: Wallet,
      color: "text-orange-700",
      bg: "bg-orange-50",
    },
    {
      label: "Recebíveis vencidos",
      value: data?.overdue_receivables ?? "0",
      icon: AlertCircle,
      color: "text-red-700",
      bg: "bg-red-50",
    },
    {
      label: "Pagamentos vencidos",
      value: data?.overdue_payables ?? "0",
      icon: AlertCircle,
      color: "text-red-700",
      bg: "bg-red-50",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <Card key={c.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">{c.label}</p>
              <div className={`rounded-xl p-2 ${c.bg}`}>
                <Icon className={`h-4 w-4 ${c.color}`} />
              </div>
            </div>
            <p className={`mt-3 text-2xl font-semibold ${c.color}`}>{currency(c.value)}</p>
          </Card>
        )
      })}
    </div>
  )
}
