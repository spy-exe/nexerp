"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Landmark, Plus, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createFinancialAccount,
  listFinancialAccounts,
  updateFinancialAccount,
  type FinancialAccount,
} from "@/lib/auth"
import { currency } from "@/lib/utils"

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  bank: "Banco",
  cash: "Caixa",
  digital: "Digital",
}

export function AccountsPanel() {
  const qc = useQueryClient()
  const { data: accounts = [] } = useQuery({
    queryKey: ["finance-accounts"],
    queryFn: listFinancialAccounts,
  })

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<FinancialAccount | null>(null)
  const [form, setForm] = useState({ name: "", type: "cash", balance: "0", bank_name: "" })

  const createMut = useMutation({
    mutationFn: createFinancialAccount,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-accounts"] }); setShowForm(false); resetForm() },
  })
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: unknown }) => updateFinancialAccount(id, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["finance-accounts"] }); setEditing(null); resetForm() },
  })

  function resetForm() {
    setForm({ name: "", type: "cash", balance: "0", bank_name: "" })
  }

  function startEdit(acc: FinancialAccount) {
    setEditing(acc)
    setForm({ name: acc.name, type: acc.type, balance: acc.balance, bank_name: acc.bank_name ?? "" })
  }

  function submit() {
    const payload = { name: form.name, type: form.type, balance: form.balance, bank_name: form.bank_name || null }
    if (editing) {
      updateMut.mutate({ id: editing.id, payload })
    } else {
      createMut.mutate(payload)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Landmark className="h-4 w-4 text-blue-600" /> Contas bancárias e caixa
        </h2>
        <Button size="sm" variant="outline" onClick={() => { setShowForm(true); setEditing(null); resetForm() }}>
          <Plus className="h-4 w-4 mr-1" /> Nova conta
        </Button>
      </div>

      {(showForm || editing) && (
        <div className="mb-4 rounded-xl border p-4 bg-slate-50 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Caixa principal" />
          </div>
          <div>
            <Label>Tipo</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              <option value="cash">Caixa</option>
              <option value="bank">Banco</option>
              <option value="digital">Digital</option>
            </select>
          </div>
          {!editing && (
            <div>
              <Label>Saldo inicial</Label>
              <Input type="number" step="0.01" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            </div>
          )}
          <div>
            <Label>Banco (opcional)</Label>
            <Input value={form.bank_name} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} placeholder="Ex: Banco do Brasil" />
          </div>
          <div className="sm:col-span-2 flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(false); setEditing(null); resetForm() }}>Cancelar</Button>
            <Button size="sm" onClick={submit} disabled={!form.name}>
              {editing ? "Salvar" : "Criar conta"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {accounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between rounded-xl border p-4 bg-white">
            <div>
              <p className="font-medium text-slate-900">{acc.name}</p>
              <p className="text-xs text-slate-500">{ACCOUNT_TYPE_LABEL[acc.type] ?? acc.type}{acc.bank_name ? ` · ${acc.bank_name}` : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <p className={`text-lg font-semibold ${Number(acc.balance) >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                {currency(acc.balance)}
              </p>
              <Button variant="ghost" size="icon" aria-label={`Editar conta ${acc.name}`} onClick={() => startEdit(acc)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {accounts.length === 0 && (
          <p className="text-sm text-slate-500 col-span-2">Nenhuma conta cadastrada.</p>
        )}
      </div>
    </Card>
  )
}
