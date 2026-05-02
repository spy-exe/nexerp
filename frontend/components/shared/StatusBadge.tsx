import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  active:                  "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
  archived:                "bg-white/5 text-[#888888] border-white/10",
  open:                    "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20",
  partial:                 "bg-[#ffd700]/10 text-[#ffd700] border-[#ffd700]/20",
  paid:                    "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
  overdue:                 "bg-[#ff4444]/10 text-[#ff4444] border-[#ff4444]/20",
  cancelled:               "bg-white/5 text-[#888888] border-white/10",
  draft:                   "bg-white/5 text-[#aaaaaa] border-white/10",
  confirmed:               "bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/20",
  completed:               "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
  received:                "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
  authorized_homologation: "bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20",
}

const statusLabels: Record<string, string> = {
  active:                  "Ativo",
  archived:                "Arquivado",
  open:                    "Aberto",
  partial:                 "Parcial",
  paid:                    "Pago",
  overdue:                 "Vencido",
  cancelled:               "Cancelado",
  draft:                   "Rascunho",
  confirmed:               "Confirmado",
  completed:               "Concluído",
  received:                "Recebido",
  authorized_homologation: "Autorizada homologação",
}

export function StatusBadge({ status, label, className }: { status: string; label?: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-1 text-xs font-medium",
        statusStyles[status] ?? statusStyles.open,
        className
      )}
    >
      {label ?? statusLabels[status] ?? status}
    </span>
  )
}
