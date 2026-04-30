"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckCircle2, Plus } from "lucide-react"

import { InlineEdit } from "@/components/shared/InlineEdit"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createPayable,
  createReceivable,
  listFinancialAccounts,
  listPayables,
  listReceivables,
  payPayable,
  payReceivable,
  updateInstallment,
  type Installment,
} from "@/lib/auth"
import { currency } from "@/lib/utils"

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "text-blue-700 bg-blue-50" },
  partial: { label: "Parcial", color: "text-orange-700 bg-orange-50" },
  paid: { label: "Pago", color: "text-emerald-700 bg-emerald-50" },
  overdue: { label: "Vencido", color: "text-red-700 bg-red-50" },
  cancelled: { label: "Cancelado", color: "text-slate-500 bg-slate-100" },
}

type Mode = "receivables" | "payables"

export function InstallmentsPanel() {
  const qc = useQueryClient()
  const today = new Date().toISOString().split("T")[0]
  const [mode, setMode] = useState<Mode>("receivables")
  const [showForm, setShowForm] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [inlineError, setInlineError] = useState<string | null>(null)
  const [payForm, setPayForm] = useState({ account_id: "", amount: "", date: today })
  const [form, setForm] = useState({ description: "", total_amount: "", due_date: "" })

  const { data: receivables = [] } = useQuery({ queryKey: ["finance-receivables"], queryFn: () => listReceivables() })
  const { data: payables = [] } = useQuery({ queryKey: ["finance-payables"], queryFn: () => listPayables() })
  const { data: accounts = [] } = useQuery({ queryKey: ["finance-accounts"], queryFn: listFinancialAccounts })

  const items: Installment[] = mode === "receivables" ? receivables : payables

  const createMut = useMutation({
    mutationFn: (payload: unknown) => mode === "receivables" ? createReceivable(payload) : createPayable(payload),
    onSuccess: (installment) => {
      const targetKey = installment.type === "income" ? ["finance-receivables"] : ["finance-payables"]
      qc.setQueryData<Installment[]>(targetKey, (current = []) => [installment, ...current])
      qc.invalidateQueries({ queryKey: ["finance-summary"] })
      setShowForm(false)
      setForm({ description: "", total_amount: "", due_date: "" })
    },
  })

  const payMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) =>
      mode === "receivables" ? payReceivable(id, payload) : payPayable(id, payload),
    onSuccess: (installment) => {
      updateInstallmentCache(installment)
      qc.invalidateQueries({ queryKey: ["finance-accounts"] })
      qc.invalidateQueries({ queryKey: ["finance-summary"] })
      setPayingId(null)
    },
  })

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) => updateInstallment(id, payload),
    onSuccess: (installment) => {
      updateInstallmentCache(installment)
      qc.invalidateQueries({ queryKey: ["finance-summary"] })
    },
    onError: (error) => {
      setInlineError(error instanceof Error ? error.message : "Falha ao atualizar parcela.")
    }
  })

  function updateInstallmentCache(installment: Installment) {
    const targetKey = installment.type === "income" ? ["finance-receivables"] : ["finance-payables"]
    qc.setQueryData<Installment[]>(targetKey, (current = []) =>
      current.map((item) => (item.id === installment.id ? installment : item))
    )
  }

  async function saveInstallmentField(inst: Installment, payload: Partial<Installment>) {
    setInlineError(null)
    const key = inst.type === "income" ? ["finance-receivables"] : ["finance-payables"]
    const previous = qc.getQueryData<Installment[]>(key)
    qc.setQueryData<Installment[]>(key, (current = []) =>
      current.map((item) => (item.id === inst.id ? { ...item, ...payload } : item))
    )
    try {
      await updateMut.mutateAsync({ id: inst.id, payload })
    } catch (error) {
      qc.setQueryData(key, previous)
      throw error
    }
  }

  function submitCreate() {
    createMut.mutate({ ...form, type: mode === "receivables" ? "income" : "expense" })
  }

  function submitPay(id: string) {
    payMut.mutate({ id, payload: { account_id: payForm.account_id, amount: payForm.amount, date: payForm.date } })
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("receivables")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${mode === "receivables" ? "bg-emerald-100 text-emerald-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Contas a receber ({receivables.filter(i => i.status !== "paid" && i.status !== "cancelled").length})
          </button>
          <button
            onClick={() => setMode("payables")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${mode === "payables" ? "bg-red-100 text-red-800" : "text-slate-500 hover:text-slate-800"}`}
          >
            Contas a pagar ({payables.filter(i => i.status !== "paid" && i.status !== "cancelled").length})
          </button>
        </div>
        <Button size="sm" onClick={() => { setShowForm(v => !v) }}>
          <Plus className="h-4 w-4 mr-1" /> Nova
        </Button>
      </div>

      {showForm && (
        <div className="mb-4 rounded-xl border p-4 bg-slate-50 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <Label>Descrição</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Ex: Fatura Obras Horizonte" />
          </div>
          <div>
            <Label>Valor (R$)</Label>
            <Input type="number" step="0.01" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} />
          </div>
          <div>
            <Label>Vencimento</Label>
            <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end items-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={submitCreate} disabled={!form.description || !form.total_amount || !form.due_date}>
              Criar
            </Button>
          </div>
        </div>
      )}

      <div className="divide-y">
        {inlineError && <p className="pb-3 text-sm text-rose-600">{inlineError}</p>}
        {items.map(inst => {
          const s = STATUS_LABEL[inst.status] ?? STATUS_LABEL.open
          return (
            <div key={inst.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    <InlineEdit
                      value={inst.description}
                      onSave={(value) => saveInstallmentField(inst, { description: value })}
                    />
                  </p>
                  <p className="text-xs text-slate-400">
                    Vence:{" "}
                    <InlineEdit
                      type="date"
                      value={inst.due_date}
                      onSave={(value) => saveInstallmentField(inst, { due_date: value })}
                    />
                    {inst.person_name ? ` · ${inst.person_name}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      <InlineEdit
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={inst.total_amount}
                        displayValue={currency(inst.total_amount)}
                        onSave={(value) => saveInstallmentField(inst, { total_amount: value })}
                      />
                    </p>
                    {inst.paid_amount !== "0.00" && (
                      <p className="text-xs text-slate-500">Pago: {currency(inst.paid_amount)}</p>
                    )}
                  </div>
                  <InlineEdit
                    type="select"
                    value={inst.status}
                    displayValue={<span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>{s.label}</span>}
                    options={[
                      { value: "open", label: "Aberto" },
                      { value: "partial", label: "Parcial" },
                      { value: "paid", label: "Pago" },
                      { value: "overdue", label: "Vencido" },
                      { value: "cancelled", label: "Cancelado" }
                    ]}
                    onSave={(value) => saveInstallmentField(inst, { status: value as Installment["status"] })}
                  />
                  {inst.status !== "paid" && inst.status !== "cancelled" && (
                    <Button size="sm" variant="outline" onClick={() => {
                      setPayingId(inst.id)
                      setPayForm({ account_id: accounts[0]?.id ?? "", amount: inst.remaining_amount, date: today })
                    }}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {payingId === inst.id && (
                <div className="mt-3 rounded-xl border p-3 bg-slate-50 grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-xs">Conta</Label>
                    <select
                      className="flex h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
                      value={payForm.account_id}
                      onChange={e => setPayForm(f => ({ ...f, account_id: e.target.value }))}
                    >
                      {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Valor (R$)</Label>
                    <Input className="h-8 text-sm" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <Label className="text-xs">Data</Label>
                    <Input className="h-8 text-sm" type="date" value={payForm.date} onChange={e => setPayForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div className="sm:col-span-3 flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setPayingId(null)}>Cancelar</Button>
                    <Button size="sm" onClick={() => submitPay(inst.id)} disabled={!payForm.account_id || !payForm.amount}>
                      Confirmar pagamento
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {items.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">
            {mode === "receivables" ? "Nenhuma conta a receber." : "Nenhuma conta a pagar."}
          </p>
        )}
      </div>
    </Card>
  )
}
