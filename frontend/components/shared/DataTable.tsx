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
    <div className="overflow-hidden rounded-xl border border-[color:var(--border)] bg-[var(--bg-card)]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--bg-muted)] text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    "h-10 whitespace-nowrap px-4 text-left",
                    column.key === "actions" && "sticky right-0 bg-[var(--bg-card)] text-right",
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
              <tr
                key={getRowKey(row)}
                className="h-12 border-b border-[color:var(--border)] transition-colors hover:bg-[var(--bg-muted)]"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 align-middle text-[var(--fg)]",
                      column.key === "actions" && "sticky right-0 bg-[var(--bg-card)] text-right",
                      column.className
                    )}
                  >
                    {column.render
                      ? column.render(row)
                      : String((row as Record<string, unknown>)[column.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-[color:var(--border)] px-4 py-3 text-sm text-[var(--fg-muted)] sm:flex-row sm:items-center sm:justify-between">
        <span>
          Exibindo {from}–{to} de {rows.length} resultados
        </span>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((c) => Math.max(c - 1, 0))}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((c) => Math.min(c + 1, totalPages - 1))}
          >
            Próx
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
