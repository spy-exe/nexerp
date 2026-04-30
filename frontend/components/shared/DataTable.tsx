"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type DataTableColumn<T> = {
  key: string
  label: string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

type DataTableProps<T> = {
  rows: T[]
  columns: Array<DataTableColumn<T>>
  getRowKey: (row: T) => string
  emptyState?: React.ReactNode
  pageSize?: number
}

export function DataTable<T>({ rows, columns, getRowKey, emptyState, pageSize = 10 }: DataTableProps<T>) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(Math.ceil(rows.length / pageSize), 1)
  const start = page * pageSize
  const pageRows = rows.slice(start, start + pageSize)
  const from = rows.length ? start + 1 : 0
  const to = Math.min(start + pageSize, rows.length)

  if (!rows.length) {
    return <>{emptyState}</>
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "h-10 whitespace-nowrap px-4 text-left",
                    column.key === "actions" && "sticky right-0 bg-slate-50 text-right",
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={getRowKey(row)} className="h-12 border-b border-slate-100 transition hover:bg-slate-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 align-middle",
                      column.key === "actions" && "sticky right-0 bg-white text-right",
                      column.className
                    )}
                  >
                    {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Exibindo {from}-{to} de {rows.length} resultados
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((current) => Math.max(current - 1, 0))}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Ant
          </Button>
          <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage((current) => Math.min(current + 1, totalPages - 1))}>
            Próx
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
