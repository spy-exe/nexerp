import Link from "next/link"
import { Zap } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="mx-auto grid min-h-screen max-w-[1400px] lg:grid-cols-[1fr_1fr]">
        {/* ── Left panel ── */}
        <section className="relative hidden overflow-hidden bg-[#0d0d0d] px-12 py-10 lg:flex lg:flex-col lg:justify-between">
          {/* radial accent */}
          <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#00ff88]/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 rounded-full bg-[#00d4ff]/[0.04] blur-3xl" />

          <Link href="/" className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00ff88]">
              <Zap className="h-5 w-5 text-[#0a0a0a]" />
            </div>
            <span className="font-display text-xl font-semibold text-[#f0f0f0]">NexERP</span>
          </Link>

          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-widest text-[#00ff88]">
              Para PMEs brasileiras
            </p>
            <h2 className="font-display mt-4 text-4xl font-bold leading-tight tracking-tight text-[#f0f0f0]">
              Gratuito.
              <br />
              Completo.
              <br />
              Sem complicação.
            </h2>
            <p className="mt-5 max-w-sm text-[#888888]">
              Vendas, estoque, financeiro, NF-e e auditoria num único sistema
              construído sobre FastAPI + Next.js.
            </p>

            <div className="mt-10 space-y-3">
              {[
                "PDV com leitor de código de barras",
                "NF-e em homologação inclusa",
                "Permissões e auditoria completas",
                "Open source e auto-hospedável"
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-[#aaaaaa]">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#00ff88]" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-[#444444]">
            © {new Date().getFullYear()} NexERP — open source MIT
          </p>
        </section>

        {/* ── Right panel ── */}
        <section className="flex items-center justify-center px-6 py-10">
          {children}
        </section>
      </div>
    </div>
  )
}
