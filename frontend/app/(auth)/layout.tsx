export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.18),_transparent_24%),linear-gradient(145deg,_#f6f1e8_0%,_#f8fbff_55%,_#eef6f3_100%)] px-6 py-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl overflow-hidden rounded-[32px] border border-white/60 bg-white/75 shadow-soft backdrop-blur lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden bg-[#0f172a] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.4em] text-cyan-200">NexERP</p>
            <h2 className="mt-8 text-4xl font-semibold leading-tight">Foundation com foco em operação real.</h2>
            <p className="mt-5 max-w-md text-slate-300">
              Cadastro da empresa, autenticação segura, onboarding orientado e catálogo pronto para crescer sem gambiarra.
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-200">Stack</p>
            <p className="mt-3">FastAPI, SQLAlchemy, Next.js, Tailwind, React Query, Zustand e PostgreSQL.</p>
          </div>
        </section>
        <section className="flex items-center justify-center px-6 py-10 md:px-10">{children}</section>
      </div>
    </div>
  )
}
