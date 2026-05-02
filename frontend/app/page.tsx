import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  FileText,
  Package,
  ReceiptText,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap
} from "lucide-react"

import { Button } from "@/components/ui/button"

const features = [
  {
    icon: ReceiptText,
    title: "Vendas",
    description: "PDV, orçamentos, pedidos e histórico completo de vendas por cliente.",
    color: "#00ff88"
  },
  {
    icon: Package,
    title: "Estoque",
    description: "Saldos em tempo real, SKU, código de barras e alertas de estoque mínimo.",
    color: "#00d4ff"
  },
  {
    icon: Wallet,
    title: "Financeiro",
    description: "Contas a pagar, contas a receber, fluxo de caixa e conciliação bancária.",
    color: "#ffd700"
  },
  {
    icon: FileText,
    title: "NF-e",
    description: "Emissão de nota fiscal eletrônica modelo 55 em homologação, trilha auditável.",
    color: "#00ff88"
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Análise de vendas, ranking de produtos, margem e desempenho financeiro.",
    color: "#00d4ff"
  },
  {
    icon: Users,
    title: "Multi-usuário",
    description: "Perfis com permissões granulares por módulo, auditoria de cada ação.",
    color: "#ffd700"
  }
]

const steps = [
  {
    number: "01",
    title: "Crie sua conta",
    description: "Cadastro em menos de 2 minutos. Sem cartão de crédito, sem burocracia."
  },
  {
    number: "02",
    title: "Configure sua empresa",
    description: "Informe CNPJ, regime tributário e dados fiscais. O onboarding guia cada passo."
  },
  {
    number: "03",
    title: "Comece a operar",
    description: "Cadastre produtos, abra vendas no PDV e acompanhe o financeiro em tempo real."
  }
]

const betaFeatures = [
  "Vendas, PDV e compras",
  "Gestão de estoque e produtos",
  "Financeiro e fluxo de caixa",
  "NF-e em homologação",
  "Relatórios avançados",
  "Permissões multi-usuário",
  "Auditoria completa",
  "API FastAPI aberta"
]

