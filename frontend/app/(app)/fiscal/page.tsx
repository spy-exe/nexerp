"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { FileText, Send } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { issueHomologationNfe, listFiscalDocuments, listSales } from "@/lib/auth"
import { currency, formatDateTime } from "@/lib/utils"

export default function FiscalPage() {
  const queryClient = useQueryClient()
  const salesQuery = useQuery({ queryKey: ["sales"], queryFn: listSales })
  const fiscalQuery = useQuery({ queryKey: ["fiscal-documents"], queryFn: listFiscalDocuments })
  const [saleId, setSaleId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const issueMutation = useMutation({
    mutationFn: issueHomologationNfe,
    onSuccess: async () => {
      setSaleId("")
      setError(null)
      await queryClient.invalidateQueries({ queryKey: ["fiscal-documents"] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Falha ao emitir NF-e.")
    }
  })

  async function handleIssue() {
    if (!saleId) {
      setError("Selecione uma venda concluída.")
      return
    }
    await issueMutation.mutateAsync(saleId)
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Fiscal</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">NF-e em homologação</h1>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Emissão modelo 55 com chave de acesso, XML, protocolo controlado e endpoint SEFAZ de homologação isolado para troca pelo cliente SOAP com certificado.
          </p>

          <div className="mt-8 space-y-3">
            <Label>Venda para emissão</Label>
            <select
              className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm"
              value={saleId}
              onChange={(event) => setSaleId(event.target.value)}
            >
              <option value="">Selecione uma venda</option>
              {salesQuery.data?.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  {sale.sale_number} - {currency(sale.total_amount)}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button className="gap-2" disabled={issueMutation.isPending} type="button" onClick={handleIssue}>
              <Send className="h-4 w-4" />
              {issueMutation.isPending ? "Emitindo..." : "Emitir NF-e homologação"}
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-teal-700">Documentos</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Últimas NF-e</h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {fiscalQuery.data?.map((document) => (
              <div key={document.id} className="rounded-lg border border-line bg-white p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">NF-e {document.series}/{document.number}</p>
                    <p className="mt-1 font-mono text-xs text-slate-500">{document.access_key}</p>
                    <p className="mt-2 text-sm text-slate-500">{document.response_message}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{currency(document.total_amount)}</p>
                    <p className="mt-1 text-xs uppercase text-teal-700">{document.status}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDateTime(document.issued_at)}</p>
                  </div>
                </div>
              </div>
            ))}
            {!fiscalQuery.data?.length && <p className="text-sm text-slate-500">Nenhum documento fiscal emitido.</p>}
          </div>
        </Card>
      </section>
    </div>
  )
}
