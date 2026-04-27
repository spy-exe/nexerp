import { cn } from "@/lib/utils"

export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("mb-2 block text-sm font-medium text-slate-600", className)}>{children}</label>
}
