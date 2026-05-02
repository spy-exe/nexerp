"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertTriangle, Building2, CheckCircle2, CreditCard, PauseCircle, RefreshCw, SearchX, Users } from "lucide-react"

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

  const isLoadingCompanies = companiesQuery.isLoading || statsQuery.isLoading

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-3">
        <StatCard icon={Building2} label="Empresas" value={stats?.total_companies ?? 0} loading={statsQuery.isLoading} />
        <StatCard icon={CheckCircle2} label="Ativas hoje" value={stats?.active_today ?? 0} loading={statsQuery.isLoading} />
        <StatCard icon={CreditCard} label="Em trial" value={stats?.trialing ?? 0} loading={statsQuery.isLoading} />
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
          {companiesQuery.error && (
            <InlineNotice tone="danger" text={companiesQuery.error instanceof Error ? companiesQuery.error.message : "Falha ao carregar empresas."} />
          )}
          <div className="mt-6 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {isLoadingCompanies &&
              Array.from({ length: 4 }).map((_, index) => <SkeletonRow key={index} />)}
            {companiesQuery.data?.map((company) => (
              <CompanyRow
                key={company.company.id}
                company={company}
                active={selectedCompanyId === company.company.id}
                onSelect={() => setSelectedCompanyId(company.company.id)}
              />
            ))}
            {!isLoadingCompanies && !companiesQuery.data?.length && (
              <EmptyState icon={SearchX} title="Nenhuma empresa cadastrada" text="Assim que uma empresa entrar no SaaS, ela aparece aqui para suporte e cobrança." />
            )}
          </div>
        </Card>

        <Card className="p-6">
          {detailQuery.isLoading ? (
            <div className="space-y-5">
              <div className="h-5 w-28 rounded bg-slate-100" />
              <div className="h-8 w-2/3 rounded bg-slate-100" />
              <div className="grid gap-4 md:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-28 rounded-2xl bg-slate-100" />
                ))}
              </div>
            </div>
          ) : selectedCompany ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Detalhes</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-900">{selectedCompany.company.trade_name}</h2>
                  <p className="mt-2 break-words text-sm text-slate-500">
                    {selectedCompany.company.email} · {selectedCompany.company.cnpj}
                  </p>
                </div>
                <StatusBadge status={selectedCompany.subscription?.status ?? "sem assinatura"} />
              </div>

              {message && <InlineNotice tone="success" text={message} />}
              {detailQuery.error && (
                <InlineNotice tone="danger" text={detailQuery.error instanceof Error ? detailQuery.error.message : "Falha ao carregar detalhes."} />
              )}

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
                    className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
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
                <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
                  {selectedCompany.billing_history.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{item.description ?? "Cobrança"}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{currency(item.amount)}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.status}</p>
                      </div>
                    </div>
                  ))}
                  {!selectedCompany.billing_history.length && (
                    <EmptyState icon={CreditCard} title="Sem cobranças registradas" text="O histórico financeiro desta empresa ainda não recebeu lançamentos." />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={Building2} title="Selecione uma empresa" text="Escolha uma empresa na lista para revisar plano, uso e cobranças." />
          )}
        </Card>
      </section>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, loading }: { icon: typeof Building2; label: string; value: number; loading?: boolean }) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-slate-900">{loading ? "..." : value}</p>
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
      className={`w-full px-4 py-3 text-left transition ${
        active ? "bg-teal-50" : "bg-white hover:bg-slate-50"
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{company.company.trade_name}</p>
          <p className="mt-1 break-words text-sm text-slate-500">{company.company.email}</p>
        </div>
        <StatusBadge status={company.subscription?.status ?? "sem assinatura"} />
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {company.subscription?.plan.name ?? "Sem plano"} · criada em {new Intl.DateTimeFormat("pt-BR").format(new Date(company.created_at))}
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

function InlineNotice({ text, tone }: { text: string; tone: "success" | "danger" }) {
  const classes = tone === "danger" ? "border-rose-100 bg-rose-50 text-rose-700" : "border-teal-100 bg-teal-50 text-teal-800"
  return (
    <div className={`mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${classes}`}>
      {tone === "danger" && <AlertTriangle className="h-4 w-4 shrink-0" />}
      <span className="min-w-0 break-words">{text}</span>
    </div>
  )
}

function EmptyState({ icon: Icon, title, text }: { icon: typeof Building2; title: string; text: string }) {
  return (
    <div className="px-4 py-8 text-center">
      <Icon className="mx-auto h-5 w-5 text-slate-400" />
      <p className="mt-3 font-medium text-slate-800">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{text}</p>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="px-4 py-3">
      <div className="h-4 w-2/3 rounded bg-slate-100" />
      <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
    </div>
  )
}
