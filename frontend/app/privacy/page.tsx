import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const sections = [
  {
    title: "Dados coletados",
    body: "O NexERP armazena dados necessários para autenticação, cadastro de empresas, usuários, clientes, fornecedores, produtos, vendas, compras, estoque, financeiro e auditoria."
  },
  {
    title: "Finalidade",
    body: "Os dados são usados para executar as rotinas do ERP, proteger acessos, rastrear alterações, gerar relatórios e viabilizar integrações configuradas pela própria empresa."
  },
  {
    title: "Controle e retenção",
    body: "Em instalações próprias, a empresa operadora controla banco, backups e políticas de retenção. Recomenda-se limitar acessos, usar senhas fortes e manter backups protegidos."
  },
  {
    title: "Compartilhamento",
    body: "O sistema não compartilha dados por padrão. Integrações fiscais, financeiras ou de terceiros podem transmitir dados apenas quando configuradas e acionadas pela empresa."
  }
]

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-[var(--fg)]">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-medium text-[#00d4ff]">
          NexERP
        </Link>
        <div className="mt-10">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-[#00ff88]">Privacidade</p>
          <h1 className="mt-3 text-4xl font-bold">Política de Privacidade</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--fg-muted)]">
            Como o NexERP trata dados em uma instalação auto-hospedada ou ambiente de demonstração.
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
          <Link href="/terms">
            <Button variant="outline">Termos de Uso</Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
