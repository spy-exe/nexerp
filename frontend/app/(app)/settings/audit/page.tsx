"use client"

import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { listAuditLogs } from "@/lib/auth"
import { formatDateTime } from "@/lib/utils"

export default function AuditPage() {
  const [tableName, setTableName] = useState("")
  const [action, setAction] = useState("")
  const [filters, setFilters] = useState<Record<string, string>>({ limit: "100" })
  const auditQuery = useQuery({ queryKey: ["audit-logs", filters], queryFn: () => listAuditLogs(filters) })

  function applyFilters() {
    setFilters({
      limit: "100",
      ...(tableName ? { table_name: tableName } : {}),
      ...(action ? { action } : {})
    })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-blue-700">Auditoria</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Log de ações críticas</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <Label>Tabela</Label>
            <Input placeholder="fiscal_documents" value={tableName} onChange={(event) => setTableName(event.target.value)} />
          </div>
          <div>
            <Label>Ação</Label>
            <Input placeholder="fiscal.nfe.homologation_issued" value={action} onChange={(event) => setAction(event.target.value)} />
          </div>
          <div className="flex items-end">
            <Button className="gap-2" type="button" onClick={applyFilters}>
              <Search className="h-4 w-4" />
              Filtrar
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-3">
          {auditQuery.data?.map((log) => (
            <div key={log.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{log.action}</p>
                  <p className="mt-1 text-sm text-slate-500">{log.table_name} • {log.record_id}</p>
                  {log.note && <p className="mt-2 text-sm text-slate-500">{log.note}</p>}
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{formatDateTime(log.created_at)}</p>
                  <p>{log.ip_address ?? "IP não informado"}</p>
                </div>
              </div>
            </div>
          ))}
          {!auditQuery.data?.length && <p className="text-sm text-slate-500">Nenhum log encontrado.</p>}
        </div>
      </Card>
    </div>
  )
}
