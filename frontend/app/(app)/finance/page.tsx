"use client"

import { AccountsPanel } from "@/components/finance/accounts-panel"
import { FinanceSummaryCards } from "@/components/finance/finance-summary-cards"
import { InstallmentsPanel } from "@/components/finance/installments-panel"
import { TransactionsPanel } from "@/components/finance/transactions-panel"
import { PageHeader } from "@/components/shared/PageHeader"

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Financeiro"
        title="Visão geral financeira"
        subtitle="Saldo em contas, receitas, despesas, contas a pagar e a receber em uma operação editável."
      />
      <FinanceSummaryCards />
      <div className="grid gap-6 xl:grid-cols-2">
        <AccountsPanel />
        <InstallmentsPanel />
      </div>
      <TransactionsPanel />
    </div>
  )
}
