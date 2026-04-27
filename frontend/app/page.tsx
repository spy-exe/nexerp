import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Barcode,
  FileText,
  Gauge,
  LockKeyhole,
  PackageSearch,
  ShieldCheck
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const modules = [
  { title: "Comercial", description: "Clientes, fornecedores, vendas, compras e PDV.", icon: BadgeCheck },
  { title: "Financeiro", description: "Contas, fluxo de caixa, transações e exportações.", icon: Banknote },
  { title: "Fiscal", description: "NF-e modelo 55 em homologação com trilha auditável.", icon: FileText },
  { title: "Estoque", description: "Saldos, movimentações, SKU e código de barras.", icon: PackageSearch }
]

const guarantees = [
  "Setup local com Docker Compose",
  "Multi-tenant com company_id e RLS",
  "JWT curto com refresh token rotativo",
  "Rate limit, headers de segurança e auditoria"
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f3efe3] text-slate-950">
      <section className="relative px-6 py-8 md:px-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(20,184,166,0.24),transparent_28%),radial-gradient(circle_at_86%_16%,rgba(245,158,11,0.24),transparent_24%),linear-gradient(135deg,#f9f5ea_0%,#eef7f4_48%,#fffaf0_100%)]" />
        <div className="relative mx-auto max-w-7xl">
          <nav className="flex items-center justify-between rounded-full border border-white/70 bg-white/60 px-5 py-3 shadow-soft backdrop-blur">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-teal-700">NexERP</p>
              <p className="text-xs text-slate-500">Open source para PMEs brasileiras</p>
            </div>
            <div className="flex gap-3">
              <Link href="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
              <Link href="/register">
                <Button>Começar</Button>
              </Link>
            </div>
          </nav>

          <div className="grid gap-10 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div>
              <div className="inline-flex rounded-full border border-teal-200 bg-white/70 px-4 py-2 text-sm font-medium text-teal-800">
                v1.0.0 pronto para operação interna, homologação fiscal e evolução comunitária.
              </div>
              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-slate-950 md:text-7xl">
                ERP brasileiro sem fricção para vender, controlar e auditar.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                NexERP une comercial, financeiro, estoque, fiscal em homologação, permissões e auditoria em uma base FastAPI + Next.js pensada para pequenas e médias empresas.
              </p>
              <div className="mt-9 flex flex-wrap gap-4">
                <Link href="/register">
                  <Button className="gap-2 px-6">
                    Criar empresa
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="px-6">Ver dashboard</Button>
                </Link>
              </div>
            </div>

            <Card className="relative overflow-hidden border-0 bg-slate-950 p-4 text-white shadow-2xl">
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/20 blur-3xl" />
              <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-200">Painel operacional</p>
                    <h2 className="mt-3 text-2xl font-semibold">R$ 184.920,00</h2>
                    <p className="text-sm text-slate-400">Receita consolidada do mês</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-400/15 p-3 text-emerald-300">
                    <Gauge className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-2">
                  {modules.map(({ title, description, icon: Icon }) => (
                    <div key={title} className="rounded-[22px] border border-white/10 bg-white/[0.06] p-4">
                      <Icon className="h-5 w-5 text-cyan-200" />
                      <p className="mt-4 font-semibold">{title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-[22px] border border-amber-200/20 bg-amber-300/10 p-4">
                  <div className="flex items-center gap-3">
                    <Barcode className="h-5 w-5 text-amber-200" />
                    <p className="font-semibold text-amber-50">PDV com leitor USB</p>
                  </div>
                  <p className="mt-2 text-sm text-amber-100/80">Bipe código de barras, baixa estoque e feche venda no mesmo fluxo.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 md:px-12">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <Card className="bg-white/75 p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-slate-950">Base segura antes do primeiro cliente.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Autenticação, auditoria, rate limiting, CORS controlado e permissões por módulo fazem parte do produto, não de uma fase posterior.
            </p>
          </Card>
          <div className="grid gap-4 md:grid-cols-2">
            {guarantees.map((item) => (
              <div key={item} className="rounded-[28px] border border-white/80 bg-white/70 p-5 shadow-soft">
                <LockKeyhole className="h-5 w-5 text-teal-700" />
                <p className="mt-4 font-medium text-slate-900">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
