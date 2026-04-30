"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ArrowDownCircle, ArrowUpCircle, Download, Plus } from "lucide-react"

import { InlineEdit } from "@/components/shared/InlineEdit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createTransaction,
  listFinancialAccounts,
  listFinancialCategories,
  listTransactions,
  updateTransaction,
  type FinancialTransaction,
} from "@/lib/auth"
import { API_BASE_URL } from "@/lib/api"
import { currency } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"

export function TransactionsPanel() {
  const qc = useQueryClient()
  const accessToken = useAuthStore((state) => state.accessToken)
  const today = new Date().toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().split("T")[0]
  })
  const [dateTo, setDateTo] = useState(today)
  const [showForm, setShowForm] = useState(false)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [form, setForm] = useState({
    account_id: "",
    category_id: "",
    type: "income",
    amount: "",
    date: today,
    description: "",
  })

  const { data: transactions = [] } = useQuery({
    queryKey: ["finance-transactions", dateFrom, dateTo],
    queryFn: () => listTransactions({ date_from: dateFrom, date_to: dateTo }),
  })
  const { data: accounts = [] } = useQuery({ queryKey: ["finance-accounts"], queryFn: listFinancialAccounts })
  const { data: categories = [] } = useQuery({ queryKey: ["finance-categories"], queryFn: listFinancialCategories })

  const createMut = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finance-transactions"] })
      qc.invalidateQueries({ queryKey: ["finance-accounts"] })
      qc.invalidateQueries({ queryKey: ["finance-summary"] })
      setShowForm(false)
      setForm(f => ({ ...f, amount: "", description: "", category_id: "" }))
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) => updateTransaction(id, payload),
    onSuccess: (transaction) => {
      qc.setQueryData<FinancialTransaction[]>(["finance-transactions", dateFrom, dateTo], (current = []) =>
        current.map((item) => (item.id === transaction.id ? transaction : item))
      )
    },
    onError: (error) => {
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar transação.")
    }
  })

  const filteredCats = categories.filter(c => c.type === form.type)

  function submit() {
    createMut.mutate({
      account_id: form.account_id || null,
      category_id: form.category_id || null,
      type: form.type,
      amount: form.amount,
      date: form.date,
      description: form.description,
    })
  }

  async function saveTransactionField(transaction: FinancialTransaction, payload: Partial<FinancialTransaction>) {
    setInlineError(null)
    const key = ["finance-transactions", dateFrom, dateTo]
    const previous = qc.getQueryData<FinancialTransaction[]>(key)
    qc.setQueryData<FinancialTransaction[]>(key, (current = []) =>
      current.map((item) => (item.id === transaction.id ? { ...item, ...payload } : item))
    )
    try {
      await updateMut.mutateAsync({ id: transaction.id, payload })
    } catch (error) {
      qc.setQueryData(key, previous)
      throw error
    }
  }

  const downloadReport = async (format: "excel" | "pdf") => {
    const response = await fetch(`${API_BASE_URL}/finance/reports/transactions/${format}?date_from=${dateFrom}&date_to=${dateTo}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined
    })
    if (!response.ok) {
      return
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = format === "excel" ? "transacoes.xlsx" : "transacoes.pdf"
    link.click()
    URL.revokeObjectURL(url)
  }
  const exportExcel = () => {
    void downloadReport("excel")
  }
  const exportPdf = () => {
    void downloadReport("pdf")
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900">Transações</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportExcel}>
            <Download className="h-4 w-4 mr-1" /> Excel
          </Button>
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <Download className="h-4 w-4 mr-1" /> PDF
          </Button>
          <Button size="sm" onClick={() => setShowForm(v => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Nova
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <div>
          <Label className="text-xs">De</Label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-8 text-sm" />
        </div>
        <div>
          <Label className="text-xs">Até</Label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-8 text-sm" />
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="mb-4 rounded-xl border p-4 bg-slate-50 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Tipo</Label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value, category_id: "" }))}
            >
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
            </select>
          </div>
          <div>
            <Label>Conta</Label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              value={form.account_id}
              onChange={e => setForm(f => ({ ...f, account_id: e.target.value }))}
            >
              <option value="">Selecionar conta</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Categoria</Label>
            <select
              className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
            >
              <option value="">Sem categoria</option>
              {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" min="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <Label>Data</Label>
            <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Venda à vista" />
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={!form.account_id || !form.amount || !form.description}>
              Lançar
            </Button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="divide-y">
        {inlineError && <p className="pb-3 text-sm text-rose-600">{inlineError}</p>}
        {transactions.map(t => (
          <div key={t.id} className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              {t.type === "income"
                ? <ArrowUpCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                : <ArrowDownCircle className="h-5 w-5 text-red-500 shrink-0" />
              }
              <div>
                <p className="text-sm font-medium text-slate-800">
                  <InlineEdit
                    value={t.description}
                    onSave={(value) => saveTransactionField(t, { description: value })}
                  />
                </p>
                <p className="text-xs text-slate-400">
                  {t.date} · {t.account_name}{t.category_name ? ` · ${t.category_name}` : ""}
                </p>
                <p className="text-xs text-slate-400">
                  Conciliado{" "}
                  <InlineEdit
                    type="select"
                    value={t.reconciled ? "true" : "false"}
                    displayValue={t.reconciled ? "sim" : "não"}
                    options={[
                      { value: "false", label: "Não" },
                      { value: "true", label: "Sim" }
                    ]}
                    onSave={(value) => saveTransactionField(t, { reconciled: value === "true" })}
                  />
                </p>
              </div>
            </div>
            <p className={`text-sm font-semibold ${t.type === "income" ? "text-emerald-700" : "text-red-600"}`}>
              {t.type === "income" ? "+" : "-"}{currency(t.amount)}
            </p>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">Nenhuma transação no período.</p>
        )}
      </div>
    </Card>
  )
}
