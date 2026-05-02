import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const sections = [
  {
    title: "Uso da plataforma",
    body: "O NexERP é fornecido para gestão operacional, comercial, financeira e fiscal de empresas. O usuário é responsável pela veracidade dos dados cadastrados e pelo uso adequado das funcionalidades."
  },
  {
    title: "Conta e segurança",
    body: "Cada usuário deve manter suas credenciais em sigilo. Ações realizadas na conta podem ser registradas em auditoria para segurança, rastreabilidade e conformidade operacional."
  },
  {
    title: "Dados fiscais e integrações",
    body: "Recursos fiscais, incluindo NF-e, dependem de configurações, certificados e disponibilidade de serviços externos. Emissões devem ser conferidas pelo responsável fiscal da empresa."
  },
  {
    title: "Software open source",
    body: "O projeto é distribuído sob licença MIT. Você pode usar, modificar e distribuir o código conforme os termos da licença incluída no repositório."
  }
]

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--fg)]">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-medium text-[#00d4ff]">
          NexERP
        </Link>
        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00ff88]">Legal</p>
          <h1 className="mt-3 text-4xl font-bold">Termos de Uso</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--fg-muted)]">
            Condições gerais para uso do NexERP em ambientes de desenvolvimento, demonstração ou operação própria.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {sections.map((section) => (
            <Card key={section.title} className="p-6">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fg-muted)]">{section.body}</p>
            </Card>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/register">
            <Button>Voltar ao cadastro</Button>
          </Link>
          <Link href="/privacy">
            <Button variant="outline">Política de Privacidade</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
