"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Building2, CheckCircle2, CreditCard, PauseCircle, RefreshCw, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  changeAdminCompanyPlan,
  getAdminCompany,
  getAdminStats,
  listAdminCompanies,
  listAdminPlans,
  reactivateAdminCompany,
  suspendAdminCompany,
  type AdminCompanyListItem,
  type UsageMetric,
} from "@/lib/auth"
import { currency, formatDateTime } from "@/lib/utils"

const STATUS_LABEL: Record<string, string> = {
  trialing: "Trial",
  active: "Ativa",
  suspended: "Suspensa",
  canceled: "Cancelada",
  expired: "Expirada"
}

export default function AdminCompaniesPage() {
  const queryClient = useQueryClient()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedPlanId, setSelectedPlanId] = useState("")
  const [suspendReason, setSuspendReason] = useState("")
  const [message, setMessage] = useState<string | null>(null)

  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: getAdminStats })
  const companiesQuery = useQuery({ queryKey: ["admin-companies"], queryFn: listAdminCompanies })
  const plansQuery = useQuery({ queryKey: ["admin-plans"], queryFn: listAdminPlans })
  const detailQuery = useQuery({
    queryKey: ["admin-company", selectedCompanyId],
    queryFn: () => getAdminCompany(selectedCompanyId as string),
    enabled: Boolean(selectedCompanyId)
  })

  useEffect(() => {
    if (!selectedCompanyId && companiesQuery.data?.length) {
      setSelectedCompanyId(companiesQuery.data[0].company.id)
    }
  }, [companiesQuery.data, selectedCompanyId])

  useEffect(() => {
    if (detailQuery.data?.subscription?.plan_id) {
      setSelectedPlanId(detailQuery.data.subscription.plan_id)
    }
  }, [detailQuery.data?.subscription?.plan_id])

  async function invalidateCompanyData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] }),
      queryClient.invalidateQueries({ queryKey: ["admin-company", selectedCompanyId] })
    ])
  }

  const suspendMutation = useMutation({
    mutationFn: () => suspendAdminCompany(selectedCompanyId as string, suspendReason),
    onSuccess: async () => {
      setMessage("Empresa suspensa.")
      setSuspendReason("")
      await invalidateCompanyData()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Falha ao suspender empresa.")
  })

  const reactivateMutation = useMutation({
    mutationFn: () => reactivateAdminCompany(selectedCompanyId as string),
    onSuccess: async () => {
      setMessage("Empresa reativada.")
      await invalidateCompanyData()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Falha ao reativar empresa.")
  })

  const changePlanMutation = useMutation({
    mutationFn: () => changeAdminCompanyPlan(selectedCompanyId as string, { plan_id: selectedPlanId }),
    onSuccess: async () => {
      setMessage("Plano atualizado.")
      await invalidateCompanyData()
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Falha ao alterar plano.")
  })

  const stats = statsQuery.data
  const selectedCompany = detailQuery.data

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-3">
        <StatCard icon={Building2} label="Empresas" value={stats?.total_companies ?? 0} />
        <StatCard icon={CheckCircle2} label="Ativas hoje" value={stats?.active_today ?? 0} />
        <StatCard icon={CreditCard} label="Em trial" value={stats?.trialing ?? 0} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Empresas</p>
              <h1 className="mt-3 text-2xl font-semibold text-slate-900">Base SaaS</h1>
            </div>
            <Button variant="outline" size="icon" onClick={() => companiesQuery.refetch()} aria-label="Atualizar empresas">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-6 space-y-3">
            {companiesQuery.data?.map((company) => (
              <CompanyRow
                key={company.company.id}
                company={company}
                active={selectedCompanyId === company.company.id}
                onSelect={() => setSelectedCompanyId(company.company.id)}
              />
            ))}
            {!companiesQuery.data?.length && <p className="text-sm text-slate-500">Nenhuma empresa encontrada.</p>}
          </div>
        </Card>

        <Card className="p-6">
          {selectedCompany ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Detalhes</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">{selectedCompany.company.trade_name}</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    {selectedCompany.company.email} • {selectedCompany.company.cnpj}
                  </p>
                </div>
                <StatusBadge status={selectedCompany.subscription?.status ?? "sem assinatura"} />
              </div>

              {message && <p className="rounded-2xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">{message}</p>}

              {selectedCompany.subscription && (
                <div className="grid gap-4 md:grid-cols-3">
                  <UsageTile label="Usuários" metric={selectedCompany.usage?.users} />
                  <UsageTile label="Produtos" metric={selectedCompany.usage?.products} />
                  <UsageTile label="Vendas/mês" metric={selectedCompany.usage?.sales_per_month} />
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div>
                  <Label>Plano</Label>
                  <select
                    className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm"
                    value={selectedPlanId}
                    onChange={(event) => setSelectedPlanId(event.target.value)}
                  >
                    {plansQuery.data?.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name} • {currency(plan.price_monthly)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <Button disabled={!selectedPlanId || changePlanMutation.isPending} onClick={() => changePlanMutation.mutate()}>
                    Alterar plano
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
                <div>
                  <Label>Motivo da suspensão</Label>
                  <Textarea value={suspendReason} onChange={(event) => setSuspendReason(event.target.value)} />
                </div>
                <div className="flex items-end">
                  <Button
                    className="gap-2"
                    variant="outline"
                    disabled={!suspendReason.trim() || suspendMutation.isPending}
                    onClick={() => suspendMutation.mutate()}
                  >
                    <PauseCircle className="h-4 w-4" />
                    Suspender
                  </Button>
                </div>
                <div className="flex items-end">
                  <Button className="gap-2" disabled={reactivateMutation.isPending} onClick={() => reactivateMutation.mutate()}>
                    <CheckCircle2 className="h-4 w-4" />
                    Reativar
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900">Cobranças</h3>
                <div className="mt-3 space-y-3">
                  {selectedCompany.billing_history.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{item.description ?? "Cobrança"}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{currency(item.amount)}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.status}</p>
                      </div>
                    </div>
                  ))}
                  {!selectedCompany.billing_history.length && <p className="text-sm text-slate-500">Sem cobranças registradas.</p>}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Selecione uma empresa.</p>
          )}
        </Card>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: number }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

function CompanyRow({ company, active, onSelect }: { company: AdminCompanyListItem; active: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
        active ? "border-teal-300 bg-teal-50" : "border-line bg-white hover:border-teal-200"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{company.company.trade_name}</p>
          <p className="mt-1 text-sm text-slate-500">{company.company.email}</p>
        </div>
        <StatusBadge status={company.subscription?.status ?? "sem assinatura"} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {company.subscription?.plan.name ?? "Sem plano"} • criada em {new Intl.DateTimeFormat("pt-BR").format(new Date(company.created_at))}
      </p>
    </button>
  )
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "suspended" || status === "expired"
      ? "bg-rose-50 text-rose-700"
      : status === "trialing"
        ? "bg-amber-50 text-amber-700"
        : "bg-teal-50 text-teal-700"
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{STATUS_LABEL[status] ?? status}</span>
}

function UsageTile({ label, metric }: { label: string; metric?: UsageMetric }) {
  const value = metric ?? { current: 0, limit: 0, percentage: 0 }
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">
        {value.current}
        <span className="ml-1 text-sm font-medium text-slate-400">/ {value.limit}</span>
      </p>
      <div className="mt-3 h-2 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-teal-600" style={{ width: `${Math.min(value.percentage, 100)}%` }} />
      </div>
    </div>
  )
}
