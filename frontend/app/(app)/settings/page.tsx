import { Card } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <Card className="p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Configurações</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Base pronta para próximas fases</h1>
      <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
        A Fase 1 abriu os pilares de autenticação, onboarding, catálogo e estoque. As telas de permissões, integrações
        e auditoria podem evoluir sobre este mesmo shell nas próximas iterações.
      </p>
    </Card>
  )
}
