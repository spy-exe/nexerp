"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Archive, Check, Pencil, Plus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createAdminPlan, deleteAdminPlan, listAdminPlans, updateAdminPlan, type Plan } from "@/lib/auth"
import { currency } from "@/lib/utils"

type PlanForm = {
  name: string
  slug: string
  description: string
  max_users: string
  max_products: string
  max_sales_per_month: string
  price_monthly: string
  features: string
  is_active: boolean
}

const EMPTY_FORM: PlanForm = {
  name: "",
  slug: "",
  description: "",
  max_users: "1",
  max_products: "1",
  max_sales_per_month: "1",
  price_monthly: "0.00",
  features: "{}",
  is_active: true
}

export default function AdminPlansPage() {
  const queryClient = useQueryClient()
  const plansQuery = useQuery({ queryKey: ["admin-plans"], queryFn: listAdminPlans })
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [form, setForm] = useState<PlanForm>(EMPTY_FORM)
  const [message, setMessage] = useState<string | null>(null)

  async function invalidatePlans() {
    await queryClient.invalidateQueries({ queryKey: ["admin-plans"] })
  }

  const createMutation = useMutation({
    mutationFn: createAdminPlan,
    onSuccess: async () => {
      setMessage("Plano criado.")
      resetForm()
      await invalidatePlans()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Falha ao criar plano.")
  })

  const updateMutation = useMutation({
    mutationFn: ({ planId, payload }: { planId: string; payload: unknown }) => updateAdminPlan(planId, payload),
    onSuccess: async () => {
      setMessage("Plano atualizado.")
      resetForm()
      await invalidatePlans()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Falha ao atualizar plano.")
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAdminPlan,
    onSuccess: async () => {
      setMessage("Plano desativado.")
      await invalidatePlans()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Falha ao desativar plano.")
  })

  function resetForm() {
    setEditingPlan(null)
    setForm(EMPTY_FORM)
  }

  function startEdit(plan: Plan) {
    setEditingPlan(plan)
    setForm({
      name: plan.name,
      slug: plan.slug,
      description: plan.description ?? "",
      max_users: String(plan.max_users),
      max_products: String(plan.max_products),
      max_sales_per_month: String(plan.max_sales_per_month),
      price_monthly: String(plan.price_monthly),
      features: JSON.stringify(plan.features, null, 2),
      is_active: plan.is_active
    })
  }

  function submit() {
    let features: Record<string, unknown>
    try {
      features = JSON.parse(form.features || "{}") as Record<string, unknown>
    } catch {
      setMessage("Features precisa ser JSON válido.")
      return
    }

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      max_users: Number(form.max_users),
      max_products: Number(form.max_products),
      max_sales_per_month: Number(form.max_sales_per_month),
      price_monthly: form.price_monthly,
      features,
      is_active: form.is_active
    }

    if (editingPlan) {
      updateMutation.mutate({ planId: editingPlan.id, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="grid gap-6 xl:grid-cols-[430px_1fr]">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Planos</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">{editingPlan ? "Editar plano" : "Novo plano"}</h1>
        {message && <p className="mt-4 rounded-2xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{message}</p>}

        <div className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label>Usuários</Label>
              <Input type="number" min="1" value={form.max_users} onChange={(event) => setForm((current) => ({ ...current, max_users: event.target.value }))} />
            </div>
            <div>
              <Label>Produtos</Label>
              <Input type="number" min="1" value={form.max_products} onChange={(event) => setForm((current) => ({ ...current, max_products: event.target.value }))} />
            </div>
            <div>
              <Label>Vendas/mês</Label>
              <Input
                type="number"
                min="1"
                value={form.max_sales_per_month}
                onChange={(event) => setForm((current) => ({ ...current, max_sales_per_month: event.target.value }))}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
              <Label>Mensalidade</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price_monthly}
                onChange={(event) => setForm((current) => ({ ...current, price_monthly: event.target.value }))}
              />
            </div>
            <label className="flex items-end gap-2 pb-3 text-sm font-medium text-slate-600">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Ativo
            </label>
          </div>
          <div>
            <Label>Features</Label>
            <Textarea value={form.features} onChange={(event) => setForm((current) => ({ ...current, features: event.target.value }))} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {editingPlan && (
              <Button variant="outline" className="gap-2" onClick={resetForm}>
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            )}
            <Button className="gap-2" disabled={isSaving || !form.name || !form.slug} onClick={submit}>
              {editingPlan ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {editingPlan ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold text-slate-900">Planos cadastrados</h2>
        <div className="mt-5 grid gap-3">
          {plansQuery.data?.map((plan) => (
            <div key={plan.id} className="rounded-2xl border border-line bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{plan.name}</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{plan.slug}</span>
                    <span className={plan.is_active ? "rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700" : "rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"}>
                      {plan.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{plan.description ?? "Sem descrição"}</p>
                </div>
                <p className="text-xl font-semibold text-slate-900">{currency(plan.price_monthly)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span>{plan.max_users} usuários</span>
                <span>{plan.max_products} produtos</span>
                <span>{plan.max_sales_per_month} vendas/mês</span>
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="outline" size="sm" className="gap-2" onClick={() => startEdit(plan)}>
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="gap-2" disabled={deleteMutation.isPending || !plan.is_active} onClick={() => deleteMutation.mutate(plan.id)}>
                  <Archive className="h-4 w-4" />
                  Desativar
                </Button>
              </div>
            </div>
          ))}
          {!plansQuery.data?.length && <p className="text-sm text-slate-500">Nenhum plano cadastrado.</p>}
        </div>
      </Card>
    </div>
  )
}
