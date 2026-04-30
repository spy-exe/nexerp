import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
  open: "bg-blue-50 text-blue-700 border-blue-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  received: "bg-emerald-50 text-emerald-700 border-emerald-200",
  authorized_homologation: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

const statusLabels: Record<string, string> = {
  active: "Ativo",
  archived: "Arquivado",
  open: "Aberto",
  partial: "Parcial",
  paid: "Pago",
  overdue: "Vencido",
  cancelled: "Cancelado",
  draft: "Rascunho",
  confirmed: "Confirmado",
  completed: "Concluído",
  received: "Recebido",
  authorized_homologation: "Autorizada homologação",
}

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", statusStyles[status] ?? statusStyles.open, className)}>
      {label ?? statusLabels[status] ?? status}
    </span>
  )
}
