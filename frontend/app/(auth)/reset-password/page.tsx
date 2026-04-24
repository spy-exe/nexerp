import Link from "next/link"

import { Card } from "@/components/ui/card"

export default function ResetPasswordIndexPage() {
  return (
    <Card className="w-full max-w-xl p-8">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Reset</p>
      <h1 className="mt-4 text-3xl font-semibold text-slate-900">Link de redefinição necessário</h1>
      <p className="mt-4 text-sm text-slate-600">
        Esta rota espera um token gerado no backend. Use o link recebido por e-mail ou o token de desenvolvimento
        exibido na tela de recuperação.
      </p>
      <Link href="/forgot-password" className="mt-6 inline-block text-sm text-teal-700 hover:underline">
        Solicitar novo token
      </Link>
    </Card>
  )
}
