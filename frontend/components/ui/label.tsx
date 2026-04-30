import { cn } from "@/lib/utils"

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-slate-700", className)}>{children}</label>
}