const testimonials = [
  {
    name: "Mariana Costa",
    role: "Sócia-fundadora, Ateliê Viva",
    content:
      "Finalmente um ERP que não parece uma planilha dos anos 90. O PDV com leitor de barras revolucionou nosso caixa. Controle de estoque que antes levava horas agora é automático."
  },
  {
    name: "Rafael Mendes",
    role: "Diretor financeiro, Distribuidora Alfa",
    content:
      "Migramos em um fim de semana. O financeiro integrado com as vendas fechou uma lacuna enorme — nada de planilha separada para conciliar. Recomendo sem hesitar."
  },
  {
    name: "Tatiana Rocha",
    role: "Gerente de TI, Grupo Serra Verde",
    content:
      "Implementamos para três unidades. As permissões granulares e a trilha de auditoria nos deram a governança que precisávamos sem o custo de um ERP enterprise."
  }
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0a0a] text-[#f0f0f0]">
      {/* ── Nav ── */}
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00ff88]">
              <Zap className="h-4 w-4 text-[#0a0a0a]" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">NexERP</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Entrar
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Começar grátis
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        {/* Radial glow background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-[600px] w-[600px] rounded-full bg-[#00ff88]/[0.04] blur-3xl" />
        </div>
        <div className="pointer-events-none absolute top-1/3 left-1/4 h-[300px] w-[300px] rounded-full bg-[#00d4ff]/[0.04] blur-3xl" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5 px-4 py-2 text-sm text-[#00ff88]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00ff88] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00ff88]" />
            </span>
            Beta aberta — acesso 100% gratuito
          </div>

          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-[#f0f0f0] md:text-7xl">
            O ERP que sua
            <br />
            <span className="text-[#00ff88]">empresa merece.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-[#888888]">
            Gratuito. Completo. Sem complicação.
            <br />
            Vendas, estoque, financeiro, NF-e e auditoria numa plataforma
            construída para PMEs brasileiras.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/register">
              <Button className="h-11 px-6 text-base">
                Começar agora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-11 px-6 text-base">
                Ver demonstração
              </Button>
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-[#888888]">
            {["Sem cartão de crédito", "Setup em minutos", "Open source"].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#00ff88]" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[#00ff88]">
              Módulos
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[#f0f0f0] md:text-5xl">
              Tudo que sua empresa precisa
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[#888888]">
              Cada módulo integrado e pensado para o fluxo real de uma PME brasileira.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#111111] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]"
              >
                <div
                  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: `${color}15`, color }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-semibold text-[#f0f0f0]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[#888888]">{description}</p>
                <ChevronRight
                  className="absolute right-4 top-4 h-4 w-4 text-[#333333] transition-colors group-hover:text-[#00ff88]"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Como funciona ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[#00d4ff]">
              Como funciona
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[#f0f0f0] md:text-5xl">
              3 passos para começar
            </h2>
          </div>

          <div className="relative grid gap-8 lg:grid-cols-3">
            {/* connector line */}
            <div className="absolute top-8 left-0 right-0 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

            {steps.map(({ number, title, description }) => (
              <div key={number} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#00ff88]/20 bg-[#00ff88]/5">
                  <span className="font-display text-xl font-bold text-[#00ff88]">{number}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-[#f0f0f0]">{title}</h3>
                <p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-[#888888]">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Beta Plan ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl border border-[#00ff88]/20 bg-[#111111] p-10 md:p-16">
            {/* glow */}
            <div className="pointer-events-none absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#00ff88]/10 blur-3xl" />

            <div className="relative grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#00ff88]/20 bg-[#00ff88]/10 px-3 py-1 text-sm font-medium text-[#00ff88]">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Sem cartão de crédito
                </span>
                <h2 className="font-display mt-6 text-4xl font-bold tracking-tight text-[#f0f0f0]">
                  Gratuito durante o beta
                </h2>
                <p className="mt-4 text-[#888888]">
                  Acesso completo a todos os módulos enquanto estamos no beta. Sem limite de usuários, sem surpresas.
                </p>
                <Link href="/register" className="mt-8 inline-block">
                  <Button className="h-11 px-8 text-base">
                    Criar conta grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {betaFeatures.map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-[#d0d0d0]">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00ff88]" />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-[#00d4ff]">
              Depoimentos
            </p>
            <h2 className="font-display text-4xl font-bold tracking-tight text-[#f0f0f0] md:text-5xl">
              Quem já usa o NexERP
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map(({ name, role, content }) => (
              <div
                key={name}
                className="flex flex-col justify-between rounded-xl border border-white/[0.06] bg-[#111111] p-6"
              >
                <div>
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#ffd700] text-[#ffd700]" />
                    ))}
                  </div>
                  <p className="text-sm leading-7 text-[#cccccc]">{`"${content}"`}</p>
                </div>
                <div className="mt-6 border-t border-white/[0.06] pt-4">
                  <p className="font-semibold text-[#f0f0f0]">{name}</p>
                  <p className="mt-0.5 text-xs text-[#888888]">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00ff88]">
                  <Zap className="h-4 w-4 text-[#0a0a0a]" />
                </div>
                <span className="font-display text-lg font-semibold">NexERP</span>
              </div>
              <p className="max-w-xs text-sm leading-6 text-[#888888]">
                ERP gratuito e open source para pequenas e médias empresas brasileiras.
              </p>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555555]">Produto</p>
              <ul className="space-y-3 text-sm text-[#888888]">
                {["Vendas", "Estoque", "Financeiro", "NF-e", "Relatórios"].map((item) => (
                  <li key={item}>
                    <Link href="/login" className="transition-colors hover:text-[#00d4ff]">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555555]">Empresa</p>
              <ul className="space-y-3 text-sm text-[#888888]">
                {["Sobre", "Blog", "Contato"].map((item) => (
                  <li key={item}>
                    <Link href="/" className="transition-colors hover:text-[#00d4ff]">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#555555]">Acesso</p>
              <ul className="space-y-3 text-sm text-[#888888]">
                <li>
                  <Link href="/login" className="transition-colors hover:text-[#00d4ff]">
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition-colors hover:text-[#00d4ff]">
                    Criar conta
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 text-sm text-[#555555] sm:flex-row">
            <p>© {new Date().getFullYear()} NexERP. Open source sob licença MIT.</p>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#00ff88]" />
              <span>Seus dados são seus.</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
