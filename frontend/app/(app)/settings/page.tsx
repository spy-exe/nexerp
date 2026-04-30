import Link from "next/link"
import { ClipboardList, ShieldCheck } from "lucide-react"

import { Card } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="p-8">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Configurações</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900">Governança operacional</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Permissões granulares e auditoria centralizada para controlar ações críticas por módulo.
        </p>
      </Card>

      <section className="grid gap-6 md:grid-cols-2">
        <SettingsLink
          href="/settings/permissions"
          icon={ShieldCheck}
          title="Permissões"
          description="Gerencie papéis e permissões por módulo."
        />
        <SettingsLink
          href="/settings/audit"
          icon={ClipboardList}
          title="Auditoria"
          description="Consulte ações críticas registradas por usuário, tabela e evento."
        />
      </section>
    </div>
  )
}

function SettingsLink({ href, icon: Icon, title, description }: { href: string; icon: typeof ShieldCheck; title: string; description: string }) {
  return (
    <Link href={href}>
      <Card className="p-6 transition hover:-translate-y-0.5 hover:border-blue-300">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  )
}
