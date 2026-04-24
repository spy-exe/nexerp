"use client"

import { SalesWorkspace } from "@/components/commercial/sales-workspace"

export default function PosPage() {
  return (
    <SalesWorkspace
      channel="pos"
      title="PDV básico"
      subtitle="Balcão"
      description="Fluxo rápido para operação de caixa: carrinho enxuto, fechamento imediato, troco calculado e integração direta com o estoque."
    />
  )
}
