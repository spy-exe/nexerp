import Link from "next/link"
import { ArrowRight, Boxes, Building2, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const highlights = [
  {
    title: "Cadastro brasileiro nativo",
    description: "Base pronta para CNPJ, CEP, fluxo fiscal e onboarding da empresa.",
    icon: Building2
  },
  {
    title: "Segurança desde o dia zero",
    description: "JWT com rotação de refresh token, rate limit e trilha de auditoria.",
    icon: ShieldCheck
  },
  {
    title: "Catálogo e estoque já integrados",
    description: "Produtos, categorias e movimentações no mesmo backbone multi-tenant.",
    icon: Boxes
  }
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(13,148,136,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_26%),linear-gradient(180deg,_#f7f3eb_0%,_#fbfdff_100%)] px-6 py-10 md:px-12">
      <section className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-teal-700">Foundation Phase</p>
            <h1 className="mt-5 max-w-2xl text-5xl font-semibold leading-tight text-slate-900 md:text-6xl">
              ERP profissional, em português, com base técnica que aguenta crescer.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              O NexERP já nasce com autenticação completa, onboarding da empresa, catálogo de produtos e controle de
              estoque básico operando na mesma arquitetura multi-tenant.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/register">
                <Button className="gap-2">
                  Começar cadastro
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline">Entrar</Button>
              </Link>
            </div>
          </div>
          <Card className="overflow-hidden border-0 bg-[#0f172a] p-8 text-white">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-200">Setup atual</p>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm text-slate-400">Backend</p>
                  <p className="text-xl font-semibold">FastAPI + SQLAlchemy + Alembic</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Frontend</p>
                  <p className="text-xl font-semibold">Next.js 14 + Tailwind + React Query</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Infra</p>
                  <p className="text-xl font-semibold">Docker, PostgreSQL, Redis e Celery</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
