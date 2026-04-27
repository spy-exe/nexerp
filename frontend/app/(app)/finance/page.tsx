"use client"

import { AccountsPanel } from "@/components/finance/accounts-panel"
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards"
import { InstallmentsPanel } from "@/components/finance/installments-panel"
import { TransactionsPanel } from "@/components/finance/transactions-panel"

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Financeiro</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Visão geral financeira</h1>
        <p className="mt-1 text-sm text-slate-500">
          Saldo em contas, receitas, despesas, contas a pagar e a receber — tudo em um lugar.
        </p>
      </div>
      <FinanceSummaryCards />
      <div className="grid gap-6 xl:grid-cols-2">
        <AccountsPanel />
        <InstallmentsPanel />
      </div>
      <TransactionsPanel />
    </div>
  )
}
